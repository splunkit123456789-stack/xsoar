# SOAR 平台 P2 API 设计

## 1. RBAC API

### 1.1 角色管理

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/roles` | 查询角色列表 |
| `POST` | `/api/v1/soar/roles` | 新增角色 |
| `GET` | `/api/v1/soar/roles/{id}` | 查询角色详情（含权限点和 scope） |
| `PUT` | `/api/v1/soar/roles/{id}` | 修改角色权限和 scope |
| `DELETE` | `/api/v1/soar/roles/{id}` | 删除非内置角色 |
| `GET` | `/api/v1/soar/permissions` | 查询所有权限点 |

新增角色请求：

```json
{
  "name": "剧本编辑者",
  "description": "可创建/编辑/执行剧本",
  "permissions": [
    "workflow:read", "workflow:write", "workflow:execute",
    "app:read", "variable:read"
  ],
  "resource_scopes": {
    "workflow": {
      "read": ["wf-uuid-1", "wf-uuid-2"],
      "write": ["wf-uuid-1"],
      "execute": ["*"]
    }
  }
}
```

### 1.2 当前用户权限查询

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/me/permissions` | 查询当前用户所有权限点和 scope |

响应示例：

```json
{
  "status": "success",
  "data": {
    "permissions": ["workflow:read", "workflow:write", "workflow:execute"],
    "scopes": {
      "workflow": {
        "read": ["wf-uuid-1"],
        "write": ["wf-uuid-1"],
        "execute": ["*"]
      }
    }
  }
}
```

## 2. 多租户/组织空间 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/tenants` | 查询当前用户可访问的租户列表 |
| `POST` | `/api/v1/soar/tenants` | 创建新租户（仅 super_admin） |
| `GET` | `/api/v1/soar/tenants/{id}` | 查询租户详情 |
| `PUT` | `/api/v1/soar/tenants/{id}/quota` | 修改租户配额 |
| `POST` | `/api/v1/soar/tenants/{id}/switch` | 切换当前租户 |

切换租户请求：

```json
{
  "tenant_id": 2
}
```

响应：

```json
{
  "status": "success",
  "data": {
    "token": "<new token with tenant_id>",
    "tenant_id": 2
  }
}
```

错误码：

| 场景 | code |
|---|---|
| 租户不存在 | `TENANT_NOT_FOUND` |
| 无权访问租户 | `TENANT_ACCESS_DENIED` |
| 超出租户配额 | `QUOTA_EXCEEDED` |

## 3. 分布式执行引擎 API

### 3.1 Worker 管理

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/workers` | 查询所有 Worker 节点状态 |
| `GET` | `/api/v1/soar/workers/{id}` | 查询 Worker 详情 |
| `POST` | `/api/v1/soar/workers/{id}/drain` | 标记 Worker 为 drained（不接受新任务） |
| `POST` | `/api/v1/soar/workers/{id}/evict` | 驱逐 Worker（停止运行） |

Worker 状态响应：

```json
{
  "status": "success",
  "data": [
    {
      "id": "worker-1",
      "hostname": "worker-node-1",
      "ip": "10.0.0.10",
      "status": "online",
      "cpu_cores": 8,
      "memory_mb": 16384,
      "current_tasks": 3,
      "max_tasks": 20,
      "last_heartbeat": "2026-07-18 18:30:00",
      "available_apps": ["helloworld", "email", "nmap"]
    }
  ]
}
```

### 3.2 剧本分配策略

剧本配置中可指定 `worker_assignment`：

```json
{
  "worker_assignment": {
    "strategy": "specified",
    "worker_id": "worker-1"
  }
}
```

## 4. SSO 单点登录 API

### 4.1 SSO 配置管理

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/sso/providers` | 查询已配置的 SSO Provider |
| `POST` | `/api/v1/soar/sso/providers` | 新增 SSO Provider |
| `PUT` | `/api/v1/soar/sso/providers/{id}` | 修改 SSO Provider |
| `DELETE` | `/api/v1/soar/sso/providers/{id}` | 删除 SSO Provider |
| `POST` | `/api/v1/soar/sso/providers/{id}/test` | 测试 SSO Provider 连通性 |

新增 SSO Provider 请求：

