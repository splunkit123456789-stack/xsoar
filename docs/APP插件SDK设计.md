# SOAR 平台 APP 插件 SDK 设计

## 1. APP 插件概述

SOAR 平台 的 APP 插件是平台的核心扩展机制。每个 APP 是一个独立的目录，通过标准化的 `app.json` 声明元信息和参数，通过 `main/` 目录提供运行时执行逻辑。

### 1.1 APP 目录结构

```
apps/
├── helloworld/
│   ├── app.json          # APP 元信息（必需）
│   ├── icon.png          # APP 图标（可选，默认使用系统图标）
│   ├── readme.md         # APP 使用说明（可选）
│   └── main/
│       ├── __init__.py   # APP 入口（必需）
│       └── handler.py    # APP 执行逻辑（必需）
```

### 1.2 APP 生命周期

```
加载（系统启动时扫描 apps/ 目录）
  → 注册（解析 app.json，写入 soar_app 表）
  → 启用（默认启用，用户可手动禁用）
  → 在剧本中被引用
  → 执行（执行引擎调用 APP 的 execute 方法）
  → 输出（返回执行结果）
```

## 2. app.json 规范

### 2.1 字段说明

```json
{
  "identification": "soar",
  "is_public": true,
  "name": "Hello World",
  "version": "0.1",
  "description": "SOAR 平台 - 示例 APP",
  "type": "基础应用",
  "action": [
    {
      "name": "HelloWorld",
      "func": "hello_world"
    }
  ],
  "args": {
    "hello_world": [
      {
        "key": "name",
        "type": "text",
        "required": true,
        "default": "World",
        "description": "要问候的名称"
      }
    ]
  }
}
```

### 2.2 字段定义

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `identification` | `string` | ✅ | 固定为 `soar`，用于校验 APP 合法性 |
| `is_public` | `boolean` | ✅ | 是否公开供所有用户使用 |
| `name` | `string` | ✅ | APP 名称，前端展示 |
| `version` | `string` | ✅ | 版本号，遵循 semver 规范 |
| `description` | `string` | ❌ | APP 描述 |
| `type` | `string` | ✅ | APP 分类，前端按分类筛选 |
| `action` | `array` | ✅ | 可执行动作列表 |
| `args` | `object` | ❌ | 动作参数定义，key 为 func 名 |

### 2.3 action 字段

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `name` | `string` | ✅ | 动作名称，前端展示 |
| `func` | `string` | ✅ | 动作标识，对应 `main/` 中的函数名 |

### 2.4 args 字段

每个 action 的参数是一个数组，每项定义：

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| `key` | `string` | ✅ | 参数名 |
| `type` | `string` | ✅ | 参数类型 |
| `required` | `boolean` | ❌ | 是否必填 |
| `default` | `any` | ❌ | 默认值 |
| `description` | `string` | ❌ | 参数说明 |
| `data` | `array` | ❌ | type=select 时的选项列表 |

### 2.5 参数类型

| 类型 | 控件 | 说明 | 可用阶段 |
|---|---|---|---|
| `text` | 单行输入框 | 最大长度 256 | MVP |
| `number` | 数字输入框 | 整数或浮点数 | MVP |
| `select` | 下拉选择框 | 值必须在 `data` 列表中 | MVP |
| `textarea` | 多行输入框 | 最大长度 4096 | MVP |
| `password` | 密码输入框 | 不回显，存储加密 | MVP |
| `checkbox` | 复选框 | 值为 true/false | P1 |
| `datetime` | 日期时间选择器 | 格式 YYYY-MM-DD HH:MM:SS | P1 |
| `file` | 文件上传 | 最大 10MB | P1 |

## 3. main/ 执行逻辑规范

### 3.1 入口函数

每个 action 的 `func` 对应 `main/handler.py` 中的一个函数。

