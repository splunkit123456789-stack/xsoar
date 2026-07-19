package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Status  string      `json:"status"`
	Data    interface{} `json:"data,omitempty"`
	Code    string      `json:"code,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Status: "success",
		Data:   data,
	})
}

// SuccessWithMsg 成功响应（带消息）
func SuccessWithMsg(c *gin.Context, data interface{}, msg string) {
	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Data:    data,
		Message: msg,
	})
}

// Error 错误响应
func Error(c *gin.Context, httpStatus int, code, message string) {
	c.JSON(httpStatus, Response{
		Status:  "error",
		Code:    code,
		Message: message,
	})
}

// Forbidden 无权限响应
func Forbidden(c *gin.Context, requiredPermission string) {
	c.JSON(http.StatusForbidden, Response{
		Status:  "error",
		Code:    "FORBIDDEN",
		Message: "permission denied",
		Data:    gin.H{"required_permission": requiredPermission},
	})
}

// ValidationError 校验错误
func ValidationError(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, "VALIDATION_ERROR", message)
}

// NotFound 资源不存在
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, "NOT_FOUND", message)
}

// Conflict 冲突
func Conflict(c *gin.Context, code, message string) {
	Error(c, http.StatusConflict, code, message)
}