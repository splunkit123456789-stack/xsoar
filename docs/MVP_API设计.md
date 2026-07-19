# SOAR 平台 MVP API 设计

## 1. API 设计目标

MVP API 只覆盖最小闭环：登录、APP 加载、剧本 CRUD、剧本执行、执行日志查询。

## 2. 通用约束

- API 前缀统一使用 `/api/v1/soar`（沿用现有 SOAR 路由约定）。
- 除登录和健康检查外，所有接口要求 `token` Header（沿用现有约定）：
  ```http
  token: <login 返回的 token>
  ```
- P1 评估迁移到标准 `Authorization: Bearer <token>`。
- 错误响应统一格式：
  ```json
  {
    "status": "error",
    "code": "VALIDATION_ERROR",
    "message": "name is required",
    "request_id": "req_..."
  }
  ```
- 时间字段使用 `YYYY-MM-DD HH:MM:SS` 格式（北京时间）。

## 3. 认证 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/login` | 用户名密码登录，返回 Token |
| `GET` | `/healthz` | 服务健康检查 |

登录请求：

```json
{
  "account": "admin",
  "passwd": "soar_12345678"
}
```

登录成功响应：

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "account": "admin",
      "nick_name": "管理员",
      "avatar": "/public/avatar/default.png"
    }
  }
}
```

登录失败错误码：

| 场景 | HTTP | code |
|---|---|---|
| 账号或密码错误 | `401` | `INVALID_CREDENTIALS` |
| 账号被禁用 | `403` | `USER_DISABLED` |
| Token 无效或过期 | `401` | `UNAUTHORIZED` |

## 4. APP 管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/apps` | 查询已加载 APP 列表 |
| `GET` | `/api/v1/soar/apps/{app_code}` | 查询 APP 详情（含 app.json） |
| `POST` | `/api/v1/soar/apps/{app_code}/enable` | 启用 APP |
| `POST` | `/api/v1/soar/apps/{app_code}/disable` | 禁用 APP |

APP 列表响应示例：

```json
{
  "status": "success",
  "data": [
    {
      "code": "helloworld",
      "name": "Hello World",
      "version": "0.1",
      "type": "基础应用",
      "description": "SOAR 平台 - Hello World",
      "icon": "/app/helloworld/icon.png",
      "is_public": true,
      "status": "enabled",
      "actions": [
        {"name": "HelloWorld", "func": "hello_world"}
      ]
    }
  ]
}
```

## 5. 剧本管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/workflows` | 查询剧本列表（分页） |
| `POST` | `/api/v1/soar/workflows` | 新增剧本 |
| `GET` | `/api/v1/soar/workflows/{uuid}` | 查询剧本详情 |
| `PUT` | `/api/v1/soar/workflows/{uuid}` | 修改剧本 |
| `DELETE` | `/api/v1/soar/workflows/{uuid}` | 删除剧本 |
| `POST` | `/api/v1/soar/workflows/{uuid}/execute` | 手动执行剧本 |

剧本新增请求：

```json
{
  "name": "Hello World 测试",
  "remarks": "MVP 测试剧本",
  "flow_json": "{\"nodes\":[...],\"edges\":[...]}",
  "flow_data": "{\"start_app\":\"helloworld\",\"end_app\":\"helloworld\"}",
  "controller_data": "{}",
  "local_var_data": "[]"
}
```

执行请求：

```json
{
  "trigger_type": "manual",
  "trigger_data": {}
}
```

执行响应（异步执行 ID）：

```json
{
  "status": "success",
  "data": {
    "exec_id": "exec-2026-07-18-001",
    "workflow_uuid": "wf-uuid-xxx"
  }
}
```

## 6. 执行日志 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/logs` | 查询执行历史列表（分页） |
| `GET` | `/api/v1/soar/logs/{exec_id}` | 查询单次执行详情（含每节点状态/输出） |
| `GET` | `/api/v1/soar/workflows/{uuid}/logs` | 查询某剧本的执行历史 |

执行详情响应示例：

```json
{
  "status": "success",
  "data": {
    "exec_id": "exec-2026-07-18-001",
    "workflow_uuid": "wf-uuid-xxx",
    "workflow_name": "Hello World 测试",
    "trigger_type": "manual",
    "status": "success",
    "start_time": "2026-07-18 10:00:00",
    "end_time": "2026-07-18 10:00:02",
    "duration_ms": 2000,
    "nodes": [
      {
        "node_id": "node-1",
        "app_code": "helloworld",
        "action": "hello_world",
        "status": "success",
        "start_time": "2026-07-18 10:00:00",
        "end_time": "2026-07-18 10:00:01",
        "input": {"name": "W5"},
        "output": {"result": "Hello W5"},
        "error": null
      }
    ]
  }
}
```

## 7. WebSocket API

MVP 通过 WebSocket 实时推送执行状态。

| 端点 | 用途 |
|---|---|
| `ws://host:8888/ws/workflow/{exec_id}` | 订阅某次执行的节点状态变化 |

推送消息示例：

```json
{
  "type": "node_status",
  "exec_id": "exec-2026-07-18-001",
  "node_id": "node-1",
  "status": "running",
  "timestamp": "2026-07-18 10:00:00"
}
```

## 8. 错误码总表

| code | HTTP | 说明 |
|---|---|---|
| `VALIDATION_ERROR` | `400` | 请求字段校验失败 |
| `UNAUTHORIZED` | `401` | 未登录或 Token 无效 |
| `INVALID_CREDENTIALS` | `401` | 账号或密码错误 |
| `USER_DISABLED` | `403` | 账号被禁用 |
| `NOT_FOUND` | `404` | 资源不存在 |
| `CONFLICT` | `409` | 唯一键或状态冲突 |
| `WORKFLOW_ALREADY_RUNNING` | `409` | 剧本正在执行，不允许并发 |
| `APP_NOT_FOUND` | `404` | APP 不存在或未启用 |
| `APP_EXEC_FAILED` | `500` | APP 执行失败 |
| `WORKFLOW_EXEC_TIMEOUT` | `408` | 剧本执行超时 |
| `INTERNAL_ERROR` | `500` | 服务端内部错误 |
