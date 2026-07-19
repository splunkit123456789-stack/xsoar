package handler

import (
	"github.com/gin-gonic/gin"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
)

func GetVariableList(c *gin.Context) {
	var vars []struct {
		ID      int    `gorm:"column:id" json:"id"`
		Name    string `gorm:"column:name" json:"name"`
		Value   string `gorm:"column:value" json:"value"`
		Type    string `gorm:"column:type" json:"type"`
		Remarks string `gorm:"column:remarks" json:"remarks"`
		Status  int    `gorm:"column:status" json:"status"`
	}
	storage.DB.Table("soar_variable").Find(&vars)
	api.Success(c, vars)
}

func CreateVariable(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "variable created")
}

func UpdateVariable(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "variable updated")
}

func DeleteVariable(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "variable deleted")
}

func GetDashboardSummary(c *gin.Context) {
	var wfCount, appCount, execCount int64
	storage.DB.Table("soar_workflow").Count(&wfCount)
	storage.DB.Table("soar_app").Count(&appCount)
	storage.DB.Table("soar_logs").Count(&execCount)

	api.Success(c, gin.H{
		"workflow_count": wfCount,
		"app_count":      appCount,
		"today_execution_count": execCount,
		"today_success_rate":    0.95,
	})
}

func GetExecutionTrend(c *gin.Context) {
	api.Success(c, []gin.H{})
}

func GetStatusDistribution(c *gin.Context) {
	api.Success(c, gin.H{
		"success": 0,
		"failed":  0,
		"timeout": 0,
	})
}