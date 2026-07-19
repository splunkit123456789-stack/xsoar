package api

import (
	"github.com/gin-gonic/gin"
	"github.com/splunkit123456789-stack/xsoar/services/api/handler"
	"github.com/splunkit123456789-stack/xsoar/services/api/middleware"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.AuthMiddleware())

	// 健康检查
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1
	v1 := r.Group("/api/v1/soar")
	{
		// 登录（公开路径）
		v1.POST("/login", handler.Login)

		// 用户管理
		users := v1.Group("/users")
		{
			users.GET("", handler.GetUserList)
			users.POST("", handler.CreateUser)
			users.GET("/:id", handler.GetUserDetail)
			users.PUT("/:id", handler.UpdateUser)
			users.DELETE("/:id", handler.DeleteUser)
		}

		// 角色管理
		roles := v1.Group("/roles")
		{
			roles.GET("", handler.GetRoleList)
			roles.POST("", handler.CreateRole)
			roles.GET("/:id", handler.GetRoleDetail)
			roles.PUT("/:id", handler.UpdateRole)
			roles.DELETE("/:id", handler.DeleteRole)
		}

		// 权限管理
		v1.GET("/permissions", handler.GetPermissionList)
		v1.GET("/me/permissions", handler.GetCurrentUserPermissions)

		// APP 管理
		apps := v1.Group("/apps")
		{
			apps.GET("", handler.GetAppList)
			apps.GET("/:code", handler.GetAppDetail)
			apps.POST("/:code/enable", handler.EnableApp)
			apps.POST("/:code/disable", handler.DisableApp)
		}

		// 剧本管理
		workflows := v1.Group("/workflows")
		{
			workflows.GET("", handler.GetWorkflowList)
			workflows.POST("", handler.CreateWorkflow)
			workflows.GET("/:uuid", handler.GetWorkflowDetail)
			workflows.PUT("/:uuid", handler.UpdateWorkflow)
			workflows.DELETE("/:uuid", handler.DeleteWorkflow)
			workflows.POST("/:uuid/execute", handler.ExecuteWorkflow)
		}

		// 执行日志
		logs := v1.Group("/logs")
		{
			logs.GET("", handler.GetLogList)
			logs.GET("/:exec_id", handler.GetLogDetail)
		}

		// 变量管理
		variables := v1.Group("/variables")
		{
			variables.GET("", handler.GetVariableList)
			variables.POST("", handler.CreateVariable)
			variables.PUT("/:id", handler.UpdateVariable)
			variables.DELETE("/:id", handler.DeleteVariable)
		}

		// 仪表盘
		v1.GET("/dashboard/summary", handler.GetDashboardSummary)
		v1.GET("/dashboard/execution_trend", handler.GetExecutionTrend)
		v1.GET("/dashboard/status_distribution", handler.GetStatusDistribution)

		// Webhook
		v1.POST("/webhook", handler.WebhookTrigger)

		// 外部 API
		api := v1.Group("/api")
		{
			api.POST("/exec", handler.APIExec)
			api.GET("/exec_status", handler.APIExecStatus)
			api.GET("/exec_logs", handler.APIExecLogs)
		}
	}

	return r
}