```python
# apps/helloworld/main/handler.py

def hello_world(args, context):
    """
    args: dict - 用户配置的参数，如 {"name": "W5"}
    context: dict - 执行上下文，包含：
        - exec_id: str - 当前执行 ID
        - node_id: str - 当前节点 ID
        - workflow_uuid: str - 当前剧本 UUID
        - workflow_name: str - 当前剧本名称
        - variables: dict - 全局变量
        - logger: Logger - 日志记录器
        - redis: Redis - Redis 客户端
        - http: HTTPClient - HTTP 请求客户端
        - secrets: Secrets - 密钥管理器（P1 可用）
    return: dict - 执行结果，支持任意 JSON 可序列化格式
    """
    name = args.get("name", "World")
    result = f"Hello {name}"

    context["logger"].info(f"HelloWorld executed: name={name}, result={result}")

    return {
        "result": result
    }
```

### 3.2 函数签名

```python
def <func_name>(args: dict, context: dict) -> dict:
    """APP 执行入口
    
    Args:
        args: 用户配置的参数，已按 app.json args 定义校验
        context: 执行上下文
        
    Returns:
        dict: 执行结果，必须是 JSON 可序列化
        
    Raises:
        AppExecutionError: 执行失败时抛出，会自动记录到执行日志
    """
```

### 3.3 错误处理

```python
from core.utils.errors import AppExecutionError

def query_database(args, context):
    try:
        # 执行逻辑
        result = do_query(args["sql"])
        return {"rows": result, "count": len(result)}
    except DatabaseConnectionError as e:
        raise AppExecutionError(f"数据库连接失败: {str(e)}")
    except Exception as e:
        raise AppExecutionError(f"执行失败: {str(e)}")
```

### 3.4 context 对象

| 字段 | 类型 | 说明 | 可用阶段 |
|---|---|---|---|
| `exec_id` | `str` | 当前执行 ID | MVP |
| `node_id` | `str` | 当前节点 ID | MVP |
| `workflow_uuid` | `str` | 当前剧本 UUID | MVP |
| `workflow_name` | `str` | 当前剧本名称 | MVP |
| `variables` | `dict` | 全局变量（key-value） | P0 |
| `logger` | `Logger` | 日志记录器（loguru） | MVP |
| `redis` | `Redis` | Redis 客户端 | MVP |
| `http` | `HTTPClient` | HTTP 请求客户端 | MVP |
| `secrets` | `Secrets` | 密钥管理器 | P1 |
| `worker_id` | `str` | 执行 Worker ID（分布式场景） | P2 |

## 4. 内置 APP 编写规范

### 4.1 目录命名

- APP 目录名使用小写字母和短横线，如 `hello-world`、`http-request`。
- 目录名同时也是 APP 的 `code`，在系统中唯一。

### 4.2 文件命名

- `app.json`：APP 元信息。
- `icon.png`：APP 图标，建议 128x128 像素，PNG 格式。
- `readme.md`：APP 使用说明，Markdown 格式。
- `main/__init__.py`：Python 包初始化，可空。
- `main/handler.py`：APP 执行逻辑。

### 4.3 示例：基础 APP 列表

#### 4.3.1 Hello World

```json
{
  "identification": "soar",
  "is_public": true,
  "name": "Hello World",
  "version": "0.1",
  "description": "SOAR 平台 - Hello World 示例 APP",
  "type": "基础应用",
  "action": [
    {"name": "HelloWorld", "func": "hello_world"}
  ],
  "args": {
    "hello_world": [
      {"key": "name", "type": "text", "required": true, "default": "World", "description": "要问候的名称"}
    ]
  }
}
```

#### 4.3.2 Base64

```json
{
  "identification": "soar",
  "is_public": true,
  "name": "Base64",
  "version": "0.1",
  "description": "Base64 编解码",
  "type": "基础应用",
  "action": [
    {"name": "Base64 编码", "func": "encode"},
    {"name": "Base64 解码", "func": "decode"}
  ],
  "args": {
    "encode": [
      {"key": "text", "type": "textarea", "required": true, "description": "要编码的文本"}
    ],
    "decode": [
      {"key": "text", "type": "textarea", "required": true, "description": "要解码的 Base64 字符串"}
    ]
  }
}
```

#### 4.3.3 Email

