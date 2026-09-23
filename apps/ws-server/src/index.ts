import type { WebSocketDispatch, WebSocketMessage } from '@putong-oj/shared'
import process from 'node:process'
import { uuidV4Regex, WEBSOCKET_CHANNEL, WebSocketDispatchType, WebSocketMessageType } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { WebSocket, WebSocketServer } from 'ws'
import config from './config.ts'
import { createLogger } from './logger.ts'
import redis from './redis.ts'

const logger = createLogger('ws-server')
const wss = new WebSocketServer({ port: config.port })

const userConnections = new Map<string, Set<WebSocket>>()

function addConnection (username: string, ws: WebSocket): void {
  if (!userConnections.has(username)) {
    userConnections.set(username, new Set())
  }

  const userConnection = userConnections.get(username)!
  userConnection.add(ws)

  ws.on('close', () => {
    removeConnection(username, ws)
  })
  ws.on('error', (error) => {
    logger.error({ err: error, username }, 'WebSocket error')
  })

  const helloMessage: WebSocketMessage = {
    type: WebSocketMessageType.Connect,
    data: { username, message: 'Ciallo!' },
  }
  ws.send(JSON.stringify(helloMessage))

  logger.info({ username, totalSockets: userConnection.size }, 'User connected')
}

function removeConnection (username: string, ws: WebSocket): void {
  const userConnection = userConnections.get(username)
  if (userConnection) {
    userConnection.delete(ws)
    if (userConnection.size === 0) {
      userConnections.delete(username)
    }
  }
}

function sendToUser (username: string, message: any): void {
  const userConnection = userConnections.get(username)
  if (userConnection) {
    const messageStr = JSON.stringify(message)
    userConnection.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr)
      }
    })
    logger.info({ username, message }, 'Sent message to user')
  }
}

function sendBroadcast (message: any): void {
  const messageStr = JSON.stringify(message)
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr)
    }
  })
  logger.info({ message }, 'Broadcast message')
}

wss.on('connection', async (ws, request) => {
  const url = new URL(request.url!, `http://${request.headers.host}`)
  const token = url.searchParams.get('token')

  if (!token || !uuidV4Regex.test(token)) {
    ws.close(1008, 'Authentication required')
    return
  }

  const username = await redis.get(`websocket:token:${token}`)
  if (!username) {
    ws.close(1008, 'Invalid token')
    return
  }

  await redis.del(`websocket:token:${token}`)
  addConnection(username, ws)
})

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping()
    }
  })
}, 30000)

setInterval(() => {
  const connectedUsers = userConnections.size
  logger.info({ connectedUsers }, 'Connected users')
}, 300000)

const subscriber = new Redis(config.redisURL)

subscriber.on('error', (err) => {
  logger.error({ err }, 'Redis subscriber error')
})

subscriber.subscribe(WEBSOCKET_CHANNEL, (err) => {
  if (err) {
    logger.error({ err }, 'Failed to subscribe')
  } else {
    logger.info({ channel: WEBSOCKET_CHANNEL }, 'Subscribed to channel')
  }
})

subscriber.on('message', (channel, message) => {
  if (channel === WEBSOCKET_CHANNEL) {
    handleMessage(message)
  }
})

function handleMessage (json: string): void {
  try {
    const dispatch: WebSocketDispatch = JSON.parse(json)
    if (dispatch.type === WebSocketDispatchType.Broadcast) {
      sendBroadcast(dispatch.message)
    } else if (dispatch.type === WebSocketDispatchType.User) {
      const { username, message } = dispatch
      const userConnection = userConnections.get(username)
      if (userConnection && userConnection.size > 0) {
        sendToUser(username, message)
      }
    }
  } catch (error) {
    logger.error({ err: error, json }, 'Error handling message')
  }
}

async function shutdown (signal: string) {
  logger.info({ signal }, 'Shutting down WebSocket server')
  wss.close()
  await subscriber.quit()
  await redis.quit()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
