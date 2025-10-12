import type { WebSocketDispatch, WebSocketMessage } from '@putongoj/shared'
import { uuidV4Regex, WebSocketDispatchType, WebSocketMessageType } from '@putongoj/shared'
import { Redis } from 'ioredis'
import WebSocket from 'ws'
import { globalConfig } from './config'

const wss = new WebSocket.Server({ port: globalConfig.wsPort })
const redis = new Redis(globalConfig.redisURL)

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
    console.error('WebSocket error:', error)
  })

  const helloMessage: WebSocketMessage = {
    type: WebSocketMessageType.Connect,
    data: { username, message: 'Ciallo!' },
  }
  ws.send(JSON.stringify(helloMessage))

  console.log(`User '${username}' connected, total sockets: ${userConnection.size}`)
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
    console.log(`Sent message to user '${username}': ${JSON.stringify(message)}`)
  }
}

function sendBroadcast (message: any): void {
  const messageStr = JSON.stringify(message)
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr)
    }
  })
  console.log(`Broadcast message: ${JSON.stringify(message)}`)
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
  console.log(`Connected users: ${connectedUsers}`)
}, 300000)

const subscriber = new Redis(globalConfig.redisURL)
subscriber.subscribe('websocket:message', (err) => {
  if (err) {
    console.error('Failed to subscribe: ', err)
  } else {
    console.log('Subscribed to websocket:message channel')
  }
})

subscriber.on('message', (channel, message) => {
  if (channel === 'websocket:message') {
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
    console.error('Error handling message:', error)
  }
}