```json
{
  "identification": "soar",
  "is_public": true,
  "name": "E-Mail",
  "version": "0.1",
  "description": "可以发送邮件的 APP",
  "type": "消息通知",
  "action": [
    {"name": "邮件发送", "func": "send"}
  ],
  "args": {
    "send": [
      {"key": "host", "type": "text", "required": true, "description": "SMTP 服务器"},
      {"key": "port", "type": "number", "required": true, "default": 25, "description": "SMTP 端口"},
      {"key": "user", "type": "text", "required": true, "description": "SMTP 用户名"},
      {"key": "passwd", "type": "password", "required": true, "description": "SMTP 密码"},
      {"key": "encrypt", "type": "select", "required": true, "default": "none", "data": ["none", "tsl", "ssl"], "description": "加密方式"},
      {"key": "sender", "type": "text", "required": true, "description": "发件人地址"},
      {"key": "to", "type": "text", "required": true, "description": "收件人地址（多个用逗号分隔）"},
      {"key": "title", "type": "text", "required": true, "description": "邮件标题"},
      {"key": "type", "type": "select", "required": true, "default": "text", "data": ["text", "html"], "description": "邮件类型"},
      {"key": "text", "type": "textarea", "required": true, "description": "邮件内容"}
    ]
  }
}
```

## 5. 第三方 APP 导入规范（P1）

### 5.1 ZIP 包格式

```
my-app-v1.0.zip
├── app.json          # APP 元信息（必需）
├── icon.png          # APP 图标（可选）
├── readme.md         # APP 使用说明（可选）
├── main/             # 执行逻辑（必需）
│   ├── __init__.py
│   └── handler.py
└── requirements.txt  # Python 依赖（可选，P1 不自动安装）
```

### 5.2 导入校验

| 校验项 | 规则 | 错误码 |
|---|---|---|
| ZIP 格式 | 解压成功 | `APP_ZIP_INVALID` |
| `app.json` 存在 | 必须存在 | `APP_MANIFEST_MISSING` |
| `app.json` 格式 | JSON 合法 | `APP_MANIFEST_INVALID` |
| `identification` | 必须为 `soar` | `APP_IDENTIFICATION_INVALID` |
| `name` | 必填，非空 | `APP_NAME_MISSING` |
| `main/` 存在 | 必须存在 | `APP_MAIN_MISSING` |
| 版本 | 遵循 semver | `APP_VERSION_INVALID` |
| 版本冲突 | 同版本已存在且未确认覆盖 | `APP_ALREADY_EXISTS` |
| 低版本覆盖 | 版本低于当前版本 | `APP_VERSION_NOT_NEWER` |

### 5.3 存储路径

```
/data/app_packages/
├── helloworld/
│   ├── 0.1.zip
│   └── 0.2.zip
└── email/
    └── 1.0.zip
```

## 6. APP 开发 SDK（P2）

### 6.1 安装

```bash
pip install soar-app-sdk
```

### 6.2 使用装饰器

```python
from soar_app_sdk import SoarApp, SoarAction, SoarParam

app = SoarApp(
    name="My App",
    description="My custom APP",
    type="集成",
    version="1.0.0"
)

@app.action(
    name="查询数据",
    func="query_data",
    params=[
        SoarParam(key="api_url", type="text", required=True, description="API URL"),
        SoarParam(key="api_key", type="password", required=True, description="API Key"),
        SoarParam(key="timeout", type="number", default=30, description="超时时间（秒）"),
    ]
)
def query_data(args, context):
    """查询外部 API 数据"""
    import requests
    response = requests.get(
        args["api_url"],
        headers={"Authorization": f"Bearer {args['api_key']}"},
        timeout=args.get("timeout", 30)
    )
    response.raise_for_status()
    return {"data": response.json()}


if __name__ == "__main__":
    # 本地调试
    app.run_debug(args={"api_url": "http://localhost:8000/api", "api_key": "test"})
```

### 6.3 生成 app.json

```bash
python app.py generate-app-json
```

输出：

```json
{
  "identification": "soar",
  "is_public": true,
  "name": "My App",
  "version": "1.0.0",
  "description": "My custom APP",
  "type": "集成",
  "action": [
    {
      "name": "查询数据",
      "func": "query_data"
    }
  ],
  "args": {
    "query_data": [
      {"key": "api_url", "type": "text", "required": true, "description": "API URL"},
      {"key": "api_key", "type": "password", "required": true, "description": "API Key"},
      {"key": "timeout", "type": "number", "required": false, "default": 30, "description": "超时时间（秒）"}
    ]
  }
}
```

