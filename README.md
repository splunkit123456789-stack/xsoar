# xsoar

SOAR 安全编排自动化与响应平台（Security Orchestration, Automation and Response）

## 文档索引

| 文档 | 说明 |
|---|---|
| [产品需求文档](docs/产品需求文档.md) | 产品需求总入口、文档矩阵、阶段目标概览 |
| [MVP 需求设计](docs/MVP_需求设计.md) | 核心闭环：登录→APP 加载→剧本编排→执行→日志 |
| [MVP API 设计](docs/MVP_API设计.md) | MVP 阶段 API 定义、请求/响应格式、错误码 |
| [MVP 数据库设计](docs/MVP_数据库设计.md) | MVP 阶段数据库表结构及字段说明 |
| [MVP 人工验收](docs/MVP_人工验收.md) | 页面验收步骤、API 验收、数据库验收 |
| [前后端编码规范](docs/前后端编码规范.md) | 前后端实现规范、接口约束、测试约束 |
| [数据库表结构设计](docs/数据库表结构设计.md) | 全阶段 23 张表的完整 DDL |
| [APP 插件 SDK 设计](docs/APP插件SDK设计.md) | APP 插件开发规范、app.json 规范、SDK 使用 |
| [架构与代码结构设计](docs/架构与代码结构设计.md) | 系统架构图、执行引擎架构、模块依赖、部署架构 |

### 阶段文档

| 阶段 | 需求设计 | API 设计 | 数据库设计 | 人工验收 |
|---|---|---|---|---|
| MVP | [需求](docs/MVP_需求设计.md) | [API](docs/MVP_API设计.md) | [数据库](docs/MVP_数据库设计.md) | [验收](docs/MVP_人工验收.md) |
| P0 | [需求](docs/P0_需求设计.md) | [API](docs/P0_API设计.md) | [数据库](docs/P0_数据库设计.md) | [验收](docs/P0_人工验收.md) |
| P1 | [需求](docs/P1_需求设计.md) | [API](docs/P1_API设计.md) | [数据库](docs/P1_数据库设计.md) | [验收](docs/P1_人工验收.md) |
| P2 | [需求](docs/P2_需求设计.md) | [API](docs/P2_API设计.md) | [数据库](docs/P2_数据库设计.md) | [验收](docs/P2_人工验收.md) |
| P3 | [需求](docs/P3_需求设计.md) | — | — | — |

## 快速启动

```bash
# 克隆项目
git clone https://github.com/splunkit123456789-stack/xsoar.git
cd xsoar

# 启动服务（后续补充）
# bash scripts/start-oneclick.sh
```

## 技术栈

| 维度 | 选型 |
|---|---|
| 后端语言 | Go 1.22+ |
| Web 框架 | Gin |
| ORM | GORM |
| 数据库 | MySQL 8.0+ |
| 缓存 | Redis 6+ |
| 任务调度 | 内置 Cron + 调度器 |
| 实时通信 | WebSocket (gorilla/websocket) |
| 前端 | Vue3 + Vite + Element Plus |
| 部署 | Docker / Docker-Compose / K8s |

## 测试

```bash
# Playwright 端到端测试
cd docs/playwright
npm install
npx playwright install chromium
npx playwright test
```

## 许可证

GPL v3