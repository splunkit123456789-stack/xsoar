# SOAR 平台 MVP 数据库设计

## 1. 存储目标

MVP 数据库设计服务于最小产品闭环：保存用户登录态、剧本配置、APP 元信息、执行日志。

## 2. MySQL 配置元数据

| 表 | 用途 | MVP 说明 |
|---|---|---|
| `soar_users` | 用户账号 | MVP 单管理员，预留多用户字段 |
| `soar_app` | APP 元信息 | 从 apps/ 目录扫描后写入 |
| `soar_app_group` | APP 分组 | MVP 不使用，P0 启用 |
| `soar_workflow` | 剧本主表 | 保存 flow_json、controller_data、状态 |
| `soar_logs` | 执行历史 | 每次执行一条记录，关联剧本 |
| `soar_logs_detail` | 节点执行详情 | 每节点一条记录，含输入/输出/错误 |
| `soar_setting` | 系统配置 | 保存 api_key、jwt_secret 等 |

## 3. soar_users 表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | 主键 |
| `account` | `VARCHAR(64)` | 登录账号，唯一 |
| `passwd` | `VARCHAR(128)` | MD5 加密密码 |
| `nick_name` | `VARCHAR(64)` | 昵称 |
| `email` | `VARCHAR(128)` | 邮箱 |
| `avatar` | `VARCHAR(255)` | 头像路径 |
| `status` | `TINYINT` | 0=启用，1=禁用 |
| `create_time` | `DATETIME` | 创建时间 |
| `update_time` | `DATETIME` | 更新时间 |

MVP 默认账号：`admin` / `soar_12345678`。

## 4. soar_app 表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | 主键 |
| `code` | `VARCHAR(64)` | APP 编码，唯一（对应目录名） |
| `name` | `VARCHAR(128)` | APP 名称（取自 app.json.name） |
| `version` | `VARCHAR(32)` | 版本（取自 app.json.version） |
| `type` | `VARCHAR(64)` | 类型（取自 app.json.type） |
| `description` | `TEXT` | 描述 |
| `icon` | `VARCHAR(255)` | 图标路径 |
| `app_json` | `TEXT` | app.json 原文 |
| `group_id` | `INT` | 分组 ID，MVP 固定为 0 |
| `status` | `TINYINT` | 0=启用，1=禁用 |
| `create_time` | `DATETIME` | 创建时间 |
| `update_time` | `DATETIME` | 更新时间 |

## 5. soar_workflow 表

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | 主键 |
| `uuid` | `VARCHAR(64)` | 剧本 UUID，唯一 |
| `type_id` | `INT` | 分类 ID，MVP 固定为 1（默认分类） |
| `user_id` | `INT` | 创建者 ID |
| `name` | `VARCHAR(128)` | 剧本名称 |
| `start_app` | `VARCHAR(64)` | 起始节点 APP 编码 |
| `end_app` | `VARCHAR(64)` | 结束节点 APP 编码 |
| `flow_json` | `LONGTEXT` | 图形化编排 JSON（节点 + 连线） |
| `flow_data` | `LONGTEXT` | 流程数据（节点参数配置） |
| `controller_data` | `LONGTEXT` | 控制器数据（触发器/变量） |
| `local_var_data` | `LONGTEXT` | 局部变量定义 |
| `remarks` | `VARCHAR(255)` | 备注 |
| `status` | `TINYINT` | 0=草稿，1=已发布，2=已归档 |
| `thumbnail` | `VARCHAR(255)` | 缩略图路径 |
| `create_time` | `DATETIME` | 创建时间 |
| `update_time` | `DATETIME` | 更新时间 |

## 6. soar_logs 表（执行历史）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | 主键 |
| `exec_id` | `VARCHAR(64)` | 执行 ID，唯一 |
| `workflow_uuid` | `VARCHAR(64)` | 关联剧本 UUID |
| `workflow_name` | `VARCHAR(128)` | 剧本名称快照 |
| `trigger_type` | `VARCHAR(32)` | 触发类型：manual/timer/webhook |
| `trigger_data` | `TEXT` | 触发数据 |
| `status` | `VARCHAR(32)` | running/success/failed/timeout |
| `start_time` | `DATETIME` | 开始时间 |
| `end_time` | `DATETIME` | 结束时间 |
| `duration_ms` | `INT` | 执行耗时 |
| `error` | `TEXT` | 失败原因 |
| `user_id` | `INT` | 触发者 ID |
| `create_time` | `DATETIME` | 创建时间 |

索引：`idx_workflow_uuid` (workflow_uuid, start_time)。

## 7. soar_logs_detail 表（节点执行详情）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `INT AUTO_INCREMENT` | 主键 |
| `exec_id` | `VARCHAR(64)` | 关联执行 ID |
| `node_id` | `VARCHAR(64)` | 节点 ID（取自 flow_json） |
| `app_code` | `VARCHAR(64)` | APP 编码 |
| `action` | `VARCHAR(64)` | 执行动作 |
| `status` | `VARCHAR(32)` | pending/running/success/failed |
| `start_time` | `DATETIME` | 开始时间 |
| `end_time` | `DATETIME` | 结束时间 |
| `input` | `LONGTEXT` | 输入参数 JSON |
| `output` | `LONGTEXT` | 输出结果 JSON |
| `error` | `TEXT` | 错误信息 |
| `create_time` | `DATETIME` | 创建时间 |

索引：`idx_exec_id` (exec_id, node_id)。

## 8. Redis 使用

| Key 模式 | 用途 |
|---|---|
| `token:{token}` | Token → user_id 映射，TTL 24h |
| `exec_sum` | 全局正在执行剧本数 |
| `{uuid}&&exec_sum` | 某剧本正在执行数 |
| `api_key` | 系统 API Key 缓存 |

## 9. 迁移约束

- 数据库结构变更必须通过 `migrations/mysql/` 新增迁移文件，不直接修改线上表。
- 表结构设计必须同步到 [数据库表结构设计.md](数据库表结构设计.md)。
- MySQL 配置表使用软删除字段 `deleted_at`，删除 API 默认逻辑删除。
- JSON 配置字段必须有 schema 说明，不允许长期保存无结构任意 JSON。
- 密码、Token、private key 等敏感字段不得明文落库。
