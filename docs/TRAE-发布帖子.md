# 【学习工作赛道】使用 Trae 开发和部署 Finanalyzer Demo 后端

> 项目作者：shugaoye
>
> 参赛赛道：学习 / 工作
>
> 演示发布日期：2026-06-21

---

## 1. 项目简介

**Finanalyzer** 是一款针对国内市场优化的开源金融分析工作台，它基于 [OpenBB](https://github.com/OpenBB-finance) 架构开发，致力于提供：

- **全中文交互界面**：从菜单、图表标题到帮助文案全部本地化，消除普通用户阅读英文金融终端的门槛。
- **本土数据源支持**：对 A 股行情、上市公司信息、研报摘要、行业指标等国内数据做了原生适配，避免用户自行拼接数据源。
- **可拓展的分析管线**：以组件化方式管理指标计算、信号筛选与组合回测，方便社区二次开发。

项目由三个主要仓库组成：

| 仓库 | 说明 |
| --- | --- |
| [finanalyzer](https://github.com/finanalyzer) | 项目总入口与组织页 |
| [finanalyzer/app](https://github.com/finanalyzer/app) | 前端工作台（React / 全中文） |
| [finanalyzer/api](https://github.com/finanalyzer/api) | 后端 API 服务（FastAPI） |

### 为什么要做这次 Demo 后端？

`finanalyzer/api` 默认基于 Python FastAPI，需要用户准备 Python 环境、配置依赖、处理数据源鉴权、最后自己托管一台服务器。这一整套流程对普通学习者与想"看一眼效果"的用户来说门槛过高，严重限制了项目的早期反馈与传播。

**本次 Demo 作品的目标**：在不牺牲接口语义的前提下，用一套**轻量 TypeScript 实现**，把所有核心 API 直接部署到 **Cloudflare Workers** —— 让用户只需打开浏览器、输入 URL，即可体验完整的全中文金融分析工作台，**无需安装、无需配置、无需服务器**。

---

## 2. 创作思路

### 2.1 为什么不直接把原版 Python API 搬上 Workers？

Cloudflare Workers 的运行时是 V8 isolate，而非完整的 Linux 进程，因此：

- Python 原生生态（pandas / requests / sqlalchemy 等）在 Workers 上不可用（或需走 `python-on-workers`，冷启动与体积难以控制）。
- Workers 单次 CPU 预算约几十毫秒，传统后端重度计算不适合它的角色。
- 关键痛点：**用户本来就不想自己起后端**。

因此我的思路是：**把后端改写成一个"纯接口 + 静态数据"的服务**，让它完全符合 `finanalyzer/api` 对外暴露的 OpenAPI 规范，同时只使用 Worker 运行时内建能力即可完成响应。

### 2.2 以 OpenAPI 为唯一事实来源

从 [finanalyzer/api](https://github.com/finanalyzer/api) 的 FastAPI 应用自动导出一份 `openapi.json`，在项目中把它视为 **唯一事实来源（single source of truth）**。之后 Demo 后端的开发全部围绕它进行：

1. 把 `openapi.json` 作为仓库中的权威规范（`docs/openapi.json`）。
2. 在构建时把它内联到 `src/openapi.ts`，运行时直接返回同样的 JSON 给 `/openapi.json`。
3. 让前端（`finanalyzer/app`）在加载时请求这份规范，以动态生成菜单与调用项 —— 这种"前端以 OpenAPI 为依赖而不是以某个私有后端为依赖"的设计，是 Demo 可以被任意部署环境承载的关键。

### 2.3 轻量级接口实现

对每条 API，只做最小但语义一致的实现：

- **持仓 / 交易**：`POST /api/v1/portfolio/stocks` 与 `POST /api/v1/portfolio/transactions` 使用内存 Map 存储（演示用途）；请求体字段完全对齐 OpenAPI 里的 `StockCreate` / `TransactionCreate`，响应体也严格一致。
- **A 股行情**：`GET /api/v1/cn/equity/price/historical` 与 `GET /api/v1/cn/equity/ticker_information` 基于确定性随机数生成历史 OHLCV 与基本信息，保证刷新前后数据稳定、可复现。
- **选股**：`GET /api/v1/cn/equity/screener` 使用策略阈值返回标的列表，方便前端过滤控件调试。
- **仪表盘**：`POST /api/v1/dashboard`、`POST /api/v1/dashboard/template/default`，支持 3 套模板（默认 / A 股 / 组合），每个仪表盘下还支持 `POST /api/v1/dashboard/{id}/widgets` 细粒度管理部件。
- **代理**：`GET /api/v1/proxy?url=...` 允许前端把无法直接请求的 URL 转到 Worker 中继，解决浏览器 CORS 与某些第三方接口的跨域限制。

### 2.4 用 Trae 加速开发

整个过程是 **"先用 Trae 写代码，再用 Trae 验代码，最后用 Trae 改代码"** 的循环：

- **生成**：让 Trae 读取 `openapi.json` 中的 `paths` / `schemas`，按路径批量生成 TypeScript 路由骨架；让 Trae 解释 `HTTPValidationError` 的响应形状，确保 422 错误与原 Python 服务一致。
- **校验**：每次增加一条路由后，让 Trae 生成对应的 `curl` 请求脚本，跑一次 `wrangler dev` 本地验证，确保每个接口能返回正确 JSON。
- **修复**：过程中 Trae 还发现了一些容易踩的坑（如 pnpm `deploy` 子命令与我们 `package.json` 中的 `deploy` 脚本冲突，导致 `ERR_PNPM_CANNOT_DEPLOY`；再如 OpenAPI 静态资源路径写成了根路径 `/apps.json`，与 Worker 实际注册的 `/api/apps.json` 不一致等），并给出精准的修复建议。

总体来说，**写代码的时间从"几小时/几天"缩短到"几十分钟"**，**排查部署问题的时间**也通过"让 Trae 边跑边反馈"的方式显著缩减。

---

## 3. Demo 体验信息

无需安装任何东西，直接在浏览器中打开即可。

| 项目 | 链接 |
| --- | --- |
| 🖥 **前端体验地址** | [https://finanalyzer.github.io/app/#/app](https://finanalyzer.github.io/app/#/app) |
| 🧪 **后端 Swagger UI（交互式调试）** | [https://finanalyzer-api-demo.shugaoye.workers.dev/docs](https://finanalyzer-api-demo.shugaoye.workers.dev/docs) |
| 📄 **后端 OpenAPI 规范（JSON）** | [https://finanalyzer-api-demo.shugaoye.workers.dev/openapi.json](https://finanalyzer-api-demo.shugaoye.workers.dev/openapi.json) |
| ⚙ **健康检查** | [https://finanalyzer-api-demo.shugaoye.workers.dev/api/v1/health](https://finanalyzer-api-demo.shugaoye.workers.dev/api/v1/health) |

### 3.1 推荐体验流程

1. 打开前端地址 [https://finanalyzer.github.io/app/#/app](https://finanalyzer.github.io/app/#/app)，进入全中文的工作台主页。
2. 若前端未自动加载 API：在应用内填入后端根地址 `https://finanalyzer-api-demo.shugaoye.workers.dev` 即可。
3. 打开 [Swagger UI](https://finanalyzer-api-demo.shugaoye.workers.dev/docs)，直接在浏览器里点击 "Try it out" → "Execute"，实时查看每条接口的请求与响应 JSON。
4. 把 [openapi.json](https://finanalyzer-api-demo.shugaoye.workers.dev/openapi.json) 保存到本地，可把它喂给任意 OpenAPI 工具（Postman / OpenAPI Generator / APIFox）进一步派生客户端代码或自动化测试。

---

## 4. 技术亮点

### 4.1 一份 OpenAPI 规范 = 前后端的契约

- 前端按规范解析路径与 schema，直接生成导航、表格、表单。
- 后端按规范实现每一条路径，保证字段名、类型、错误码完全一致。
- 优点：**后端实现可以替换，前端代码不需要改动**。这是 Demo 能从 Python 后端无缝迁移到 Cloudflare Workers 的最关键决策。

### 4.2 零运维 / 零成本的边缘部署

- **Cloudflare Workers** 免费套餐即可运行本项目，没有服务器、没有 24 小时开机的维护成本。
- 全球任意网络边缘节点就近响应，访问 latency 远低于"自己在家搭个 VPS"。
- 部署命令只有一行：`npx wrangler deploy`，全程由 CLI 提示绑定域名、登录账号。

### 4.3 纯 TypeScript / 无外部数据库

- 没有任何需要独立部署的数据库服务（PostgreSQL/Redis）。需要持久化时可在将来按需接入 Cloudflare KV / D1 / R2，不影响现有代码结构。
- 仓库构建产物极小，本次 demo `Total Upload ≈ 109.65 KiB`（gzip 后约 19 KiB），对带宽和冷启动都很友好。

### 4.4 内建的 "以规范为唯一依赖" 的静态资源

- `/openapi.json` 由构建脚本从 `docs/openapi.json` 自动生成到 `src/openapi.ts`，保证线上返回的规范与仓库中的规范一致。
- `/docs` 直接托管 Swagger UI HTML，任何人点击都能马上看到接口列表。
- `/api/apps.json`、`/api/agents.json`、`/api/widgets.json` 提供前端加载时的菜单 / 代理 / 部件定义，方便二次开发。

### 4.5 清晰的错误语义

- 所有参数缺失错误统一以 HTTP 422 返回 `{"detail":[{"loc":["body","symbol"],"msg":"Field required","type":"missing"}]}`，与 `finanalyzer/api` 原版 Python 服务的行为一致。
- 未找到资源返回 HTTP 404 + JSON 错误体，前端可以优雅降级。

---

## 5. 仓库结构与代码引用

```
finanalyzer-api-demo/
├─ docs/
│  └─ openapi.json                      # OpenAPI 3.1 规范
├─ scripts/
│  └─ generate-openapi-ts.js            # 把 openapi.json 内联为 TS
├─ src/
│  ├─ index.ts                          # Worker 入口 + 路由（约 300 行）
│  ├─ store.ts                          # 内存存储层（stocks/transactions/dashboards）
│  ├─ mock.ts                           # 历史 K 线 / 选股 / 指标 / 新闻 / 标的搜索
│  ├─ static.ts                         # apps.json / agents.json / widgets.json
│  ├─ openapi.ts                        # 由 docs/openapi.json 自动生成
│  ├─ types.ts                          # 与 OpenAPI 对齐的 TypeScript 类型
│  └─ utils.ts                          # json() / validationError() 等响应辅助
├─ wrangler.jsonc                       # Cloudflare Workers 配置
├─ package.json                         # dev / check / cf:deploy / build / generate:openapi
├─ tsconfig.json                        # TS 配置
└─ README.md                            # 使用与部署说明
```

关键代码位置：

- Worker 入口与路由总装：[src/index.ts](file:///workspace/src/index.ts)
- OpenAPI 规范（权威）：[docs/openapi.json](file:///workspace/docs/openapi.json)
- 部署配置：[wrangler.jsonc](file:///workspace/wrangler.jsonc)
- 脚本与依赖：[package.json](file:///workspace/package.json)
- README / 部署 / CI 文档：[README.md](file:///workspace/README.md)

---

## 6. 快速部署到你自己的 Cloudflare

如果你也想把这个 Demo 部署到自己的账号下，只需：

```bash
git clone https://github.com/finanalyzer/finanalyzer-api-demo.git
cd finanalyzer-api-demo
npm install

# 登录一次（浏览器会弹出）
npx wrangler login

# 本地先跑一把
npm run dev         # 打开 http://127.0.0.1:8787/docs

# 发布到 Cloudflare
npx wrangler deploy
# 若你使用 pnpm，请用  pnpm run cf:deploy  （避免与 pnpm 内置 deploy 子命令冲突）
```

更详细的说明、自定义域名绑定、KV / D1 / R2 扩展方式、GitHub Actions 自动发布示例，均在项目根目录的 [README.md](file:///workspace/README.md) 中提供。

---

## 7. 小结

本次 Demo 的核心交付其实只有一件事：**把一份专业的金融分析服务从"需要你自己搭后端"降低到"打开浏览器就能用"**。技术上有几条经验可以分享给其他参赛选手：

1. **先写规范，再写代码**。先让 AI 帮你把 OpenAPI / GraphQL / protobuf 定义梳理好，代码只是规范的实现。这样你换部署环境、换语言时，都不会被业务代码"绑架"。
2. **以"能不能一行命令部署"为验收标准**。如果部署需要超过 5 步，对普通用户来说就约等于"不能用"。Cloudflare Workers 这种"一键 push 即全球可用"的边缘平台非常适合做 demo / 文档站点 / 轻量 API。
3. **让 Trae 做你的"结对伙伴"，而不仅仅是写代码机器**。让它读你的 OpenAPI、读你的部署日志、读你的错误输出，它能显著缩短"发现问题 → 定位根因 → 修复 → 回归"的闭环时间。

感谢阅读，欢迎访问上述 Demo 地址体验！
