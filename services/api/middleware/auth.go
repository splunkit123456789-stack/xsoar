package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	api "github.com/splunkit123456789-stack/xsoar/pkg/response"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
)

// RoutePermission 路由权限标注
type RoutePermission struct {
	Code  string // 权限点编码，如 "workflow:write"
	Scope string // 资源类型，如 "workflow"
}

// ProtectedRoutes 受保护路由 → 所需权限映射
var ProtectedRoutes = map[string]RoutePermission{
	"POST /api/v1/soar/workflows":                {Code: "workflow:write", Scope: "workflow"},
	"PUT /api/v1/soar/workflows/:id":             {Code: "workflow:write", Scope: "workflow"},
	"DELETE /api/v1/soar/workflows/:id":          {Code: "workflow:delete", Scope: "workflow"},
	"POST /api/v1/soar/workflows/:id/execute":    {Code: "workflow:execute", Scope: "workflow"},
	"GET /api/v1/soar/users":                     {Code: "user:read", Scope: "user"},
	"POST /api/v1/soar/users":                    {Code: "user:manage", Scope: "user"},
	"PUT /api/v1/soar/users/:id":                 {Code: "user:manage", Scope: "user"},
	"DELETE /api/v1/soar/users/:id":              {Code: "user:manage", Scope: "user"},
	"GET /api/v1/soar/roles":                     {Code: "role:read", Scope: "role"},
	"POST /api/v1/soar/roles":                    {Code: "role:manage", Scope: "role"},
	"PUT /api/v1/soar/roles/:id":                 {Code: "role:manage", Scope: "role"},
	"DELETE /api/v1/soar/roles/:id":              {Code: "role:manage", Scope: "role"},
	"GET /api/v1/soar/permissions":               {Code: "role:read", Scope: "role"},
	"GET /api/v1/soar/variables":                 {Code: "variable:read", Scope: "variable"},
	"POST /api/v1/soar/variables":                {Code: "variable:write", Scope: "variable"},
	"PUT /api/v1/soar/variables/:id":             {Code: "variable:write", Scope: "variable"},
	"DELETE /api/v1/soar/variables/:id":          {Code: "variable:delete", Scope: "variable"},
	"GET /api/v1/soar/timers":                    {Code: "timer:read", Scope: "timer"},
	"POST /api/v1/soar/timers":                   {Code: "timer:manage", Scope: "timer"},
	"GET /api/v1/soar/apps":                      {Code: "app:read", Scope: "app"},
	"GET /api/v1/soar/system/settings":           {Code: "system:read", Scope: "system"},
	"PUT /api/v1/soar/system/settings":           {Code: "system:write", Scope: "system"},
}

// PublicRoutes 公开路径（不经过鉴权）
var PublicRoutes = []string{
	"POST /api/v1/soar/login",
	"GET /healthz",
	"POST /api/v1/soar/webhook",
	"GET /api/v1/soar/api/exec",
	"GET /api/v1/soar/api/exec_status",
	"GET /api/v1/soar/api/exec_logs",
}

// AuthMiddleware 鉴权中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Step 1: 检查是否公开路径
		routeKey := c.Request.Method + " " + c.FullPath()
		for _, publicRoute := range PublicRoutes {
			if routeKey == publicRoute {
				c.Next()
				return
			}
		}

		// Step 2: 提取 Token
		token := c.GetHeader("token")
		if token == "" {
			token = c.GetHeader("Authorization")
			if strings.HasPrefix(token, "Bearer ") {
				token = strings.TrimPrefix(token, "Bearer ")
			}
		}
		if token == "" {
			api.Error(c, 401, "UNAUTHORIZED", "missing token")
			c.Abort()
			return
		}

		// Step 3: 解析 JWT Token
		claims, err := parseJWT(token)
		if err != nil {
			api.Error(c, 401, "UNAUTHORIZED", "invalid token")
			c.Abort()
			return
		}

		userID := int(claims["user_id"].(float64))
		c.Set("user_id", userID)

		// Step 4: 查询用户权限点
		roleID, permissions := getUserPermissions(userID)
		c.Set("role_id", roleID)
		c.Set("permissions", permissions)

		// Step 5: 校验路由权限
		required, exists := ProtectedRoutes[routeKey]
		if !exists || required.Code == "" {
			c.Next()
			return
		}

		// super_admin 跳过权限校验
		if roleID == 1 {
			c.Next()
			return
		}

		hasPermission := false
		for _, p := range permissions {
			if p == required.Code {
				hasPermission = true
				break
			}
		}
		if !hasPermission {
			api.Forbidden(c, required.Code)
			c.Abort()
			return
		}

		c.Next()
	}
}

// parseJWT 解析 JWT Token
func parseJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("soar-dev-secret-key"), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}

// getUserPermissions 查询用户权限点（从 Redis 缓存或 MySQL）
func getUserPermissions(userID int) (int, []string) {
	// 尝试从 Redis 获取
	key := "permissions:" + string(rune(userID))
	val, err := storage.RDB.Get(storage.Ctx, key).Result()
	if err == nil && val != "" {
		// 缓存命中，解析返回
		_ = val
	}

	// 从 MySQL 查询（简化版：直接查询角色权限）
	// 生产环境需要完整查询逻辑
	type RolePerm struct {
		RoleID int
		Code   string
	}
	var perms []RolePerm
	storage.DB.Raw(`
		SELECT rp.role_id, rp.permission_code AS code
		FROM soar_user_role ur
		JOIN soar_role_permission rp ON ur.role_id = rp.role_id
		WHERE ur.user_id = ?
	`, userID).Scan(&perms)

	if len(perms) == 0 {
		return 0, []string{}
	}

	roleID := perms[0].RoleID
	permCodes := make([]string, len(perms))
	for i, p := range perms {
		permCodes[i] = p.Code
	}
	return roleID, permCodes
}