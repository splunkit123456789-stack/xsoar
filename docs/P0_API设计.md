# SOAR 平台 P0 API 设计

## 1. P0 API 稳定性要求

P0 API 是上线前必须保持稳定的业务接口。前端页面、人工验收脚本和端到端测试均依赖这些接口。

## 2. 用户与角色管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/users` | 查询用户列表（分页） |
| `POST` | `/api/v1/soar/users` | 新增用户 |
| `GET` | `/api/v1/soar/users/{id}` | 查询用户详情 |
| `PUT` | `/api/v1/soar/users/{id}` | 修改用户 |
| `DELETE` | `/api/v1/soar/users/{id}` | 删除用户 |
| `GET` | `/api/v1/soar/roles` | 查询角色列表 |
| `POST` | `/api/v1/soar/roles` | 新增角色 |
| `PUT` | `/api/v1/soar/roles/{id}` | 修改角色 |
| `DELETE` | `/api/v1/soar/roles/{id}` | 删除角色 |

新增用户请求：

```json
{
  "account": "analyst1",
  "passwd": "Passw0rd!",
  "nick_name": "分析师张三",
  "email": "zhangsan@example.com",
  "avatar": "/public/avatar/default.png",
  "role_id": 2
}
```

错误码：

| 场景 | code |
|---|---|
| 账号已存在 | `USER_ACCOUNT_EXISTS` |
| 试图删除自己 | `USER_CANNOT_DELETE_SELF` |
| 角色不存在 | `ROLE_NOT_FOUND` |
| 试图删除内置管理员角色 | `ROLE_BUILTIN_CANNOT_DELETE` |

## 3. APP 分组管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/app_groups` | 查询 APP 分组列表 |
| `POST` | `/api/v1/soar/app_groups` | 新增分组 |
| `PUT` | `/api/v1/soar/app_groups/{id}` | 修改分组 |
| `DELETE` | `/api/v1/soar/app_groups/{id}` | 删除分组 |
| `PUT` | `/api/v1/soar/apps/{code}/group` | 修改 APP 所属分组 |

错误码：

| 场景 | code |
|---|---|
| 分组名重复 | `APP_GROUP_NAME_EXISTS` |
| 试图删除内置分组 | `APP_GROUP_BUILTIN_CANNOT_DELETE` |
| 分组下有 APP 未迁移 | `APP_GROUP_HAS_APPS` |

## 4. 剧本分类管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/workflow_types` | 查询剧本分类列表 |
| `POST` | `/api/v1/soar/workflow_types` | 新增分类 |
| `PUT` | `/api/v1/soar/workflow_types/{id}` | 修改分类 |
| `DELETE` | `/api/v1/soar/workflow_types/{id}` | 删除分类 |

## 5. 定时触发器 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/workflows/{uuid}/timer` | 为剧本配置定时触发器 |
| `GET` | `/api/v1/soar/workflows/{uuid}/timer` | 查询剧本的定时触发器配置 |
| `DELETE` | `/api/v1/soar/workflows/{uuid}/timer` | 删除剧本的定时触发器 |
| `POST` | `/api/v1/soar/timers/{timer_uuid}/pause` | 暂停定时任务 |
| `POST` | `/api/v1/soar/timers/{timer_uuid}/resume` | 恢复定时任务 |
| `GET` | `/api/v1/soar/timers` | 查询所有定时任务（分页） |

配置定时触发器请求示例（cron）：

```json
{
  "type": "cron",
  "cron": "0 2 * * *",
  "start_date": "2026-07-18 00:00:00",
  "end_date": "2026-12-31 23:59:59",
  "jitter": 0
}
```

配置定时触发器请求示例（interval）：

```json
{
  "type": "interval",
  "interval_type": "minutes",
  "time": 30,
  "jitter": 5
}
```

错误码：

| 场景 | code |
|---|---|
| Cron 表达式非法 | `TIMER_CRON_INVALID` |
| 时间参数非法 | `TIMER_TIME_INVALID` |
| 定时任务不存在 | `TIMER_NOT_FOUND` |

## 6. Webhook 触发器 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/webhook` | 外部系统通过 Webhook 触发剧本 |
| `POST` | `/api/v1/soar/workflows/{uuid}/webhook/enable` | 启用剧本 Webhook 触发 |
| `POST` | `/api/v1/soar/workflows/{uuid}/webhook/disable` | 禁用剧本 Webhook 触发 |
| `GET` | `/api/v1/soar/workflows/{uuid}/webhook` | 查询剧本 Webhook 配置 |

Webhook 触发请求：

