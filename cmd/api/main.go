package main

import (
	"fmt"
	"log"

	"github.com/splunkit123456789-stack/xsoar/config"
	"github.com/splunkit123456789-stack/xsoar/pkg/plugin"
	"github.com/splunkit123456789-stack/xsoar/pkg/storage"
	api "github.com/splunkit123456789-stack/xsoar/services/api"
)

func main() {
	cfg := config.Load()

	// 初始化 MySQL
	if err := storage.InitMySQL(cfg.MySQL.DSN()); err != nil {
		log.Fatalf("Failed to init MySQL: %v", err)
	}
	defer storage.CloseMySQL()

	// 初始化 Redis
	if err := storage.InitRedis(cfg.Redis.Addr(), cfg.Redis.Password, cfg.Redis.Database); err != nil {
		log.Fatalf("Failed to init Redis: %v", err)
	}
	defer storage.CloseRedis()

	// 初始化 APP 插件
	plugin.Init(cfg.AppsPath)

	// 初始化路由
	r := api.SetupRouter()

	// 启动服务
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}