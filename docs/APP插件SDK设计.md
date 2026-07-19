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
│   └── plugin.go         # APP 执行逻辑（必需）
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

## 3. plugin.go 执行逻辑规范

### 3.1 入口函数

每个 action 的 `func` 对应 `plugin.go` 中的一个函数。

```go
// plugins/helloworld/plugin.go

package helloworld

import (
    "context"
    "fmt"
)

type App struct{}

type Args struct {
    Name string `json:"name"`
}

type Result struct {
    Result string `json:"result"`
}

func (a *App) HelloWorld(ctx context.Context, args Args) (*Result, error) {
    // args: 用户配置的参数，如 {"name": "W5"}
    // ctx: 执行上下文，包含：
    //   - exec_id: string - 当前执行 ID
    //   - node_id: string - 当前节点 ID
    //   - workflow_uuid: string - 当前剧本 UUID
    //   - workflow_name: string - 当前剧本名称
    //   - variables: map[string]interface{} - 全局变量
    //   - logger: *slog.Logger - 日志记录器
    //   - redis: *redis.Client - Redis 客户端
    //   - http: *http.Client - HTTP 请求客户端
    // return: *Result - 执行结果，JSON 可序列化
    // return: error - 执行失败时返回错误

    name := args.Name
    if name == "" {
        name = "World"
    }
    result := fmt.Sprintf("Hello %s", name)

    slog.Info("HelloWorld executed", "name", name, "result", result)

    return &Result{Result: result}, nil
}
```

### 3.2 函数签名

```go
// 函数签名
func (a *App) ActionName(ctx context.Context, args ArgsType) (*ResultType, error)
```

### 3.3 错误处理

```go
package myapp

import (
    "context"
    "fmt"
)

type App struct{}

type QueryArgs struct {
    SQL string `json:"sql"`
}

type QueryResult struct {
    Rows  []map[string]interface{} `json:"rows"`
    Count int                      `json:"count"`
}

func (a *App) QueryDatabase(ctx context.Context, args QueryArgs) (*QueryResult, error) {
    if args.SQL == "" {
        return nil, fmt.Errorf("VALIDATION_ERROR: sql is required")
    }
    return nil, fmt.Errorf("数据库连接失败: %v", err)
}
```

### 3.4 context 对象

Go 插件通过 `context.Context` 获取执行上下文，通过 `context.WithValue` 传递额外信息。

| key 常量 | 类型 | 说明 | 可用阶段 |
|---|---|---|---|
| `CtxKeyExecID` | `string` | 当前执行 ID | MVP |
| `CtxKeyNodeID` | `string` | 当前节点 ID | MVP |
| `CtxKeyWorkflowUUID` | `string` | 当前剧本 UUID | MVP |
| `CtxKeyWorkflowName` | `string` | 当前剧本名称 | MVP |
| `CtxKeyVariables` | `map[string]interface{}` | 全局变量 | P0 |
| `CtxKeyLogger` | `*slog.Logger` | 日志记录器 | MVP |
| `CtxKeyRedis` | `*redis.Client` | Redis 客户端 | MVP |
| `CtxKeyHTTPClient` | `*http.Client` | HTTP 请求客户端 | MVP |
| `CtxKeySecrets` | `Secrets` | 密钥管理器 | P1 |
| `CtxKeyWorkerID` | `string` | 执行 Worker ID | P2 |

```go
// 插件中获取上下文信息
func (a *App) HelloWorld(ctx context.Context, args Args) (*Result, error) {
    execID := ctx.Value(CtxKeyExecID).(string)
    logger := ctx.Value(CtxKeyLogger).(*slog.Logger)
    logger.Info("executing", "exec_id", execID)
    // ...
}
```

## 4. 内置 APP 编写规范

### 4.1 目录命名

- APP 目录名使用小写字母和短横线，如 `hello-world`、`http-request`。
- 目录名同时也是 APP 的 `code`，在系统中唯一。

### 4.2 文件命名

- `app.json`：APP 元信息。
- `icon.png`：APP 图标，建议 128x128 像素，PNG 格式。
- `readme.md`：APP 使用说明，Markdown 格式。
- `plugin.go`：APP 执行逻辑（Go 源码）。

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
├── plugin.go         # 执行逻辑（必需）
└── go.mod            # Go 模块定义（可选）
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
go get github.com/soar/soar-app-sdk
```

### 6.2 使用 SDK 编写插件

```go
package myapp

import (
    "context"
    "fmt"
    "net/http"
    "io"
    "encoding/json"
)

type App struct{}

type QueryDataArgs struct {
    APIURL  string `json:"api_url"`
    APIKey  string `json:"api_key"`
    Timeout int    `json:"timeout"`
}

type QueryDataResult struct {
    Data interface{} `json:"data"`
}

func (a *App) QueryData(ctx context.Context, args QueryDataArgs) (*QueryDataResult, error) {
    client := &http.Client{}
    req, err := http.NewRequest("GET", args.APIURL, nil)
    if err != nil {
        return nil, fmt.Errorf("request creation failed: %w", err)
    }
    req.Header.Set("Authorization", "Bearer "+args.APIKey)
    
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("API request failed: %w", err)
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    var data interface{}
    json.Unmarshal(body, &data)
    
    return &QueryDataResult{Data: data}, nil
}
```

### 6.3 生成 app.json

```bash
go run plugin.go generate-app-json
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
go build -o my-app.so -buildmode=plugin
# 或打包为 ZIP 供上传
zip my-app-1.0.0.zip plugin.go app.json icon.png readme.md
```

### 6.5 上传

```bash
soar-cli upload --url=http://soar.example.com --token=<token>
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