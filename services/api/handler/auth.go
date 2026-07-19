package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"github.com/splunkit123456789-stack/xsoar/config"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
)

type LoginRequest struct {
	Account string `json:"account" binding:"required"`
	Passwd  string `json:"passwd" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  UserInfo `json:"user"`
}

type UserInfo struct {
	ID       int    `json:"id"`
	Account  string `json:"account"`
	NickName string `json:"nick_name"`
	Avatar   string `json:"avatar"`
	RoleID   int    `json:"role_id"`
	RoleName string `json:"role_name"`
}

type UserData struct {
	ID       int    `gorm:"column:id"`
	Account  string `gorm:"column:account"`
	Passwd   string `gorm:"column:passwd"`
	NickName string `gorm:"column:nick_name"`
	Avatar   string `gorm:"column:avatar"`
	Status   int    `gorm:"column:status"`
}

// Login 用户登录
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.ValidationError(c, "account and passwd are required")
		return
	}

	// 查询用户
	var user UserData
	result := storage.DB.Table("soar_users").Where("account = ?", req.Account).First(&user)
	if result.Error != nil {
		api.Error(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "account or password is incorrect")
		return
	}

	// 检查用户状态
	if user.Status != 0 {
		api.Error(c, http.StatusForbidden, "USER_DISABLED", "user is disabled")
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Passwd), []byte(req.Passwd)); err != nil {
		api.Error(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "account or password is incorrect")
		return
	}

	// 查询角色
	var role struct {
		ID   int    `gorm:"column:id"`
		Name string `gorm:"column:name"`
	}
	storage.DB.Table("soar_user_role").
		Select("soar_role.id, soar_role.name").
		Joins("JOIN soar_role ON soar_user_role.role_id = soar_role.id").
		Where("soar_user_role.user_id = ?", user.ID).
		First(&role)

	// 生成 JWT Token
	cfg := config.Load()
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role_id": role.ID,
		"exp":     time.Now().Add(time.Duration(cfg.JWT.ExpireHour) * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.JWT.Secret))
	if err != nil {
		api.Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to generate token")
		return
	}

	// 缓存 Token 到 Redis
	storage.RDB.Set(storage.Ctx, "token:"+tokenString, user.ID, time.Duration(cfg.JWT.ExpireHour)*time.Hour)

	api.Success(c, LoginResponse{
		Token: tokenString,
		User: UserInfo{
			ID:       user.ID,
			Account:  user.Account,
			NickName: user.NickName,
			Avatar:   user.Avatar,
			RoleID:   role.ID,
			RoleName: role.Name,
		},
	})
}