import type { NotificationMessage } from '@putong-oj/shared'
import type { AddressInfo } from 'node:net'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { NOTIFICATION_CHANNEL, NotificationBroadcastDispatchSchema, NotificationDispatchType, NotificationMessageType } from '@putong-oj/shared'
import test from 'ava'
import { WebSocket } from 'ws'
import app from '../../src/app.ts'
import redis from '../../src/config/redis.ts'
import notificationService, { runNotificationHeartbeat } from '../../src/services/notification.ts'
import sessionService from '../../src/services/session.ts'

const server = app.listen()
const port = (server.address() as AddressInfo).port

notificationService.startNotificationGateway(server)

function streamUrl (token: string): string {
  return `ws://127.0.0.1:${port}/ws?token=${token}`
}

function nextMessage (socket: WebSocket): Promise<NotificationMessage> {
  return new Promise((resolve, reject) => {
    socket.once('message', data => resolve(JSON.parse(data.toString()) as NotificationMessage))
    socket.once('error', reject)
  })
}

function closedWith (socket: WebSocket): Promise<number> {
  return new Promise((resolve) => {
    socket.once('close', code => resolve(code))
  })
}

function uniqueObjectId (): string {
  return randomUUID().replace(/-/g, '').slice(0, 24)
}

function issueToken (userId: string): Promise<string> {
  return notificationService.createNotificationToken(userId, randomUUID())
}

test.after.always(async () => {
  await notificationService.stopNotificationGateway()
  server.close()
})

test.serial('rejects a stream connection without a valid token', async (t) => {
  const socket = new WebSocket(streamUrl('not-a-token'))
  t.is(await closedWith(socket), 1008)
})

test.serial('delivers a user notification to the authenticated user', async (t) => {
  const userId = uniqueObjectId()
  const token = await issueToken(userId)
  const socket = new WebSocket(streamUrl(token))

  t.deepEqual(await nextMessage(socket), {
    type: NotificationMessageType.Connect,
    data: { userId, message: 'Ciallo!' },
  })

  const received = nextMessage(socket)
  await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify({
    type: NotificationDispatchType.User,
    userId,
    message: {
      type: NotificationMessageType.Notification,
      data: { title: 'Hello', content: 'World', severity: 'info', life: 1000 },
    },
  }))

  t.deepEqual(await received, {
    type: NotificationMessageType.Notification,
    data: { title: 'Hello', content: 'World', severity: 'info', life: 1000 },
  })
  socket.close()
})

test.serial('broadcasts a notification to every connection', async (t) => {
  const firstSocket = new WebSocket(streamUrl(await issueToken(uniqueObjectId())))
  const secondSocket = new WebSocket(streamUrl(await issueToken(uniqueObjectId())))
  await Promise.all([ nextMessage(firstSocket), nextMessage(secondSocket) ])

  const firstReceived = nextMessage(firstSocket)
  const secondReceived = nextMessage(secondSocket)
  await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify({
    type: NotificationDispatchType.Broadcast,
    message: {
      type: NotificationMessageType.Notification,
      data: { title: 'Maintenance', content: 'Soon', severity: 'warn', life: null },
    },
  }))

  const expected: NotificationMessage = {
    type: NotificationMessageType.Notification,
    data: { title: 'Maintenance', content: 'Soon', severity: 'warn', life: null },
  }
  t.deepEqual(await firstReceived, expected)
  t.deepEqual(await secondReceived, expected)
  firstSocket.close()
  secondSocket.close()
})

test.serial('rejects a malformed notification dispatch', (t) => {
  const result = NotificationBroadcastDispatchSchema.safeParse({
    type: NotificationDispatchType.Broadcast,
    message: { type: NotificationMessageType.Notification, data: { title: 'missing fields' } },
  })
  t.false(result.success)
})

test.serial('consumes a token atomically across concurrent attempts', async (t) => {
  const connection = { userId: uniqueObjectId(), sessionId: randomUUID() }
  const token = await notificationService.createNotificationToken(connection.userId, connection.sessionId)
  const results = await Promise.all([
    notificationService.consumeNotificationToken(token),
    notificationService.consumeNotificationToken(token),
  ])

  t.deepEqual(results.filter(result => result !== null), [ connection ])
  t.is(results.filter(result => result === null).length, 1)
})

test.serial('closes a stream that sends application data', async (t) => {
  const socket = new WebSocket(streamUrl(await issueToken(uniqueObjectId())))
  await nextMessage(socket)

  socket.send('unexpected')
  t.is(await closedWith(socket), 1003)
})

test.serial('closes a stream that sends a frame over the payload limit', async (t) => {
  const socket = new WebSocket(streamUrl(await issueToken(uniqueObjectId())))
  await nextMessage(socket)

  socket.send(Buffer.alloc(4096))
  t.is(await closedWith(socket), 1009)
})

test.serial('consumes the one-time token after a successful connection', async (t) => {
  const token = await issueToken(uniqueObjectId())
  const firstSocket = new WebSocket(streamUrl(token))
  await nextMessage(firstSocket)

  const secondSocket = new WebSocket(streamUrl(token))
  t.is(await closedWith(secondSocket), 1008)
  firstSocket.close()
})

test.serial('closes a stream whose session is no longer valid', async (t) => {
  const userId = uniqueObjectId()
  const sessionId = await sessionService.createSession(userId, '127.0.0.1', 'ava')
  const token = await notificationService.createNotificationToken(userId, sessionId)
  const socket = new WebSocket(streamUrl(token))
  await nextMessage(socket)

  await sessionService.revokeSession(userId, sessionId)
  const closed = closedWith(socket)
  await runNotificationHeartbeat()
  t.is(await closed, 1000)
})

test.serial('keeps a stream whose session is still valid', async (t) => {
  const userId = uniqueObjectId()
  const sessionId = await sessionService.createSession(userId, '127.0.0.1', 'ava')
  const token = await notificationService.createNotificationToken(userId, sessionId)
  const socket = new WebSocket(streamUrl(token))
  await nextMessage(socket)

  await runNotificationHeartbeat()
  t.is(socket.readyState, WebSocket.OPEN)
  socket.close()
})
