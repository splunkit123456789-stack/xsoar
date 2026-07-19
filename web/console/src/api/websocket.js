// WebSocket 客户端封装
const WS_BASE = `ws://${window.location.hostname}:8888`

let ws = null
let reconnectTimer = null
let listeners = {}

export function connectWebSocket(execId, callbacks = {}) {
  if (ws) {
    ws.close()
  }

  const url = `${WS_BASE}/ws/workflow/${execId}`
  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('[ws] connected:', execId)
    if (callbacks.onOpen) callbacks.onOpen()
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'node_status') {
        if (callbacks.onNodeStatus) callbacks.onNodeStatus(msg.payload)
      } else if (msg.type === 'execution_complete') {
        if (callbacks.onComplete) callbacks.onComplete(msg.payload)
      }
      // 触发通用监听器
      if (listeners[msg.type]) {
        listeners[msg.type].forEach(fn => fn(msg.payload))
      }
    } catch (e) {
      console.error('[ws] parse error:', e)
    }
  }

  ws.onclose = () => {
    console.log('[ws] disconnected:', execId)
    if (callbacks.onClose) callbacks.onClose()
  }

  ws.onerror = (err) => {
    console.error('[ws] error:', err)
  }
}

export function disconnectWebSocket() {
  if (ws) {
    ws.close()
    ws = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

export function onMessage(type, fn) {
  if (!listeners[type]) listeners[type] = []
  listeners[type].push(fn)
}

export function offMessage(type, fn) {
  if (!listeners[type]) return
  listeners[type] = listeners[type].filter(f => f !== fn)
}