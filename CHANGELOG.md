# Changelog

## v0.0.1 (2026-07-19)

### 文档
- 添加 MVP/P0/P1/P2/P3 全阶段需求文档体系（22 份文档）
- 添加前后端编码规范、数据库表结构设计、APP 插件 SDK 设计、架构设计
- 添加 9 个 Playwright 端到端测试脚本（35 个用例）

### 技术栈
- 后端：Go 1.22+ / Gin / GORM
- 前端：Vue3 + Vite + Element Plus + Vue Router
- 数据库：MySQL 8.0+ / Redis 6+
- 部署：Docker / Docker-Compose

### 工程
- 初始化 Go module：`github.com/splunkit123456789-stack/xsoar`
- 创建项目目录结构（cmd/services/pkg/plugins/web）
- 添加 .gitignore、Makefile 等基础设施