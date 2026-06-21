# finanalyzer-api-demo

基于 Cloudflare Workers 构建的 **finanalyzer** 演示后端接口，严格遵循
[docs/openapi.json](file:///workspace/docs/openapi.json) 定义的 OpenAPI 3.1.0 规范，并自动提供 Swagger UI 文档。

- 全局 CDN 边缘部署（Cloudflare Workers 免费套餐可用）
- 纯 TypeScript 实现，无外部数据库依赖（演示环境使用内存存储）
- 提供 `/docs` / `/openapi.json` 自动生成的 Swagger UI
- 提供股票、交易、指标、新闻、选股器、仪表盘、会话、查询代理等完整 API

---

## 1. 目录结构

```
finanalyzer-api-demo/
├─ docs/
│  └─ openapi.json          # 权威的 OpenAPI 3.1.0 规范
├─ scripts/
│  └─ generate-openapi-ts.js# 将 openapi.json 内联到 src/openapi.ts
├─ src/
│  ├─ index.ts              # Worker 入口与路由
│  ├─ store.ts              # 内存存储层（stock / transaction / dashboard / ...）
│  ├─ mock.ts               # 金融数据模拟生成
│  ├─ static.ts             # apps.json / agents.json / widgets.json
│  ├─ openapi.ts            # 内联的 openapi.json 正文
│  ├─ types.ts              # TypeScript 类型定义
│  └─ utils.ts              # 响应辅助函数（json/validationError/...）
├─ wrangler.jsonc           # Cloudflare Workers 配置
├─ tsconfig.json            # TypeScript 编译配置
├─ package.json             # npm 脚本与依赖
└─ README.md
```

---

## 2. 本地环境要求

- Node.js **≥ 18**（推荐 20.x LTS）
- npm **≥ 9**（或 pnpm/yarn，按你习惯调整）
- 一个 [Cloudflare 账号](https://dash.cloudflare.com/)（免费套餐即可部署）

> macOS / Linux / Windows 均通过 Wrangler CLI 原生支持。

安装依赖：

```bash
cd finanalyzer-api-demo
npm install
```

---

## 3. 本地开发

### 3.1 启动本地边缘服务器

```bash
npm run dev
# 等价于：npx wrangler dev --port 8787
```

启动后你会看到类似：

```
 ⛅️ wrangler 3.114.17
---------------------
⎔ Starting local server...
[mf:inf] Ready on http://127.0.0.1:8787/
```

访问如下地址验证：

| 地址 | 说明 |
| --- | --- |
| <http://127.0.0.1:8787/> | 健康返回 |
| <http://127.0.0.1:8787/api/v1/health> | API 健康检查 |
| <http://127.0.0.1:8787/docs> | **Swagger UI**（交互式 API 文档） |
| <http://127.0.0.1:8787/openapi.json> | **OpenAPI 3.1.0 规范** JSON |
| <http://127.0.0.1:8787/api/apps.json> | 静态配置 |

### 3.2 本地请求示例

```bash
# 创建股票
curl -s -X POST http://127.0.0.1:8787/api/v1/portfolio/stocks \
  -H 'content-type: application/json' \
  -d '{"symbol":"600519.SH","name":"贵州茅台","quantity":100,"avg_price":1500.0,"currency":"CNY","sector":"消费"}'

# 查询历史K线
curl -s "http://127.0.0.1:8787/api/v1/cn/equity/price/historical?symbol=600519.SH&start_date=2026-06-01&end_date=2026-06-10&interval=1d"

# 关键指标
curl -s "http://127.0.0.1:8787/api/v1/portfolio/key_metrics?symbol=600519.SH"

# 新闻
curl -s "http://127.0.0.1:8787/api/v1/portfolio/news?symbol=600519.SH&limit=3"

# 选股器
curl -s "http://127.0.0.1:8787/api/v1/cn/equity/screener?market=SH&strategy_rate=0.3"

# 标的搜索
curl -s "http://127.0.0.1:8787/api/v1/widgets/ticker_search?query=茅台"
```

### 3.3 类型检查 / 构建 dry-run

```bash
# 类型检查
npm run check

# 构建 dry-run（不上传，但会在 dist/ 生成部署产物用于检查）
npm run build
```

### 3.4 当 `docs/openapi.json` 有更新时

```bash
npm run generate:openapi
```

该脚本会用最新的 [docs/openapi.json](file:///workspace/docs/openapi.json) 重新生成 [src/openapi.ts](file:///workspace/src/openapi.ts)，保证 `/openapi.json` 返回的内容与规范文件完全一致。

---

## 4. 部署到 Cloudflare Workers

### 4.1 登录 Cloudflare（首次需要）

```bash
npx wrangler login
```

浏览器会弹出授权页面；选择目标 Cloudflare 账号即可。完成后 `wrangler` 会在本机 `~/.config/wrangler/config.toml`（或等同位置）保存 API token。

> 如果你更希望使用环境变量方式（CI / Headless 部署场景），可直接在 Cloudflare 控制台 → **My Profile → API Tokens → Create Token** → 选择 **“Edit Cloudflare Workers”** 模板，生成 token 后：
>
> ```bash
> export CLOUDFLARE_API_TOKEN=你的Token
> export CLOUDFLARE_ACCOUNT_ID=你的AccountID
> ```

### 4.2 修改 Worker 名称（可选）

编辑 [wrangler.jsonc](file:///workspace/wrangler.jsonc)：

```jsonc
{
  "name": "finanalyzer-api-demo",        // <- Cloudflare Worker 的名称
  "main": "src/index.ts",
  "compatibility_date": "2024-06-20",
  "compatibility_flags": ["nodejs_compat"]
}
```

`name` 会成为默认路由 `https://<name>.<your-subdomain>.workers.dev` 的前缀。

### 4.3 正式部署

```bash
npm run deploy
# 等价于：npx wrangler deploy
```

首次部署成功后，终端会打印类似：

```
 ⛅️ wrangler 3.114.17
---------------------
Total Upload: 109.65 KiB / gzip: 19.19 KiB
Uploaded finanalyzer-api-demo (0.56 sec)
Published finanalyzer-api-demo (0.92 sec)
  https://finanalyzer-api-demo.你的子域名.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

浏览器打开上面的 `https://...workers.dev` 即可正式访问。

> 如果你还没有 Workers 子域名，首次部署时 `wrangler` 会引导你在 Cloudflare 控制台创建。

### 4.4 查看日志

```bash
# 实时 tail（按 Ctrl+C 退出）
npx wrangler tail finanalyzer-api-demo

# 查看近 N 次部署版本
npx wrangler versions list
```

### 4.5 后续每次更新

```bash
git pull                 # 如果使用 git
npm install              # 仅当依赖有变化时
npm run check            # 类型检查
npm run deploy           # 重新发布新版本
```

每次 `wrangler deploy` 会创建一个新的部署版本，Cloudflare 控制台（**Workers & Pages → finanalyzer-api-demo → Deployments**）保留历史，需要回滚时可在网页版一键切换版本。

---

## 5. 绑定自定义域名（可选）

方式一：通过 Cloudflare Dashboard

1. [Cloudflare 控制台 → Workers & Pages → 选择 `finanalyzer-api-demo` → Settings → Triggers → Custom Domains → Add Custom Domain](https://dash.cloudflare.com/?to=/:account/workers)
2. 输入你要绑定的域名，例如 `api.example.com`，然后按提示确认 DNS 记录。
3. Cloudflare 会自动创建对应的 `CNAME` 记录并签发免费的 Universal SSL 证书；等待 DNS 生效后即可通过 `https://api.example.com` 访问。

方式二：通过 `wrangler.jsonc` 的 `routes` 字段（高级用法）

```jsonc
{
  "name": "finanalyzer-api-demo",
  "main": "src/index.ts",
  "compatibility_date": "2024-06-20",
  "routes": ["api.example.com/*"]
}
```

然后重新 `npm run deploy`。

---

## 6. API 速览（与 OpenAPI 完全一致）

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/v1/health` | `GET` | 健康检查 |
| `/api/v1/query` | `POST` | 处理查询；支持 `stream=true` 以 SSE 流式返回 |
| `/api/v1/terminate` | `POST` | 终止运行中的会话（演示语义） |
| `/api/v1/clear-sessions` | `POST` | 清空会话列表 |
| `/api/v1/sessions` | `GET` | 列出会话 |
| `/api/v1/models` | `GET` | 列出可用模型 |
| `/api/v1/cn/equity/price/historical` | `GET` | A 股历史 K 线 |
| `/api/v1/cn/equity/screener` | `GET` | 选股器 |
| `/api/v1/cn/equity/ticker_information` | `GET` | 标的基本信息 |
| `/api/v1/portfolio/stocks` | `GET / POST` | 股票持仓列表 / 新建 |
| `/api/v1/portfolio/stocks/{symbol}` | `GET / PUT / DELETE` | 个股查看 / 更新 / 删除 |
| `/api/v1/portfolio/delete-stock` | `POST` | 基于请求体的删除（兼容前端表单） |
| `/api/v1/portfolio/transactions` | `GET / POST` | 交易记录列表 / 新增 |
| `/api/v1/portfolio/transactions/{id}` | `GET / PUT / DELETE` | 单笔交易操作 |
| `/api/v1/portfolio/validate` | `GET` | 校验组合一致性 |
| `/api/v1/portfolio/key_metrics` | `GET` | 关键指标（PE/PB/夏普/最大回撤…） |
| `/api/v1/portfolio/news` | `GET` | 相关新闻 |
| `/api/v1/symbols` | `GET` | 返回关注标的列表 |
| `/api/v1/dashboard` | `GET / POST` | 仪表盘列表 / 新建 |
| `/api/v1/dashboard/{id}` | `GET / PUT / DELETE` | 单体仪表盘 CRUD |
| `/api/v1/dashboard/template/{template}` | `POST` | 从模板（`default` / `cn_market` / `portfolio`）快速创建 |
| `/api/v1/dashboard/{id}/widgets` | `GET / POST` | 仪表盘内 widget 列表 / 添加 |
| `/api/v1/dashboard/{id}/widgets/{widget_id}` | `PUT / DELETE` | widget 更新 / 删除 |
| `/api/v1/proxy` | `GET / POST` | 代理请求（`?url=目标URL&method=POST`） |
| `/api/v1/widgets/ticker_search` | `GET` | 标的搜索 |
| `/api/apps.json` | `GET` | 静态配置 |
| `/api/agents.json` | `GET` | 静态配置 |
| `/api/widgets.json` | `GET` | 静态配置 |
| `/openapi.json` | `GET` | **OpenAPI 3.1.0 规范** |
| `/docs` 或 `/swagger` | `GET` | **Swagger UI** |

请求体校验错误返回 HTTP 422：

```json
{ "detail": [{ "loc": ["body", "symbol"], "msg": "Field required", "type": "missing" }] }
```

---

## 7. 扩展 / 持久化（可选）

当前所有状态均保存在 Worker 的进程内存中，**每次部署或冷启动会重置**。这对演示完全足够；若你希望投入实际使用，可添加以下 Cloudflare 原生服务。

### 7.1 使用 Workers KV 保存持仓与交易

```bash
npx wrangler kv namespace create "FINANALYZER"
```

修改 [wrangler.jsonc](file:///workspace/wrangler.jsonc)：

```jsonc
{
  "name": "finanalyzer-api-demo",
  "main": "src/index.ts",
  "compatibility_date": "2024-06-20",
  "compatibility_flags": ["nodejs_compat"],
  "kv_namespaces": [{ "binding": "STORE", "id": "你刚创建的 namespace id" }]
}
```

之后可在 `src/store.ts` 把读写改为使用 `env.STORE.get(key)` / `env.STORE.put(key, JSON.stringify(value))`。

### 7.2 使用 D1 做关系型存储

```bash
npx wrangler d1 create finanalyzer
```

在 `wrangler.jsonc` 绑定：

```jsonc
"d1_databases": [{ "binding": "DB", "database_name": "finanalyzer", "database_id": "输出的 uuid" }]
```

D1 是基于 SQLite 的边缘数据库，兼容 SQL 查询，适合 stocks / transactions / sessions 这类结构化场景。

### 7.3 使用 R2 存放报表与静态资源

```bash
npx wrangler r2 bucket create finanalyzer-assets
```

在 `wrangler.jsonc` 绑定：

```jsonc
"r2_buckets": [{ "binding": "ASSETS", "bucket_name": "finanalyzer-assets" }]
```

可以用来存历史行情导出、前端 HTML / 静态文件等。

> 上面的绑定会自动在 TypeScript 类型中可用；执行 `npm run check` 会自动更新 `worker-configuration.d.ts` 中的 `Env` 类型。

---

## 8. CI / CD 示例（GitHub Actions）

在你的仓库根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy finanalyzer-api-demo
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run check
      - name: Publish to Cloudflare Workers
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

在 GitHub 仓库 **Settings → Secrets and variables → Actions → New repository secret** 添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

之后每次 `git push` 到 `main` 即自动发布到 Cloudflare。

---

## 9. License

详见 [LICENSE](file:///workspace/LICENSE)。
