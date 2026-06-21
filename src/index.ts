import { json, notFound, badRequest, validationError, readJSON } from "./utils";
import { appsJson, agentsJson, widgetsJson } from "./static";
import { openApiSpec } from "./openapi";
import {
  listStocks,
  getStock,
  createStock,
  updateStock,
  deleteStock,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  listDashboardWidgets,
  addDashboardWidget,
  updateDashboardWidget,
  deleteDashboardWidget,
  listSessions,
  ensureSession,
  clearSessions,
  stores,
} from "./store";
import {
  generateHistorical,
  generateScreener,
  generateTickerInfo,
  defaultSymbols,
  generateKeyMetrics,
  generateNews,
  validatePortfolio,
  tickerSearch,
  buildDashboardFromTemplate,
} from "./mock";
import type {
  StockCreate,
  StockUpdate,
  StockDeleteRequest,
  TransactionCreate,
  TransactionUpdate,
  DashboardCreate,
  DashboardUpdate,
  WidgetCreate,
  WidgetUpdate,
  QueryRequest,
} from "./types";

interface RouteContext {
  path: string;
  search: URLSearchParams;
  method: string;
  headers: Headers;
}

function swaggerHtml(specUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>finanalyzer API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
    <style>
      html, body { margin: 0; padding: 0; }
      .swagger-ui .topbar { background-color: #1b1f24; }
      #swagger-ui { max-width: 1400px; margin: 0 auto; padding: 24px; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        window.SwaggerUIBundle({
          url: ${JSON.stringify(specUrl)},
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          plugins: [SwaggerUIBundle.plugins.DownloadUrl],
          layout: "StandaloneLayout",
        });
      };
    </script>
  </body>
</html>`;
}

async function handleProxy(url: string, method: string, body: Request | null, headers: Headers): Promise<Response> {
  if (!url) return badRequest("Missing 'url' query parameter");
  try {
    new URL(url);
  } catch {
    return badRequest("Invalid target URL");
  }
  const upstreamHeaders = new Headers();
  for (const [k, v] of headers.entries()) {
    if (k.toLowerCase().startsWith("x-") || ["accept", "content-type", "authorization"].includes(k.toLowerCase())) {
      upstreamHeaders.set(k, v);
    }
  }
  const init: RequestInit = { method: method.toUpperCase(), headers: upstreamHeaders };
  if (body && ["POST", "PUT", "PATCH"].includes(init.method ?? "GET")) {
    try {
      const text = await body.clone().text();
      if (text) init.body = text;
    } catch {
      // ignore
    }
  }
  try {
    const r = await fetch(url, init);
    const data = await r.text();
    return new Response(data, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" } });
  } catch (err: any) {
    return json({ error: "Proxy request failed", message: err?.message ?? String(err) }, 502);
  }
}

async function handleQuery(body: any): Promise<Response> {
  const q: QueryRequest = body ?? {};
  if (!q.query) {
    return validationError([{ loc: ["body", "query"], msg: "Field required", type: "missing" }]);
  }
  const sessionId = q.session_id ?? `sess-${Date.now()}`;
  ensureSession(sessionId, q.query.slice(0, 60));
  if (q.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const chunks = [
          { type: "message", role: "assistant", content: `正在处理您的查询："${q.query}"` },
          { type: "tool_use", name: "ticker_search", result: tickerSearch(q.query) },
          { type: "tool_result", name: "historical_price", data: generateHistorical(q.query.slice(0, 16)) },
          { type: "message", role: "assistant", content: "已完成查询分析。" },
        ];
        chunks.forEach((c, i) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`));
          void i;
        });
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" },
    });
  }
  return json({
    session_id: sessionId,
    query: q.query,
    answer: `已处理查询：${q.query}。返回示例数据，共 ${defaultSymbols().length} 个标的。`,
    symbols: defaultSymbols(),
    models: stores.models,
    created_at: new Date().toISOString(),
  });
}

function methodNotAllowed(): Response {
  return json({ error: "Method Not Allowed" }, 405);
}

