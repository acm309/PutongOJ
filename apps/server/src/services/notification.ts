import type { AdminNotificationCreatePayload, NotificationDispatch, NotificationMessage } from '@putong-oj/shared'
import type { Buffer } from 'node:buffer'
import type { IncomingMessage, Server } from 'node:http'
import type { Duplex } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { NOTIFICATION_CHANNEL, NotificationDispatchSchema, NotificationDispatchType, NotificationMessageType, uuidV4Regex } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { WebSocket, WebSocketServer } from 'ws'
import { z } from 'zod'
import config from '../config/index.ts'
import redis from '../config/redis.ts'
import { createLogger } from '../utils/logger.ts'
import sessionService from './session.ts'

const logger = createLogger('server.notification')

/** WebSocket upgrade path served by this module. */
const STREAM_PATH = '/ws'

/** One-time tokens are written by the token endpoint and consumed on connection. */
const TOKEN_PREFIX = 'notification:token:'
const TOKEN_TTL_SECONDS = 10
const HEARTBEAT_INTERVAL = 30_000
const CONNECTION_STATS_INTERVAL = 300_000

/** Metadata attached to an authenticated notification stream. */
interface NotificationConnection {
  userId: string
  sessionId: string
}

/** Shape of the one-time token payload stored in Redis. */
const tokenPayloadSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
})

/** Live notification streams, grouped by the uid they belong to. */
const userConnections = new Map<string, Set<WebSocket>>()

/** Connection metadata, used to revalidate the bound session on every heartbeat. */
const connectionMetadata = new WeakMap<WebSocket, NotificationConnection>()

/** Sockets that have answered the latest heartbeat ping. */
const aliveSockets = new WeakSet<WebSocket>()

let webSocketServer: WebSocketServer | null = null
let subscriber: Redis | null = null
let heartbeatTimer: NodeJS.Timeout | null = null
let statsTimer: NodeJS.Timeout | null = null
let upgradeServer: Server | null = null
let upgradeListener: ((request: IncomingMessage, socket: Duplex, head: Buffer) => void) | null = null

function createNotificationMessage (payload: AdminNotificationCreatePayload): NotificationMessage {
  const { title, content, severity, duration } = payload
  return {
    type: NotificationMessageType.Notification,
    data: {
      title,
      content,
      severity,
      life: duration === null ? null : duration * 1000,
    },
  }
}

/** Mints a short-lived, single-use token bound to the requesting user and session. */
export async function createNotificationToken (userId: string, sessionId: string): Promise<string> {
  const token = randomUUID()
  const payload: NotificationConnection = { userId, sessionId }
  await redis.setex(`${TOKEN_PREFIX}${token}`, TOKEN_TTL_SECONDS, JSON.stringify(payload))
  return token
}

/** Redeems a token, returning the bound connection, or null when it is unknown or already used. */
export async function consumeNotificationToken (token: string): Promise<NotificationConnection | null> {
  // GETDEL keeps consumption atomic so a token can never authenticate twice.
  const value = await redis.getdel(`${TOKEN_PREFIX}${token}`)
  if (!value) {
    return null
  }
  try {
    const result = tokenPayloadSchema.safeParse(JSON.parse(value))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export async function sendBroadcastNotification (payload: AdminNotificationCreatePayload): Promise<void> {
  const dispatch: NotificationDispatch = {
    type: NotificationDispatchType.Broadcast,
    message: createNotificationMessage(payload),
  }
  await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify(dispatch))
}

export async function sendUserNotification (userId: string, payload: AdminNotificationCreatePayload): Promise<void> {
  const dispatch: NotificationDispatch = {
    type: NotificationDispatchType.User,
    userId,
    message: createNotificationMessage(payload),
  }
  await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify(dispatch))
}

function addToMap (sockets: Map<string, Set<WebSocket>>, key: string, socket: WebSocket): void {
  let group = sockets.get(key)
  if (!group) {
    group = new Set()
    sockets.set(key, group)
  }
  group.add(socket)
}

function removeFromMap (sockets: Map<string, Set<WebSocket>>, key: string, socket: WebSocket): void {
  const group = sockets.get(key)
  if (!group) {
    return
  }
  group.delete(socket)
  if (group.size === 0) {
    sockets.delete(key)
  }
}

function addConnection (connection: NotificationConnection, socket: WebSocket): void {
  addToMap(userConnections, connection.userId, socket)
  connectionMetadata.set(socket, connection)

  const hello: NotificationMessage = {
    type: NotificationMessageType.Connect,
    data: { userId: connection.userId, message: 'Ciallo!' },
  }
  socket.send(JSON.stringify(hello))

  logger.info({ userId: connection.userId, sessionId: connection.sessionId }, 'User connected to notification stream')
}

function removeConnection (socket: WebSocket): void {
  const connection = connectionMetadata.get(socket)
  if (!connection) {
    return
  }
  removeFromMap(userConnections, connection.userId, socket)
  connectionMetadata.delete(socket)
}

function sendToUser (userId: string, message: NotificationMessage): void {
  const connections = userConnections.get(userId)
  if (!connections) {
    return
  }

  const payload = JSON.stringify(message)
  connections.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload)
    }
  })
  logger.info({ userId, message }, 'Sent notification to user')
}

function broadcast (message: NotificationMessage): void {
  const payload = JSON.stringify(message)
  // Only authenticated streams may receive notifications.
  userConnections.forEach((connections) => {
    connections.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload)
      }
    })
  })
  logger.info({ message }, 'Broadcast notification')
}

