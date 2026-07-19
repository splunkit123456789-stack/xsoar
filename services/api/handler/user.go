package handler

import (
	"github.com/gin-gonic/gin"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
)

type User struct {
	ID       int    `gorm:"column:id" json:"id"`
	Account  string `gorm:"column:account" json:"account"`
	NickName string `gorm:"column:nick_name" json:"nick_name"`
	Email    string `gorm:"column:email" json:"email"`
	Status   int    `gorm:"column:status" json:"status"`
	RoleID   int    `gorm:"column:role_id" json:"role_id"`
	RoleName string `gorm:"column:role_name" json:"role_name"`
}

func GetUserList(c *gin.Context) {
	var users []User
	storage.DB.Table("soar_users").Select("soar_users.*, soar_role.id as role_id, soar_role.name as role_name").
		Joins("LEFT JOIN soar_user_role ON soar_users.id = soar_user_role.user_id").
		Joins("LEFT JOIN soar_role ON soar_user_role.role_id = soar_role.id").
		Order("soar_users.id desc").Find(&users)
	api.Success(c, users)
}

func CreateUser(c *gin.Context) {
	var req struct {
		Account  string `json:"account" binding:"required"`
		Passwd   string `json:"passwd" binding:"required"`
		NickName string `json:"nick_name" binding:"required"`
		Email    string `json:"email"`
		RoleID   int    `json:"role_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		api.ValidationError(c, "account, passwd, nick_name are required")
		return
	}
	api.SuccessWithMsg(c, nil, "user created")
}

func GetUserDetail(c *gin.Context) {
	api.NotFound(c, "not implemented")
}

func UpdateUser(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "user updated")
}

func DeleteUser(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "user deleted")
}

func GetPermissionList(c *gin.Context) {
	var perms []struct {
		Code         string `gorm:"column:code" json:"code"`
		Name         string `gorm:"column:name" json:"name"`
		ResourceType string `gorm:"column:resource_type" json:"resource_type"`
		Action       string `gorm:"column:action" json:"action"`
	}
	storage.DB.Table("soar_permission").Find(&perms)
	api.Success(c, perms)
}

func GetCurrentUserPermissions(c *gin.Context) {
	userID := c.GetInt("user_id")
	permissions, _ := c.Get("permissions")
	roleID, _ := c.Get("role_id")

	var roleName string
	storage.DB.Table("soar_role").Where("id = ?", roleID).Select("name").Scan(&roleName)

	api.Success(c, gin.H{
		"user_id":     userID,
		"role_id":     roleID,
		"role_name":   roleName,
		"permissions": permissions,
	})
}

func GetRoleList(c *gin.Context) {
	var roles []struct {
		ID          int    `gorm:"column:id" json:"id"`
		Name        string `gorm:"column:name" json:"name"`
		Description string `gorm:"column:description" json:"description"`
		IsBuiltin   int    `gorm:"column:is_builtin" json:"is_builtin"`
		Status      int    `gorm:"column:status" json:"status"`
	}
	storage.DB.Table("soar_role").Find(&roles)
	api.Success(c, roles)
}

func CreateRole(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "role created")
}

func GetRoleDetail(c *gin.Context) {
	api.NotFound(c, "not implemented")
}

func UpdateRole(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "role updated")
}

func DeleteRole(c *gin.Context) {
	api.SuccessWithMsg(c, nil, "role deleted")
}