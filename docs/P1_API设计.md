# SOAR 平台 P1 API 设计

## 1. 剧本审批流 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/workflows/{uuid}/approval/enable` | 启用剧本审批流 |
| `POST` | `/api/v1/soar/workflows/{uuid}/approval/disable` | 禁用剧本审批流 |
| `GET` | `/api/v1/soar/workflows/{uuid}/approval` | 查询剧本审批流配置 |
| `PUT` | `/api/v1/soar/workflows/{uuid}/approval` | 修改审批流配置 |
| `GET` | `/api/v1/soar/approvals` | 查询待审批列表 |
| `POST` | `/api/v1/soar/approvals/{id}/approve` | 审批通过 |
| `POST` | `/api/v1/soar/approvals/{id}/reject` | 审批驳回 |
| `GET` | `/api/v1/soar/approvals/history` | 查询审批历史 |

启用审批流请求：

```json
{
  "approvers": [2, 3],
  "approval_type": "single",
  "notify_channels": ["email", "dingding"]
}
```

审批通过请求：

```json
{
  "remarks": "确认执行"
}
```

审批驳回请求：

```json
{
  "remarks": "剧本有风险，暂不执行"
}
```

错误码：

| 场景 | code |
|---|---|
| 审批人不不存在 | `APPROVER_NOT_FOUND` |
| 审批人不能是自己 | `APPROVER_CANNOT_BE_SELF` |
| 审批记录不存在 | `APPROVAL_NOT_FOUND` |
| 审批记录已处理 | `APPROVAL_ALREADY_PROCESSED` |
| 无权审批 | `APPROVAL_NO_PERMISSION` |

## 2. 审计日志 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/audit_logs` | 查询审计日志（分页） |
| `GET` | `/api/v1/soar/audit_logs/export` | 导出审计日志 CSV |

查询参数：

| 参数 | 说明 |
|---|---|
| `start_time` | 起始时间（YYYY-MM-DD HH:MM:SS） |
| `end_time` | 结束时间 |
| `user_id` | 操作用户 ID |
| `action_type` | 操作类型 |
| `page` | 页码，默认 1 |
| `page_count` | 每页条数，默认 20 |

## 3. 剧本版本管理 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/workflows/{uuid}/versions` | 查询剧本版本历史 |
| `GET` | `/api/v1/soar/workflows/{uuid}/versions/{version}` | 查询指定版本详情 |
| `POST` | `/api/v1/soar/workflows/{uuid}/versions/{version}/rollback` | 回滚到指定版本 |
| `POST` | `/api/v1/soar/workflows/{uuid}/versions/compare` | 对比两个版本 |

版本对比请求：

```json
{
  "version1": 3,
  "version2": 5
}
```

版本对比响应：

```json
{
  "status": "success",
  "data": {
    "added_nodes": ["node-6"],
    "removed_nodes": ["node-2"],
    "modified_nodes": [
      {
        "node_id": "node-1",
        "changes": [
          {"field": "args.name", "old": "W5", "new": "World"}
        ]
      }
    ]
  }
}
```

错误码：

| 场景 | code |
|---|---|
| 版本不存在 | `VERSION_NOT_FOUND` |
| 版本正在使用不可删除 | `VERSION_IN_USE` |
| 回滚版本不存在 | `ROLLBACK_VERSION_NOT_FOUND` |

## 4. 剧本导入/导出 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/workflows/{uuid}/export` | 导出剧本为 JSON 文件 |
| `POST` | `/api/v1/soar/workflows/import` | 导入剧本 JSON 文件 |

导入请求（`multipart/form-data`）：

| 字段 | 说明 |
|---|---|
| `file` | 剧本 JSON 文件 |
| `mode` | `overwrite` 或 `new`，默认 `new` |

导出响应：`Content-Type: application/json`，`Content-Disposition: attachment; filename="workflow_xxx.json"`。

错误码：

| 场景 | code |
|---|---|
| 文件格式错误 | `IMPORT_FILE_INVALID` |
| 必填字段缺失 | `IMPORT_FIELD_MISSING` |
| UUID 已存在且未指定覆盖 | `IMPORT_UUID_EXISTS` |

## 5. APP 市场/导入 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/apps/import` | 上传 APP ZIP 包 |
| `GET` | `/api/v1/soar/apps/{code}/versions` | 查询 APP 版本历史 |
| `POST` | `/api/v1/soar/apps/{code}/rollback/{version}` | 回滚 APP 到指定版本 |

