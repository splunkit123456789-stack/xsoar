package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/splunkit123456789-stack/xsoar/pkg/plugin"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
)

// GetAppList 获取 APP 列表
func GetAppList(c *gin.Context) {
	reg := plugin.GetRegistry()
	apps := reg.GetAppList()
	api.Success(c, apps)
}

// GetAppDetail 获取 APP 详情
func GetAppDetail(c *gin.Context) {
	code := c.Param("code")
	reg := plugin.GetRegistry()
	manifest := reg.GetManifest(code)
	if manifest == nil {
		api.NotFound(c, "app not found")
		return
	}
	api.Success(c, gin.H{
		"code":        code,
		"name":        manifest.Name,
		"version":     manifest.Version,
		"type":        manifest.Type,
		"description": manifest.Description,
		"actions":     manifest.Actions,
		"args":        manifest.Args,
	})
}

// EnableApp 启用 APP
func EnableApp(c *gin.Context) {
	code := c.Param("code")
	reg := plugin.GetRegistry()
	if reg.GetManifest(code) == nil {
		api.NotFound(c, "app not found")
		return
	}
	api.SuccessWithMsg(c, nil, "app enabled")
}

// DisableApp 禁用 APP
func DisableApp(c *gin.Context) {
	code := c.Param("code")
	reg := plugin.GetRegistry()
	if reg.GetManifest(code) == nil {
		api.NotFound(c, "app not found")
		return
	}
	api.SuccessWithMsg(c, nil, "app disabled")
}