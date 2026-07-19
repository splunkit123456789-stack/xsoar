# SOAR 平台 MVP 人工验收

## 1. 验收目标

验证用户可以通过页面完成从登录、加载 APP、编排剧本、手动执行到查看执行日志的最小闭环。

## 2. 前置条件

```bash
bash scripts/start-oneclick.sh --clean
```

等待脚本输出前端地址、API 地址和默认账号。

默认登录：

| 项 | 值 |
|---|---|
| 用户名 | `admin` |
| 密码 | `soar_12345678` |
| 前端地址 | `http://127.0.0.1:8888` |

## 3. 页面验收步骤

### 3.1 登录验收

1. 打开前端页面 `http://127.0.0.1:8888`。
2. 看到登录页，输入用户名 `admin`，密码 `soar_12345678`。
3. 点击"登录"按钮。
4. **通过标准**：跳转到控制台首页，顶部展示用户昵称"管理员"。

### 3.2 APP 加载验收

1. 登录后，点击左侧导航"APP 管理"。
2. **通过标准**：APP 列表展示 helloworld、base64、md5、email 等基础 APP，每个 APP 显示名称、版本、类型、图标。

### 3.3 剧本编排验收

1. 点击左侧导航"剧本管理"。
2. 点击"新建剧本"按钮，输入剧本名称 `MVP 测试剧本`，点击"保存"。
3. 在剧本列表中找到刚创建的剧本，点击"编辑"进入图形化编辑器。
4. 从左侧 APP 库拖拽 `helloworld` APP 到画布，配置参数 `name = W5`。
5. 保存剧本。
6. **通过标准**：编辑器画布显示 helloworld 节点，节点参数已保存。

### 3.4 剧本执行验收

1. 在剧本编辑器中点击"执行"按钮。
2. **通过标准**：
   - 节点状态从 pending → running → success 实时变化（通过 WebSocket 推送）。
   - 节点颜色从灰色 → 蓝色 → 绿色。
   - 执行完成后弹出"执行成功"提示。

### 3.5 执行日志验收

1. 点击左侧导航"执行日志"。
2. **通过标准**：执行历史列表展示刚执行的剧本，含执行时间、状态、耗时。
3. 点击某条执行记录，查看执行详情。
4. **通过标准**：展示每节点的输入参数、输出结果、状态、耗时。

## 4. API 验收

### 4.1 登录 API 验收

```bash
curl -X POST http://127.0.0.1:8888/api/v1/soar/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","passwd":"soar_12345678"}'
```

**通过标准**：返回 `status: success`，包含 `token` 和 `user` 信息。

### 4.2 APP 列表 API 验收

```bash
curl -X GET http://127.0.0.1:8888/api/v1/soar/apps \
  -H "token: <上一步返回的 token>"
```

**通过标准**：返回 APP 列表，包含 helloworld。

### 4.3 剧本执行 API 验收

```bash
# 创建剧本
curl -X POST http://127.0.0.1:8888/api/v1/soar/workflows \
  -H "Content-Type: application/json" \
  -H "token: <token>" \
  -d '{"name":"API 测试","flow_json":"{\"nodes\":[{\"id\":\"n1\",\"app_code\":\"helloworld\",\"action\":\"hello_world\",\"args\":{\"name\":\"W5\"}}],\"edges\":[]}","flow_data":"{}","controller_data":"{}","local_var_data":"[]"}'

# 执行剧本
curl -X POST http://127.0.0.1:8888/api/v1/soar/workflows/<uuid>/execute \
  -H "Content-Type: application/json" \
  -H "token: <token>" \
  -d '{"trigger_type":"manual","trigger_data":{}}'

# 查询执行详情
curl -X GET http://127.0.0.1:8888/api/v1/soar/logs/<exec_id> \
  -H "token: <token>"
```

**通过标准**：执行详情中 helloworld 节点状态为 `success`，输出为 `{"result":"Hello W5"}`。

## 5. 数据库验收

进入 MySQL 查询：

```sql
-- 查询剧本
SELECT id, uuid, name, status FROM soar_workflow ORDER BY id DESC LIMIT 5;

-- 查询执行历史
SELECT exec_id, workflow_uuid, status, start_time, end_time
FROM soar_logs ORDER BY id DESC LIMIT 5;

-- 查询节点执行详情
SELECT node_id, app_code, action, status, input, output, error
FROM soar_logs_detail WHERE exec_id = '<exec_id>';
```

**通过标准**：
- `soar_workflow` 表中有刚创建的剧本。
- `soar_logs` 表中有对应执行记录，`status = success`。
- `soar_logs_detail` 表中节点 `status = success`，`output` 包含 `Hello W5`。

## 6. 详细验收文档

完整 Playwright 端到端用例维护在 [playwright/tests/](playwright/tests/) 目录。