```json
{
  "name": "企业 LDAP",
  "type": "ldap",
  "config": {
    "server_url": "ldap://ldap.example.com:389",
    "bind_dn": "cn=admin,dc=example,dc=com",
    "bind_password_encrypted": "xxx",
    "base_dn": "ou=users,dc=example,dc=com",
    "username_attribute": "uid",
    "default_role_id": 3,
    "default_tenant_id": 1
  }
}
```

### 4.2 SSO 登录入口

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/sso/{provider_id}/login` | 重定向到 SSO Provider 登录页 |
| `GET` | `/api/v1/soar/sso/{provider_id}/callback` | SSO Provider 回调，换取 SOAR Token |

## 5. 剧本执行报告 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/executions/{exec_id}/report/generate` | 触发报告生成 |
| `GET` | `/api/v1/soar/executions/{exec_id}/report/status` | 查询报告生成状态 |
| `GET` | `/api/v1/soar/executions/{exec_id}/report/download?format=pdf` | 下载报告 |

报告生成状态：

```json
{
  "status": "success",
  "data": {
    "report_status": "completed",
    "pdf_url": "/api/v1/soar/executions/exec-001/report/download?format=pdf",
    "html_url": "/api/v1/soar/executions/exec-001/report/download?format=html"
  }
}
```

## 6. 大屏可视化 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/dashboard/realtime` | 大屏实时数据（5s 刷新） |
| `GET` | `/api/v1/soar/dashboard/category_ranking?days=7` | 按剧本分类的执行次数排行 |
| `GET` | `/api/v1/soar/dashboard/recent_executions?limit=10` | 最近 N 条执行记录 |
| `GET` | `/api/v1/soar/dashboard/alert_list?limit=10` | 当前异常告警列表 |

实时数据响应：

```json
{
  "status": "success",
  "data": {
    "workflow_count": 25,
    "today_execution_count": 142,
    "today_success_rate": 0.95,
    "current_concurrency": 8,
    "trend_24h": [
      {"time": "2026-07-18 00:00:00", "count": 5},
      {"time": "2026-07-18 01:00:00", "count": 3}
    ]
  }
}
```

## 7. APP 开发 SDK 与脚手架 API

### 7.1 APP 模板查询

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/app_templates` | 查询可用的 APP 模板 |

### 7.2 脚手架 CLI（不在 API 范围内）

```bash
# 安装 CLI
pip install soar-cli

# 初始化 APP 项目
soar init my-app --template=basic

# 本地调试
soar run --debug

# 打包
soar package

# 上传到 SOAR 实例
soar upload --url=http://soar.example.com --token=<token>
```

## 8. 剧本调试模式 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/workflows/{uuid}/debug/start` | 启动调试会话 |
| `POST` | `/api/v1/soar/workflows/{uuid}/debug/step` | 单步执行 |
| `POST` | `/api/v1/soar/workflows/{uuid}/debug/continue` | 继续执行到下一个断点 |
| `POST` | `/api/v1/soar/workflows/{uuid}/debug/stop` | 终止调试会话 |
| `GET` | `/api/v1/soar/workflows/{uuid}/debug/variables` | 查询当前所有变量值 |
| `PUT` | `/api/v1/soar/workflows/{uuid}/debug/variables` | 修改变量值 |

启动调试会话请求：

```json
{
  "breakpoints": ["node-1", "node-3"],
  "input_data": {}
}
```

## 9. 资产/CMDB 集成 API

### 9.1 CMDB 配置

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/cmdb/config` | 查询 CMDB 配置 |
| `PUT` | `/api/v1/soar/cmdb/config` | 修改 CMDB 配置 |
| `POST` | `/api/v1/soar/cmdb/test` | 测试 CMDB 连通性 |

### 9.2 CMDB 操作（通过 APP 暴露）

通过 `cmdb` APP 的动作调用，不走独立 API。

## 10. SIEM 集成 API

### 10.1 SIEM 配置

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/siem/providers` | 查询已配置的 SIEM |
| `POST` | `/api/v1/soar/siem/providers` | 新增 SIEM 配置 |
| `PUT` | `/api/v1/soar/siem/providers/{id}` | 修改 SIEM 配置 |
| `DELETE` | `/api/v1/soar/siem/providers/{id}` | 删除 SIEM 配置 |