### 6.4 打包

```bash
python app.py package
```

输出：`my-app-1.0.0.zip`

### 6.5 上传

```bash
python app.py upload --url=http://soar.example.com --token=<token>
```

## 7. 安全规范

### 7.1 APP 禁止行为

- 禁止直接访问数据库（必须通过 `context` 提供的接口）。
- 禁止执行系统命令（如 `os.system`、`subprocess`），除非在 `app.json` 中声明 `run_cmd` 权限。
- 禁止读取/写入文件系统路径，除非在 `app.json` 中声明 `file_access` 权限。
- 禁止访问私有网络地址（如 `127.0.0.1`、`10.0.0.0/8`），除非在 `app.json` 中声明 `private_network` 权限。
- 禁止存储敏感数据（密码、Token、Key）到日志中。

### 7.2 权限声明

```json
{
  "identification": "soar",
  "name": "Linux 命令执行",
  "permissions": ["run_cmd", "file_access"],
  "action": [
    {"name": "执行命令", "func": "run_command"}
  ]
}
```

### 7.3 执行沙箱（P3）

- P3 阶段可选的执行沙箱机制：
  - Docker 容器隔离：每个 APP 在独立容器中执行。
  - 资源限制：CPU、内存、磁盘写入限制。
  - 网络限制：白名单 IP/域名通过代理访问。
  - 文件系统限制：只读根文件系统，仅 `/tmp` 可写。

## 8. 内置 APP 一览

| APP 编码 | 名称 | 类型 | 动作 | 阶段 |
|---|---|---|---|---|
| `helloworld` | Hello World | 基础应用 | hello_world | MVP |
| `base64` | Base64 | 基础应用 | encode, decode | MVP |
| `md5` | MD5 | 基础应用 | encrypt | MVP |
| `email` | E-Mail | 消息通知 | send | MVP |
| `dingding` | 钉钉 | 消息通知 | send_markdown, send_link | MVP |
| `feishu` | 飞书 | 消息通知 | send_message | MVP |
| `serverjiang` | Server酱 | 消息通知 | send | MVP |
| `http_request` | HTTP 请求 | 网络请求 | get, post, put, delete | MVP |
| `mysql` | MySQL | 数据库 | query, execute | MVP |
| `redis` | Redis | 数据库 | get, set, delete, execute | MVP |
| `es` | Elasticsearch | 数据库 | search, index, delete | MVP |
| `clickhouse` | ClickHouse | 数据库 | query, execute | MVP |
| `splunk` | Splunk | 安全工具 | search, alert | MVP |
| `nmap` | NMAP | 安全工具 | scan | P0 |
| `otx` | AlienVault OTX | 安全工具 | query_indicator | P0 |
| `threatbook` | 微步威胁情报 | 安全工具 | query_ip, query_domain, query_file | P0 |
| `whois` | Whois | 安全工具 | query | P0 |
| `icp` | ICP 备案查询 | 安全工具 | query | P0 |
| `ip` | IP 查询 | 安全工具 | query_location | P0 |
| `phone` | 手机号查询 | 安全工具 | query_location | P0 |
| `bankcard` | 银行卡查询 | 安全工具 | query_bank | P0 |
| `qq` | QQ 查询 | 安全工具 | query_qq | P0 |
| `url` | URL 解析 | 基础应用 | parse, encode, decode | P0 |
| `linux` | Linux | 运维 | run_command, send_file, read_file | P0 |
| `windows` | Windows | 运维 | run_command, send_file | P0 |
| `basic` | 基础工具 | 基础应用 | sleep, noop, assert, print | P0 |
| `zhfc` | 综合查询 | 安全工具 | search | P0 |
| `honming` | 红名查询 | 安全工具 | query | P0 |
| `cmdb` | CMDB 集成 | 集成 | query_assets, get_asset_detail, update_asset_tag | P2 |
| `alicloud` | 阿里云 | 云平台 | scale_out_ecs, update_waf_rule | P3 |
| `tencentcloud` | 腾讯云 | 云平台 | scale_out_cvm, update_waf_rule | P3 |