上传请求（`multipart/form-data`）：

| 字段 | 说明 |
|---|---|
| `file` | APP ZIP 包 |
| `overwrite` | 可选；同版本覆盖确认后传 `true` |

错误码：

| 场景 | code |
|---|---|
| ZIP 解压失败 | `APP_ZIP_INVALID` |
| app.json 缺失 | `APP_MANIFEST_MISSING` |
| identification 非 soar | `APP_IDENTIFICATION_INVALID` |
| 同版本已存在且未确认覆盖 | `APP_ALREADY_EXISTS` |
| 版本低于当前版本 | `APP_VERSION_NOT_NEWER` |
| APP 被引用不可禁用 | `APP_IN_USE` |

## 6. 执行历史与重跑 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/executions` | 查询执行历史（分页） |
| `GET` | `/api/v1/soar/executions/{exec_id}` | 查询执行详情 |
| `POST` | `/api/v1/soar/executions/{exec_id}/replay` | 重跑指定执行 |

重跑响应：

```json
{
  "status": "success",
  "data": {
    "exec_id": "exec-2026-07-18-002",
    "replay_of": "exec-2026-07-18-001"
  }
}
```

## 7. 节点输出变量提取 API

变量引用语法在剧本编辑器中通过静态校验 API 验证：

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/workflows/validate_variables` | 校验剧本中的变量引用 |

校验请求：

```json
{
  "flow_json": "{\"nodes\":[...]}",
  "local_var_data": "[]"
}
```

校验响应：

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "errors": []
  }
}
```

校验失败响应：

```json
{
  "status": "error",
  "code": "VARIABLE_REF_INVALID",
  "message": "Node node-3 references ${node-1.data.user.name} but field path is invalid",
  "data": {
    "errors": [
      {
        "node_id": "node-3",
        "variable": "${node-1.data.user.name}",
        "reason": "field path not found in upstream node output"
      }
    ]
  }
}
```

## 8. 用户主题偏好 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/v1/soar/user/preference` | 查询当前用户主题偏好 |
| `PUT` | `/api/v1/soar/user/preference` | 修改主题偏好 |

修改请求：

```json
{
  "theme": "dark"
}
```

## 9. 剧本失败自动告警 API

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/api/v1/soar/workflows/{uuid}/failure_alert/enable` | 启用失败告警 |
| `POST` | `/api/v1/soar/workflows/{uuid}/failure_alert/disable` | 禁用失败告警 |
| `GET` | `/api/v1/soar/workflows/{uuid}/failure_alert` | 查询失败告警配置 |

启用请求：

```json
{
  "channels": [
    {"type": "email", "recipients": ["admin@example.com"]},
    {"type": "dingding", "webhook_url": "https://oapi.dingtalk.com/robot/send?access_token=xxx"}
  ]
}
```

## 10. P1 错误码总表

| code | HTTP | 说明 |
|---|---|---|
| `APPROVER_NOT_FOUND` | `404` | 审批人不存在 |
| `APPROVER_CANNOT_BE_SELF` | `409` | 审批人不能是自己 |
| `APPROVAL_NOT_FOUND` | `404` | 审批记录不存在 |
| `APPROVAL_ALREADY_PROCESSED` | `409` | 审批记录已处理 |
| `APPROVAL_NO_PERMISSION` | `403` | 无权审批 |
| `VERSION_NOT_FOUND` | `404` | 版本不存在 |
| `VERSION_IN_USE` | `409` | 版本正在使用不可删除 |
| `ROLLBACK_VERSION_NOT_FOUND` | `404` | 回滚版本不存在 |
| `IMPORT_FILE_INVALID` | `400` | 文件格式错误 |
| `IMPORT_FIELD_MISSING` | `400` | 必填字段缺失 |
| `IMPORT_UUID_EXISTS` | `409` | UUID 已存在且未指定覆盖 |
| `APP_ZIP_INVALID` | `400` | ZIP 解压失败 |
| `APP_MANIFEST_MISSING` | `400` | app.json 缺失 |
| `APP_IDENTIFICATION_INVALID` | `400` | identification 非 soar |
| `APP_ALREADY_EXISTS` | `409` | 同版本已存在且未确认覆盖 |
| `APP_VERSION_NOT_NEWER` | `409` | 版本低于当前版本 |
| `APP_IN_USE` | `409` | APP 被引用不可禁用 |
| `VARIABLE_REF_INVALID` | `400` | 变量引用非法 |
