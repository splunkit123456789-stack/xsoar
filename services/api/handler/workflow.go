package handler

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
)

type Workflow struct {
	ID        int    `gorm:"column:id" json:"id"`
	UUID      string `gorm:"column:uuid" json:"uuid"`
	TypeID    int    `gorm:"column:type_id" json:"type_id"`
	UserID    int    `gorm:"column:user_id" json:"user_id"`
	Name      string `gorm:"column:name" json:"name"`
	FlowJSON  string `gorm:"column:flow_json" json:"flow_json"`
	FlowData  string `gorm:"column:flow_data" json:"flow_data"`
	Status    int    `gorm:"column:status" json:"status"`
	Remarks   string `gorm:"column:remarks" json:"remarks"`
	CreatedAt string `gorm:"column:create_time" json:"create_time"`
	UpdatedAt string `gorm:"column:update_time" json:"update_time"`
}

type CreateWorkflowReq struct {
	Name      string `json:"name" binding:"required"`
	TypeID    int    `json:"type_id"`
	Remarks   string `json:"remarks"`
	FlowJSON  string `json:"flow_json"`
	FlowData  string `json:"flow_data"`
}

// GetWorkflowList 获取剧本列表
func GetWorkflowList(c *gin.Context) {
	var workflows []Workflow
	storage.DB.Table("soar_workflow").Order("id desc").Find(&workflows)
	api.Success(c, workflows)
}

// CreateWorkflow 创建剧本
func CreateWorkflow(c *gin.Context) {
	var req CreateWorkflowReq
	if err := c.ShouldBindJSON(&req); err != nil {
		api.ValidationError(c, "name is required")
		return
	}

	userID := c.GetInt("user_id")
	now := time.Now().Format("2006-01-02 15:04:05")
	uuid := "wf-" + now

	storage.DB.Table("soar_workflow").Create(map[string]interface{}{
		"uuid":        uuid,
		"type_id":     req.TypeID,
		"user_id":     userID,
		"name":        req.Name,
		"flow_json":   req.FlowJSON,
		"flow_data":   req.FlowData,
		"status":      0,
		"remarks":     req.Remarks,
		"create_time": now,
		"update_time": now,
	})

	api.Success(c, gin.H{"uuid": uuid})
}

// GetWorkflowDetail 获取剧本详情
func GetWorkflowDetail(c *gin.Context) {
	uuid := c.Param("uuid")
	var wf Workflow
	result := storage.DB.Table("soar_workflow").Where("uuid = ?", uuid).First(&wf)
	if result.Error != nil {
		api.NotFound(c, "workflow not found")
		return
	}
	api.Success(c, wf)
}

// UpdateWorkflow 更新剧本
func UpdateWorkflow(c *gin.Context) {
	uuid := c.Param("uuid")
	var req CreateWorkflowReq
	if err := c.ShouldBindJSON(&req); err != nil {
		api.ValidationError(c, "invalid request")
		return
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	updates := map[string]interface{}{
		"name":        req.Name,
		"flow_json":   req.FlowJSON,
		"flow_data":   req.FlowData,
		"remarks":     req.Remarks,
		"update_time": now,
	}
	if req.TypeID > 0 {
		updates["type_id"] = req.TypeID
	}

	result := storage.DB.Table("soar_workflow").Where("uuid = ?", uuid).Updates(updates)
	if result.RowsAffected == 0 {
		api.NotFound(c, "workflow not found")
		return
	}
	api.SuccessWithMsg(c, nil, "workflow updated")
}

// DeleteWorkflow 删除剧本
func DeleteWorkflow(c *gin.Context) {
	uuid := c.Param("uuid")
	result := storage.DB.Table("soar_workflow").Where("uuid = ?", uuid).Delete(nil)
	if result.RowsAffected == 0 {
		api.NotFound(c, "workflow not found")
		return
	}
	api.SuccessWithMsg(c, nil, "workflow deleted")
}

// ExecuteWorkflow 执行剧本
func ExecuteWorkflow(c *gin.Context) {
	uuid := c.Param("uuid")
	// 执行引擎调用（简化版：直接返回执行 ID）
	execID := "exec-" + time.Now().Format("20060102150405")
	api.Success(c, gin.H{
		"exec_id":       execID,
		"workflow_uuid": uuid,
	})
}