export async function handleRoute(url: URL, request: Request): Promise<Response> {
  const path = url.pathname;
  const search = url.searchParams;
  const method = request.method;
  const ctx: RouteContext = { path, search, method, headers: request.headers };
  void ctx;

  // ---- Root / Health ----
  if (path === "/" || path === "/health") {
    return json({ status: "ok", service: "finanalyzer-api-demo", version: "1.5.12", now: new Date().toISOString() });
  }

  // ---- Swagger UI ----
  if (path === "/docs" || path === "/swagger" || path === "/docs/") {
    return new Response(swaggerHtml("/openapi.json"), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // ---- OpenAPI spec ----
  if (path === "/openapi.json" || path === "/api/openapi.json") {
    return json(openApiSpec);
  }

  // ---- Static config ----
  if (path === "/api/apps.json" || path === "/apps.json") return method === "GET" ? json(appsJson) : methodNotAllowed();
  if (path === "/api/agents.json" || path === "/agents.json") return method === "GET" ? json(agentsJson) : methodNotAllowed();
  if (path === "/api/widgets.json" || path === "/widgets.json") return method === "GET" ? json(widgetsJson) : methodNotAllowed();

  // ---- /api/v1/health ----
  if (path === "/api/v1/health")
    return method === "GET"
      ? json({
          status: "ok",
          version: "1.5.12",
          dependencies: {
            store: "ok",
            models: `${stores.models.length} models loaded`,
            widgets: `${widgetsJson.widgets.length} widgets registered`,
          },
        })
      : methodNotAllowed();

  // ---- /api/v1/sessions ----
  if (path === "/api/v1/sessions") {
    if (method === "GET") return json(listSessions());
    return methodNotAllowed();
  }

  // ---- /api/v1/models ----
  if (path === "/api/v1/models") {
    if (method === "GET") return json(stores.models);
    return methodNotAllowed();
  }

  // ---- /api/v1/query ----
  if (path === "/api/v1/query") {
    if (method !== "POST") return methodNotAllowed();
    const body = await readJSON(request);
    return handleQuery(body);
  }

  // ---- /api/v1/terminate ----
  if (path === "/api/v1/terminate") {
    if (method !== "POST") return methodNotAllowed();
    return json({ status: "terminated", message: "Any running session has been terminated (demo)." });
  }

  // ---- /api/v1/clear-sessions ----
  if (path === "/api/v1/clear-sessions") {
    if (method !== "POST") return methodNotAllowed();
    clearSessions();
    return json({ status: "ok", message: "Sessions cleared" });
  }

  // ---- CN equity ----
  if (path === "/api/v1/cn/equity/price/historical") {
    if (method !== "GET") return methodNotAllowed();
    const symbol = search.get("symbol");
    if (!symbol) return validationError([{ loc: ["query", "symbol"], msg: "Field required", type: "missing" }]);
    return json(generateHistorical(symbol, search.get("start_date") ?? undefined, search.get("end_date") ?? undefined, search.get("interval") ?? "1d"));
  }
  if (path === "/api/v1/cn/equity/screener") {
    if (method !== "GET") return methodNotAllowed();
    return json(
      generateScreener({
        is_realized: search.get("is_realized") === "true",
        use_cache: search.get("use_cache") !== "false",
        market: search.get("market") ?? undefined,
        strategy_rate: search.get("strategy_rate") ? parseFloat(search.get("strategy_rate")!) : undefined,
      })
    );
  }
  if (path === "/api/v1/cn/equity/ticker_information") {
    if (method !== "GET") return methodNotAllowed();
    return json(generateTickerInfo(search.get("symbol") ?? undefined));
  }

  // ---- /api/v1/symbols ----
  if (path === "/api/v1/symbols") {
    if (method !== "GET") return methodNotAllowed();
    const symbols = defaultSymbols();
    const fromPortfolio = listStocks().map((s) => s.symbol);
    const merged = Array.from(new Set([...fromPortfolio, ...symbols]));
    return json({ count: merged.length, symbols: merged });
  }

  // ---- Portfolio: stocks ----
  if (path === "/api/v1/portfolio/stocks") {
    if (method === "GET") return json(listStocks());
    if (method === "POST") {
      const body = (await readJSON(request)) as StockCreate;
      if (!body?.symbol) return validationError([{ loc: ["body", "symbol"], msg: "Field required", type: "missing" }]);
      return json(createStock(body));
    }
    return methodNotAllowed();
  }
  if (path.startsWith("/api/v1/portfolio/stocks/")) {
    const symbol = decodeURIComponent(path.slice("/api/v1/portfolio/stocks/".length));
    if (!symbol) return notFound();
    if (method === "GET") {
      const s = getStock(symbol);
      return s ? json(s) : notFound(`Stock ${symbol} not found`);
    }
    if (method === "PUT") {
      const body = (await readJSON(request)) as StockUpdate;
      const updated = updateStock(symbol, body);
      return updated ? json(updated) : notFound(`Stock ${symbol} not found`);
    }
    if (method === "DELETE") {
      const ok = deleteStock(symbol);
      return ok ? json({ success: true, symbol }) : notFound(`Stock ${symbol} not found`);
    }
    return methodNotAllowed();
  }

  // ---- Portfolio: delete-stock (POST variant) ----
  if (path === "/api/v1/portfolio/delete-stock") {
    if (method !== "POST") return methodNotAllowed();
    const body = (await readJSON(request)) as StockDeleteRequest;
    if (!body?.symbol) return validationError([{ loc: ["body", "symbol"], msg: "Field required", type: "missing" }]);
    const ok = deleteStock(body.symbol);
    return json({ success: ok, symbol: body.symbol, message: ok ? "Deleted" : "Not found" });
  }

  // ---- Portfolio: transactions ----
  if (path === "/api/v1/portfolio/transactions") {
    if (method === "GET")
      return json(
        listTransactions({
          symbol: search.get("symbol") ?? undefined,
          start_date: search.get("start_date") ?? undefined,
          end_date: search.get("end_date") ?? undefined,
        })
      );
    if (method === "POST") {
      const body = (await readJSON(request)) as TransactionCreate;
      if (!body?.symbol || body.quantity == null || body.price == null) {
        const errors = [];
        if (!body?.symbol) errors.push({ loc: ["body", "symbol"], msg: "Field required", type: "missing" });
        if (body?.quantity == null) errors.push({ loc: ["body", "quantity"], msg: "Field required", type: "missing" });
        if (body?.price == null) errors.push({ loc: ["body", "price"], msg: "Field required", type: "missing" });
        return validationError(errors);
      }
      return json(createTransaction(body));
    }
    return methodNotAllowed();
  }
  if (path.startsWith("/api/v1/portfolio/transactions/")) {
    const id = path.slice("/api/v1/portfolio/transactions/".length);
    if (!id) return notFound();
    if (method === "GET") {
      const t = getTransaction(id);
      return t ? json(t) : notFound(`Transaction ${id} not found`);
    }
    if (method === "PUT") {
      const body = (await readJSON(request)) as TransactionUpdate;
      const updated = updateTransaction(id, body);
      return updated ? json(updated) : notFound(`Transaction ${id} not found`);
    }
    if (method === "DELETE") {
      const ok = deleteTransaction(id);
      return ok ? json({ success: true, id }) : notFound(`Transaction ${id} not found`);
    }
    return methodNotAllowed();
  }

  // ---- Portfolio: validate ----
  if (path === "/api/v1/portfolio/validate") {
    if (method !== "GET") return methodNotAllowed();
    return json(validatePortfolio(listStocks(), listTransactions()));
  }

  // ---- Portfolio: key_metrics ----
  if (path === "/api/v1/portfolio/key_metrics") {
    if (method !== "GET") return methodNotAllowed();
    const symbol = search.get("symbol");
    if (!symbol) return validationError([{ loc: ["query", "symbol"], msg: "Field required", type: "missing" }]);
    return json(generateKeyMetrics(symbol));
  }

  // ---- Portfolio: news ----
  if (path === "/api/v1/portfolio/news") {
    if (method !== "GET") return methodNotAllowed();
    const symbol = search.get("symbol");
    if (!symbol) return validationError([{ loc: ["query", "symbol"], msg: "Field required", type: "missing" }]);
    const limit = parseInt(search.get("limit") ?? "5", 10) || 5;
    return json(generateNews(symbol, limit));
  }

  // ---- Dashboard ----
  if (path === "/api/v1/dashboard") {
    if (method === "GET") return json(listDashboards());
    if (method === "POST") {
      const body = (await readJSON(request)) as DashboardCreate;
      if (!body?.name) return validationError([{ loc: ["body", "name"], msg: "Field required", type: "missing" }]);
      return json(createDashboard(body));
    }
    return methodNotAllowed();
  }
  if (path.startsWith("/api/v1/dashboard/template/")) {
    const tpl = decodeURIComponent(path.slice("/api/v1/dashboard/template/".length));
    if (method === "POST") {
      const data = buildDashboardFromTemplate(tpl);
      const created = createDashboard({
        name: data.name,
        description: data.description,
        widgets: data.widgets,
        tabs: data.tabs,
      });
      return json(created);
    }
    return methodNotAllowed();
  }
  if (path.startsWith("/api/v1/dashboard/")) {
    const rest = path.slice("/api/v1/dashboard/".length);
    const [dashboardId, maybeWidgets, widgetId] = rest.split("/");
    if (!dashboardId) return notFound();
    if (!maybeWidgets) {
      // dashboard by id
      if (method === "GET") {
        const d = getDashboard(dashboardId);
        return d ? json(d) : notFound(`Dashboard ${dashboardId} not found`);
      }
      if (method === "PUT") {
        const body = (await readJSON(request)) as DashboardUpdate;
        const updated = updateDashboard(dashboardId, body);
        return updated ? json(updated) : notFound(`Dashboard ${dashboardId} not found`);
      }
      if (method === "DELETE") {
        const ok = deleteDashboard(dashboardId);
        return ok ? json({ success: true, id: dashboardId }) : notFound(`Dashboard ${dashboardId} not found`);
      }
      return methodNotAllowed();
    }
    if (maybeWidgets === "widgets") {
      if (!widgetId) {
        if (method === "GET") {
          const list = listDashboardWidgets(dashboardId);
          return list === undefined ? notFound(`Dashboard ${dashboardId} not found`) : json(list);
        }
        if (method === "POST") {
          const body = (await readJSON(request)) as WidgetCreate;
          if (!body?.id || !body?.type || !body?.title || !body?.position) {
            return validationError([
              { loc: ["body", "id"], msg: "Field required", type: "missing" },
              { loc: ["body", "type"], msg: "Field required", type: "missing" },
              { loc: ["body", "title"], msg: "Field required", type: "missing" },
              { loc: ["body", "position"], msg: "Field required", type: "missing" },
            ]);
          }
          const w = addDashboardWidget(dashboardId, body);
          return w ? json(w) : notFound(`Dashboard ${dashboardId} not found`);
        }
        return methodNotAllowed();
      }
      // widget by id
      if (method === "PUT") {
        const body = (await readJSON(request)) as WidgetUpdate;
        const w = updateDashboardWidget(dashboardId, widgetId, body);
        return w ? json(w) : notFound(`Widget ${widgetId} in dashboard ${dashboardId} not found`);
      }
      if (method === "DELETE") {
        const ok = deleteDashboardWidget(dashboardId, widgetId);
        return ok ? json({ success: true, id: widgetId }) : notFound(`Widget ${widgetId} in dashboard ${dashboardId} not found`);
      }
      return methodNotAllowed();
    }
    return notFound();
  }

  // ---- Proxy ----
  if (path === "/api/v1/proxy") {
    const targetUrl = search.get("url");
    if (!targetUrl) return validationError([{ loc: ["query", "url"], msg: "Field required", type: "missing" }]);
    const m = (search.get("method") || method).toUpperCase();
    return handleProxy(targetUrl, m, request, request.headers);
  }

  // ---- Widgets ----
  if (path === "/api/v1/widgets/ticker_search") {
    if (method !== "GET") return methodNotAllowed();
    return json(tickerSearch(search.get("query") ?? undefined));
  }

  // 404
  return notFound(`Endpoint ${method} ${path} not found`);
}

interface Env {
  // bindings declared here, none in current config
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    void env;
    void ctx;
    const url = new URL(request.url);
    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
          "access-control-allow-headers": "Content-Type, Authorization",
        },
      });
    }
    try {
      const resp = await handleRoute(url, request);
      if (!resp.headers.get("access-control-allow-origin")) resp.headers.set("access-control-allow-origin", "*");
      return resp;
    } catch (err: any) {
      return json(
        { error: "Internal Server Error", message: err?.message ?? String(err) },
        500
      );
    }
  },
};