function handleDispatch (json: string): void {
  let payload: unknown
  try {
    payload = JSON.parse(json)
  } catch (error) {
    logger.error({ err: error }, 'Failed to parse notification dispatch')
    return
  }

  const result = NotificationDispatchSchema.safeParse(payload)
  if (!result.success) {
    logger.error({ err: result.error }, 'Invalid notification dispatch')
    return
  }

  const dispatch = result.data
  if (dispatch.type === NotificationDispatchType.Broadcast) {
    broadcast(dispatch.message)
  } else {
    sendToUser(dispatch.userId, dispatch.message)
  }
}

function resolveRequestUrl (request: IncomingMessage): URL {
  return new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
}

async function authenticate (socket: WebSocket, request: IncomingMessage): Promise<NotificationConnection | null> {
  const token = resolveRequestUrl(request).searchParams.get('token')
  if (!token || !uuidV4Regex.test(token)) {
    socket.close(1008, 'Authentication required')
    return null
  }

  const connection = await consumeNotificationToken(token)
  if (!connection) {
    socket.close(1008, 'Invalid token')
    return null
  }
  return connection
}

function handleConnection (socket: WebSocket, request: IncomingMessage): void {
  // The socket may fail during authentication, so its listeners must exist before any await.
  aliveSockets.add(socket)
  socket.on('pong', () => aliveSockets.add(socket))
  socket.on('error', (error) => {
    logger.error({ err: error }, 'Notification stream error')
  })
  socket.on('message', () => {
    socket.close(1003, 'Unsupported data')
  })
  socket.on('close', () => removeConnection(socket))

  authenticate(socket, request)
    .then((connection) => {
      // The client may have gone away while the token was being redeemed.
      if (!connection || socket.readyState !== WebSocket.OPEN) {
        return
      }
      addConnection(connection, socket)
    })
    .catch((error) => {
      logger.error({ err: error }, 'Failed to establish notification stream')
      socket.close(1011, 'Internal error')
    })
}

/**
 * Verifies liveness and the bound session of every open stream, then pings it.
 * Exported so the session check can be exercised without waiting for the interval.
 */
export async function runNotificationHeartbeat (): Promise<void> {
  const wss = webSocketServer
  if (!wss) {
    return
  }

  await Promise.all([ ...wss.clients ].map(async (socket) => {
    if (!aliveSockets.has(socket)) {
      socket.terminate()
      return
    }
    aliveSockets.delete(socket)

    if (socket.readyState !== WebSocket.OPEN) {
      return
    }

    const connection = connectionMetadata.get(socket)
    if (connection) {
      try {
        if (!(await sessionService.validateSession(connection.userId, connection.sessionId))) {
          logger.info({ userId: connection.userId, sessionId: connection.sessionId }, 'Closing notification stream with invalid session')
          socket.close(1000, 'Session expired')
          return
        }
      } catch (error) {
        logger.error({ err: error }, 'Failed to validate notification session')
      }
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.ping()
    }
  }))
}

/** Attaches the notification WebSocket gateway to an existing HTTP server. */
export function startNotificationGateway (server: Server): void {
  if (webSocketServer) {
    return
  }

  const wss = new WebSocketServer({ noServer: true })
  webSocketServer = wss

  const listener = (request: IncomingMessage, socket: Duplex, head: Buffer): void => {
    if (resolveRequestUrl(request).pathname !== STREAM_PATH) {
      // Leave upgrades for other endpoints to any other listener; only close when we are alone.
      if (server.listenerCount('upgrade') === 1) {
        socket.destroy()
      }
      return
    }
    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client, request)
    })
  }
  server.on('upgrade', listener)
  upgradeServer = server
  upgradeListener = listener

  wss.on('connection', handleConnection)

  const sub = new Redis(config.redisURL)
  subscriber = sub
  sub.on('error', (error) => {
    logger.error({ err: error }, 'Notification subscriber error')
  })
  sub.subscribe(NOTIFICATION_CHANNEL, (error) => {
    if (error) {
      logger.error({ err: error }, 'Failed to subscribe to notification channel')
    } else {
      logger.info({ channel: NOTIFICATION_CHANNEL }, 'Subscribed to notification channel')
    }
  })
  sub.on('message', (channel, message) => {
    if (channel === NOTIFICATION_CHANNEL) {
      handleDispatch(message)
    }
  })

  heartbeatTimer = setInterval(() => {
    runNotificationHeartbeat().catch((error) => {
      logger.error({ err: error }, 'Notification heartbeat failed')
    })
  }, HEARTBEAT_INTERVAL)

  statsTimer = setInterval(() => {
    logger.info({ connectedUsers: userConnections.size }, 'Connected notification users')
  }, CONNECTION_STATS_INTERVAL)

  logger.info({ path: STREAM_PATH }, 'Notification gateway started')
}

/** Stops the gateway and releases its subscriptions, cleaning up for shutdown. */
export async function stopNotificationGateway (): Promise<void> {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
  if (upgradeServer && upgradeListener) {
    upgradeServer.off('upgrade', upgradeListener)
    upgradeServer = null
    upgradeListener = null
  }
  if (webSocketServer) {
    webSocketServer.clients.forEach(socket => socket.close(1001, 'Server shutting down'))
    webSocketServer.close()
    webSocketServer = null
  }
  userConnections.clear()

  if (subscriber) {
    await subscriber.quit()
    subscriber = null
  }
}

const notificationService = {
  createNotificationToken,
  consumeNotificationToken,
  sendBroadcastNotification,
  sendUserNotification,
  startNotificationGateway,
  stopNotificationGateway,
} as const

export default notificationService
