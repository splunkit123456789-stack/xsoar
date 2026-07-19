package runtime

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/splunkit123456789-stack/xsoar/pkg/plugin"
)

// Node 剧本节点
type Node struct {
	ID      string                 `json:"id"`
	AppCode string                 `json:"app_code"`
	Action  string                 `json:"action"`
	Args    map[string]interface{} `json:"args"`
}

// Edge 节点连线
type Edge struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// FlowData 剧本流程数据
type FlowData struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

// ExecutionResult 执行结果
type ExecutionResult struct {
	ExecID       string         `json:"exec_id"`
	WorkflowUUID string         `json:"workflow_uuid"`
	Status       string         `json:"status"`
	StartTime    string         `json:"start_time"`
	EndTime      string         `json:"end_time"`
	DurationMs   int64          `json:"duration_ms"`
	NodeResults  []NodeResult   `json:"node_results"`
	Error        string         `json:"error,omitempty"`
}

// NodeResult 节点执行结果
type NodeResult struct {
	NodeID    string `json:"node_id"`
	AppCode   string `json:"app_code"`
	Action    string `json:"action"`
	Status    string `json:"status"`
	Input     string `json:"input"`
	Output    string `json:"output"`
	Error     string `json:"error,omitempty"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// Engine 执行引擎
type Engine struct {
	mu              sync.RWMutex
	activeExecutions map[string]bool
}

// NewEngine 创建执行引擎
func NewEngine() *Engine {
	return &Engine{
		activeExecutions: make(map[string]bool),
	}
}

// Execute 执行剧本
func (e *Engine) Execute(uuid, triggerType string, data map[string]interface{}, flowJSON string) (*ExecutionResult, error) {
	// 并发控制
	e.mu.Lock()
	if e.activeExecutions[uuid] {
		e.mu.Unlock()
		return nil, fmt.Errorf("WORKFLOW_ALREADY_RUNNING: workflow %s is already executing", uuid)
	}
	e.activeExecutions[uuid] = true
	e.mu.Unlock()

	defer func() {
		e.mu.Lock()
		delete(e.activeExecutions, uuid)
		e.mu.Unlock()
	}()

	startTime := time.Now()
	execID := fmt.Sprintf("exec-%s", startTime.Format("20060102150405"))

	result := &ExecutionResult{
		ExecID:       execID,
		WorkflowUUID: uuid,
		Status:       "running",
		StartTime:    startTime.Format("2006-01-02 15:04:05"),
	}

	// 解析 flow_json
	var flow FlowData
	if err := json.Unmarshal([]byte(flowJSON), &flow); err != nil {
		result.Status = "failed"
		result.Error = fmt.Sprintf("invalid flow_json: %v", err)
		result.EndTime = time.Now().Format("2006-01-02 15:04:05")
		result.DurationMs = time.Since(startTime).Milliseconds()
		return result, nil
	}

	// 按顺序执行节点
	for _, node := range flow.Nodes {
		log.Printf("[runtime] executing node %s (app=%s, action=%s)", node.ID, node.AppCode, node.Action)

		nodeResult := NodeResult{
			NodeID:    node.ID,
			AppCode:   node.AppCode,
			Action:    node.Action,
			Status:    "running",
			StartTime: time.Now().Format("2006-01-02 15:04:05"),
		}

		// 执行节点
		output, err := e.executeNode(node, data)
		nodeResult.EndTime = time.Now().Format("2006-01-02 15:04:05")

		if err != nil {
			nodeResult.Status = "failed"
			nodeResult.Error = err.Error()
			result.Status = "failed"
			result.Error = fmt.Sprintf("node %s failed: %v", node.ID, err)
			result.NodeResults = append(result.NodeResults, nodeResult)
			break
		}

		nodeResult.Status = "success"
		outputJSON, _ := json.Marshal(output)
		nodeResult.Output = string(outputJSON)
		result.NodeResults = append(result.NodeResults, nodeResult)
	}

	// 所有节点成功
	if result.Status == "running" {
		result.Status = "success"
	}

	result.EndTime = time.Now().Format("2006-01-02 15:04:05")
	result.DurationMs = time.Since(startTime).Milliseconds()

	log.Printf("[runtime] execution %s completed: status=%s, duration=%dms", execID, result.Status, result.DurationMs)
	return result, nil
}

// executeNode 执行单个节点
func (e *Engine) executeNode(node Node, ctx map[string]interface{}) (map[string]interface{}, error) {
	reg := plugin.GetRegistry()
	p := reg.GetPlugin(node.AppCode)
	if p != nil {
		return p.Execute(node.Action, node.Args, ctx)
	}

	// 没有注册的 Go 插件时，返回模拟结果
	return map[string]interface{}{
		"result": fmt.Sprintf("executed %s/%s", node.AppCode, node.Action),
	}, nil
}