```json
{
  "key": "soar_api_key_xxx",
  "uuid": "<webhook_app UUID>",
  "data": {
    "alert_id": "alert-001",
    "src_ip": "10.0.1.8"
  }
}
```

错误码：

| 场景 | code |
|---|---|
| API Key 缺失或错误 | `WEBHOOK_KEY_INVALID` |
| Webhook UUID 不存在 | `WEBHOOK_UUID_NOT_FOUND` |
| 剧本未启用 Webhook | `WEBHOOK_NOT_ENABLED` |
| 剧本正在执行 | `WORKFLOW_ALREADY_RUNNING` |

## 7. 全局变量管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/variables` | 查询全局变量列表 |
| `POST` | `/api/v1/soar/variables` | 新增变量 |
| `PUT` | `/api/v1/soar/variables/{id}` | 修改变量 |
| `DELETE` | `/api/v1/soar/variables/{id}` | 删除变量 |

新增变量请求：

```json
{
  "name": "default_smtp_host",
  "value": "smtp.example.com",
  "type": "string",
  "remarks": "默认 SMTP 服务器"
}
```

错误码：

| 场景 | code |
|---|---|
| 变量名重复 | `VAR_NAME_EXISTS` |
| 变量名非法 | `VAR_NAME_INVALID` |
| 变量被引用不可删除 | `VAR_IN_USE` |

## 8. 仪表盘 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/dashboard/summary` | 顶部卡片数据 |
| `GET` | `/api/v1/soar/dashboard/execution_trend?days=7` | 最近 N 天执行趋势 |
| `GET` | `/api/v1/soar/dashboard/status_distribution?days=30` | 执行状态分布 |

`summary` 响应：

```json
{
  "status": "success",
  "data": {
    "workflow_count": 25,
    "app_count": 30,
    "today_execution_count": 142,
    "today_success_rate": 0.95
  }
}
```

## 9. 执行查询 API（对外）

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/api/exec` | 通过 API Key 触发剧本执行 |
| `GET` | `/api/v1/soar/api/exec_status?exec_id=xxx` | 查询执行状态 |
| `GET` | `/api/v1/soar/api/exec_logs?exec_id=xxx` | 查询执行日志 |

这些接口要求 `api_key`，不依赖用户 Token。

## 10. WebSocket API 扩展

| 端点 | 用途 |
|---|---|
| `ws://host:8888/ws/workflow/{exec_id}` | 订阅某次执行节点状态变化 |
| `ws://host:8888/ws/dashboard` | 订阅仪表盘实时数据（P0 暂不实现，进入 P1） |

## 11. P0 错误码总表

| code | HTTP | 说明 |
|---|---|---|
| `VALIDATION_ERROR` | `400` | 请求字段校验失败 |
| `UNAUTHORIZED` | `401` | 未登录或 Token 无效 |
| `FORBIDDEN` | `403` | 已认证但无权限 |
| `NOT_FOUND` | `404` | 资源不存在 |
| `CONFLICT` | `409` | 唯一键或状态冲突 |
| `USER_ACCOUNT_EXISTS` | `409` | 账号已存在 |
| `USER_CANNOT_DELETE_SELF` | `409` | 不允许删除自己 |
| `ROLE_NOT_FOUND` | `404` | 角色不存在 |
| `ROLE_BUILTIN_CANNOT_DELETE` | `409` | 内置角色不可删除 |
| `APP_GROUP_NAME_EXISTS` | `409` | APP 分组名重复 |
| `APP_GROUP_BUILTIN_CANNOT_DELETE` | `409` | 内置分组不可删除 |
| `APP_GROUP_HAS_APPS` | `409` | 分组下有 APP 未迁移 |
| `TIMER_CRON_INVALID` | `400` | Cron 表达式非法 |
| `TIMER_TIME_INVALID` | `400` | 时间参数非法 |
| `TIMER_NOT_FOUND` | `404` | 定时任务不存在 |
| `WEBHOOK_KEY_INVALID` | `401` | Webhook API Key 错误 |
| `WEBHOOK_UUID_NOT_FOUND` | `404` | Webhook UUID 不存在 |
| `WEBHOOK_NOT_ENABLED` | `409` | 剧本未启用 Webhook |
| `WORKFLOW_ALREADY_RUNNING` | `409` | 剧本正在执行 |
| `VAR_NAME_EXISTS` | `409` | 变量名重复 |
| `VAR_NAME_INVALID` | `400` | 变量名非法 |
| `VAR_IN_USE` | `409` | 变量被引用不可删除 |
| `INTERNAL_ERROR` | `500` | 服务端内部错误 |
