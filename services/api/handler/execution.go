package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
)

type LogEntry struct {
	ExecID       string `gorm:"column:exec_id" json:"exec_id"`
	WorkflowUUID string `gorm:"column:workflow_uuid" json:"workflow_uuid"`
	WorkflowName string `gorm:"column:workflow_name" json:"workflow_name"`
	TriggerType  string `gorm:"column:trigger_type" json:"trigger_type"`
	Status       string `gorm:"column:status" json:"status"`
	StartTime    string `gorm:"column:start_time" json:"start_time"`
	EndTime      string `gorm:"column:end_time" json:"end_time"`
	DurationMs   int    `gorm:"column:duration_ms" json:"duration_ms"`
	Error        string `gorm:"column:error" json:"error"`
}

type LogDetail struct {
	ExecID  string         `json:"exec_id"`
	Log     LogEntry       `json:"log"`
	Nodes   []NodeDetail   `json:"nodes"`
}

type NodeDetail struct {
	NodeID   string `gorm:"column:node_id" json:"node_id"`
	AppCode  string `gorm:"column:app_code" json:"app_code"`
	Action   string `gorm:"column:action" json:"action"`
	Status   string `gorm:"column:status" json:"status"`
	Input    string `gorm:"column:input" json:"input"`
	Output   string `gorm:"column:output" json:"output"`
	Error    string `gorm:"column:error" json:"error"`
	Duration int    `gorm:"column:duration_ms" json:"duration_ms"`
}

// GetLogList 获取执行日志列表
func GetLogList(c *gin.Context) {
	var logs []LogEntry
	storage.DB.Table("soar_logs").Order("id desc").Limit(100).Find(&logs)
	api.Success(c, logs)
}

// GetLogDetail 获取执行日志详情
func GetLogDetail(c *gin.Context) {
	execID := c.Param("exec_id")

	var log LogEntry
	result := storage.DB.Table("soar_logs").Where("exec_id = ?", execID).First(&log)
	if result.Error != nil {
		api.NotFound(c, "execution log not found")
		return
	}

	var nodes []NodeDetail
	storage.DB.Table("soar_logs_detail").Where("exec_id = ?", execID).Find(&nodes)

	api.Success(c, LogDetail{
		ExecID: execID,
		Log:    log,
		Nodes:  nodes,
	})
}

// WebhookTrigger Webhook 触发剧本
func WebhookTrigger(c *gin.Context) {
	var req struct {
		Key  string `json:"key"`
		UUID string `json:"uuid"`
		Data interface{} `json:"data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.ValidationError(c, "invalid request")
		return
	}
	api.Success(c, gin.H{"exec_id": "webhook-" + req.UUID})
}

// APIExec 外部 API 触发执行
func APIExec(c *gin.Context) {
	api.Success(c, gin.H{"exec_id": "api-exec"})
}

// APIExecStatus 查询执行状态
func APIExecStatus(c *gin.Context) {
	api.Success(c, gin.H{"status": "success"})
}

// APIExecLogs 查询执行日志
func APIExecLogs(c *gin.Context) {
	api.Success(c, []gin.H{})
}