package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 开发环境允许所有来源
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Message WebSocket 消息
type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// NodeStatus 节点状态更新
type NodeStatus struct {
	ExecID       string `json:"exec_id"`
	WorkflowUUID string `json:"workflow_uuid"`
	NodeID       string `json:"node_id"`
	Status       string `json:"status"`
	AppCode      string `json:"app_code,omitempty"`
	Action       string `json:"action,omitempty"`
	Output       string `json:"output,omitempty"`
	Error        string `json:"error,omitempty"`
	Timestamp    string `json:"timestamp"`
}

// Hub WebSocket 连接管理器
type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*websocket.Conn]bool // execID -> connections
}

var (
	instance *Hub
	once     sync.Once
)

func GetHub() *Hub {
	once.Do(func() {
		instance = &Hub{
			clients: make(map[string]map[*websocket.Conn]bool),
		}
	})
	return instance
}

// HandleWebSocket 处理 WebSocket 连接
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[ws] upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// 从查询参数获取 execID
	execID := r.URL.Query().Get("exec_id")
	if execID == "" {
		log.Printf("[ws] missing exec_id")
		return
	}

	// 注册连接
	h.mu.Lock()
	if h.clients[execID] == nil {
		h.clients[execID] = make(map[*websocket.Conn]bool)
	}
	h.clients[execID][conn] = true
	clientCount := len(h.clients[execID])
	h.mu.Unlock()

	log.Printf("[ws] client connected for exec=%s (total: %d)", execID, clientCount)

	// 保持连接，读取客户端消息（处理断开）
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}

	// 清理连接
	h.mu.Lock()
	delete(h.clients[execID], conn)
	if len(h.clients[execID]) == 0 {
		delete(h.clients, execID)
	}
	h.mu.Unlock()
	log.Printf("[ws] client disconnected for exec=%s", execID)
}

// BroadcastNodeStatus 广播节点状态更新
func (h *Hub) BroadcastNodeStatus(execID string, status NodeStatus) {
	msg := Message{
		Type:    "node_status",
		Payload: status,
	}
	data, _ := json.Marshal(msg)

	h.mu.RLock()
	connections := h.clients[execID]
	h.mu.RUnlock()

	if len(connections) == 0 {
		return
	}

	for conn := range connections {
		err := conn.WriteMessage(websocket.TextMessage, data)
		if err != nil {
			log.Printf("[ws] write error for exec=%s: %v", execID, err)
			conn.Close()
			h.mu.Lock()
			delete(h.clients[execID], conn)
			h.mu.Unlock()
		}
	}
}

// BroadcastExecutionComplete 广播执行完成
func (h *Hub) BroadcastExecutionComplete(execID, workflowUUID, status string) {
	msg := Message{
		Type: "execution_complete",
		Payload: map[string]string{
			"exec_id":        execID,
			"workflow_uuid":  workflowUUID,
			"status":         status,
		},
	}
	data, _ := json.Marshal(msg)

	h.mu.RLock()
	connections := h.clients[execID]
	h.mu.RUnlock()

	for conn := range connections {
		conn.WriteMessage(websocket.TextMessage, data)
	}
}