### 10.2 告警 → 剧本映射

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/siem/mappings` | 查询告警类型 → 剧本映射 |
| `POST` | `/api/v1/soar/siem/mappings` | 新增映射 |
| `PUT` | `/api/v1/soar/siem/mappings/{id}` | 修改映射 |
| `DELETE` | `/api/v1/soar/siem/mappings/{id}` | 删除映射 |

### 10.3 告警拉取触发

外部 SIEM 通过 Webhook 推送告警时，系统根据映射自动触发对应剧本。

## 11. 性能监控与限流 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/metrics` | Prometheus 指标端点 |
| `GET` | `/api/v1/soar/system/limits` | 查询当前限流配置 |
| `PUT` | `/api/v1/soar/system/limits` | 修改限流配置 |

## 12. 备份与恢复 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/backups` | 查询备份列表 |
| `POST` | `/api/v1/soar/backups` | 立即创建备份 |
| `GET` | `/api/v1/soar/backups/{id}/download` | 下载备份文件 |
| `POST` | `/api/v1/soar/backups/restore` | 从备份恢复 |

恢复请求（`multipart/form-data`）：

| 字段 | 说明 |
|---|---|
| `backup_file` | 备份文件（本地上传） |
| `confirm` | 必须传 `true` 确认覆盖 |

## 13. API 开放平台

### 13.1 API Key 管理

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/api_keys` | 查询当前用户的 API Key 列表 |
| `POST` | `/api/v1/soar/api_keys` | 创建新 API Key |
| `PUT` | `/api/v1/soar/api_keys/{id}` | 修改 API Key（名称、权限、过期时间） |
| `DELETE` | `/api/v1/soar/api_keys/{id}` | 删除 API Key |
| `POST` | `/api/v1/soar/api_keys/{id}/disable` | 禁用 API Key |

创建 API Key 请求：

```json
{
  "name": "SIEM 集成 Key",
  "scopes": ["workflow:execute", "workflow:read"],
  "expires_at": "2027-07-18 00:00:00",
  "rate_limit_per_minute": 100
}
```

响应：

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "key": "w5ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "name": "SIEM 集成 Key",
    "scopes": ["workflow:execute", "workflow:read"],
    "expires_at": "2027-07-18 00:00:00",
    "rate_limit_per_minute": 100
  }
}
```

> ⚠️ `key` 仅在创建时返回一次，后续查询不再展示完整 key。

### 13.2 OpenAPI 文档

| 端点 | 用途 |
|---|---|
| `GET` | `/api/docs` Swagger UI |
| `GET` | `/api/v1/openapi.json` OpenAPI 3.0 spec |

## 14. 国际化 i18n API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/i18n/locales` | 查询支持的语言列表 |
| `GET` | `/api/v1/soar/i18n/messages?locale=zh-CN` | 获取指定语言的翻译消息 |

## 15. P2 错误码总表

| code | HTTP | 说明 |
|---|---|---|
| `FORBIDDEN` | `403` | 无权限 |
| `TENANT_NOT_FOUND` | `404` | 租户不存在 |
| `TENANT_ACCESS_DENIED` | `403` | 无权访问租户 |
| `QUOTA_EXCEEDED` | `409` | 超出租户配额 |
| `WORKER_NOT_FOUND` | `404` | Worker 不存在 |
| `WORKER_OFFLINE` | `409` | Worker 离线 |
| `WORKER_DRAINED` | `409` | Worker 已 drained |
| `SSO_PROVIDER_NOT_FOUND` | `404` | SSO Provider 不存在 |
| `SSO_CONFIG_INVALID` | `400` | SSO 配置非法 |
| `SSO_AUTH_FAILED` | `401` | SSO 认证失败 |
| `REPORT_GENERATION_FAILED` | `500` | 报告生成失败 |
| `REPORT_NOT_READY` | `409` | 报告尚未生成完成 |
| `BACKUP_FAILED` | `500` | 备份失败 |
| `RESTORE_FAILED` | `500` | 恢复失败 |
| `API_KEY_NOT_FOUND` | `404` | API Key 不存在 |
| `API_KEY_EXPIRED` | `401` | API Key 已过期 |
| `RATE_LIMIT_EXCEEDED` | `429` | 超出限流 |
| `QUEUE_FULL` | `503` | 排队队列已满 |
