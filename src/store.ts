import type {
  StockCreate,
  StockResponse,
  StockUpdate,
  TransactionCreate,
  TransactionResponse,
  TransactionUpdate,
  DashboardCreate,
  DashboardResponse,
  DashboardUpdate,
  WidgetCreate,
  WidgetResponse,
  WidgetUpdate,
  WidgetBase,
  TabBase,
} from "./types";

export interface Env {
  STORE: KVNamespace;
}

const nowISO = () => new Date().toISOString();
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Key prefixes for KV
const KEYS = {
  STOCKS: "stocks:",
  TRANSACTIONS: "transactions:",
  DASHBOARDS: "dashboards:",
  SESSIONS: "sessions:",
  MODELS: "models",
  SEEDED: "seeded",
};

export const stores = {
  models: [
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "anthropic", description: "Default model for query processing." },
    { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "OpenAI latest flagship model." },
    { id: "deepseek-v3", name: "DeepSeek V3", provider: "deepseek", description: "DeepSeek reasoning model." },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", description: "Google Gemini family model." },
  ],
};

// ---- KV helpers ----
async function kvGet<T>(kv: KVNamespace, key: string): Promise<T | undefined> {
  const value = await kv.get(key);
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

async function kvSet<T>(kv: KVNamespace, key: string, value: T): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}

async function kvDelete(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

async function kvListKeys(kv: KVNamespace, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await kv.list({ prefix, cursor });
    keys.push(...result.keys.map((k) => k.name));
    if (result.list_complete) {
      break;
    }
    cursor = result.cursor;
  } while (cursor);
  return keys;
}

// ---- Seed mock data at module load ----
async function seedMockData(kv: KVNamespace): Promise<void> {
  const seeded = await kv.get(KEYS.SEEDED);
  if (seeded === "true") return;

  const ts = nowISO();

  // --- Stocks ---
  const seedStocks = [
    { symbol: "600519.SH", name: "贵州茅台", quantity: 100, avg_price: 1680.5, currency: "CNY", sector: "消费", industry: "白酒", market: "SH" },
    { symbol: "000858.SZ", name: "五粮液", quantity: 500, avg_price: 168.2, currency: "CNY", sector: "消费", industry: "白酒", market: "SZ" },
    { symbol: "601318.SH", name: "中国平安", quantity: 1000, avg_price: 45.8, currency: "CNY", sector: "金融", industry: "保险", market: "SH" },
    { symbol: "300750.SZ", name: "宁德时代", quantity: 200, avg_price: 215.6, currency: "CNY", sector: "能源", industry: "电池", market: "SZ" },
    { symbol: "AAPL.US", name: "Apple Inc.", quantity: 50, avg_price: 198.5, currency: "USD", sector: "科技", industry: "消费电子", market: "US" },
    { symbol: "MSFT.US", name: "Microsoft", quantity: 30, avg_price: 420.0, currency: "USD", sector: "科技", industry: "软件", market: "US" },
  ];
  for (const s of seedStocks) {
    await kvSet(kv, KEYS.STOCKS + s.symbol, { ...s, created_at: ts, updated_at: ts });
  }

  // --- Transactions ---
  const seedTransactions = [
    { id: "tx-001", symbol: "600519.SH", type: "buy", quantity: 100, price: 1680.5, date: "2026-01-15T00:00:00.000Z", notes: "Initial position", total: 168050 },
    { id: "tx-002", symbol: "000858.SZ", type: "buy", quantity: 500, price: 168.2, date: "2026-01-20T00:00:00.000Z", notes: null, total: 84100 },
    { id: "tx-003", symbol: "601318.SH", type: "buy", quantity: 1000, price: 45.8, date: "2026-02-01T00:00:00.000Z", notes: null, total: 45800 },
    { id: "tx-004", symbol: "300750.SZ", type: "buy", quantity: 200, price: 215.6, date: "2026-02-10T00:00:00.000Z", notes: null, total: 43120 },
    { id: "tx-005", symbol: "AAPL.US", type: "buy", quantity: 50, price: 198.5, date: "2026-03-01T00:00:00.000Z", notes: "Tech allocation", total: 9925 },
    { id: "tx-006", symbol: "MSFT.US", type: "buy", quantity: 30, price: 420.0, date: "2026-03-05T00:00:00.000Z", notes: null, total: 12600 },
  ];
  for (const t of seedTransactions) {
    await kvSet(kv, KEYS.TRANSACTIONS + t.id, { ...t, created_at: ts, updated_at: ts });
  }

  // --- Dashboards ---
  const seedDashboards = [
    {
      id: "dash-overview",
      name: "投资概览",
      description: "综合展示投资组合的整体情况与关键指标。",
      widgets: [
        { id: "w1-overview", type: "metric", title: "组合总市值", position: { x: 0, y: 0, w: 4, h: 3 }, data: { value: 528450, currency: "CNY" } },
        { id: "w2-overview", type: "metric", title: "总盈亏", position: { x: 4, y: 0, w: 4, h: 3 }, data: { value: 18520, pct: 3.62 } },
        { id: "w3-overview", type: "metric", title: "持仓数量", position: { x: 8, y: 0, w: 4, h: 3 }, data: { value: 6 } },
        { id: "w4-overview", type: "table", title: "持仓明细", position: { x: 0, y: 3, w: 12, h: 6 }, data: { symbol: "600519.SH" } },
      ],
      tabs: [{ id: "tab-overview", name: "概览", icon: "layout" }],
      groups: [],
    },
    {
      id: "dash-cn-market",
      name: "A股市场",
      description: "A股市场行情、标的筛选与价格走势。",
      widgets: [
        { id: "w1-price", type: "chart", title: "历史价格走势", position: { x: 0, y: 0, w: 12, h: 5 }, data: { symbol: "600519.SH", interval: "1d" } },
        { id: "w2-screener", type: "table", title: "市场筛选", position: { x: 0, y: 5, w: 12, h: 6 }, data: { market: "SH" } },
      ],
      tabs: [
        { id: "tab-price", name: "价格", icon: "trending-up" },
        { id: "tab-screener", name: "筛选", icon: "filter" },
      ],
      groups: [],
    },
    {
      id: "dash-analysis",
      name: "分析仪表盘",
      description: "标的关键指标、新闻与基本面分析。",
      widgets: [
        { id: "w1-metrics", type: "table", title: "关键财务指标", position: { x: 0, y: 0, w: 6, h: 6 }, data: { symbol: "600519.SH" } },
        { id: "w2-news", type: "table", title: "相关新闻", position: { x: 6, y: 0, w: 6, h: 6 }, data: { symbol: "600519.SH", limit: 5 } },
      ],
      tabs: [{ id: "tab-analysis", name: "分析", icon: "bar-chart" }],
      groups: [],
    },
    {
      id: "dash-portfolio",
      name: "组合管理",
      description: "管理投资组合的持仓、交易记录与分析。",
      widgets: [
        { id: "w1-holdings", type: "table", title: "持仓概览", position: { x: 0, y: 0, w: 12, h: 5 }, data: {} },
        { id: "w2-tx", type: "table", title: "最近交易", position: { x: 0, y: 5, w: 12, h: 6 }, data: {} },
      ],
      tabs: [{ id: "tab-portfolio", name: "组合", icon: "wallet" }],
      groups: [],
    },
  ];
  for (const d of seedDashboards) {
    await kvSet(kv, KEYS.DASHBOARDS + d.id, {
      id: d.id,
      name: d.name,
      description: d.description,
      widgets: d.widgets,
      tabs: d.tabs,
      groups: d.groups,
      created_at: ts,
      updated_at: ts,
    });
  }

  await kv.put(KEYS.SEEDED, "true");
}

// Initialize KV store - call once per worker instance
export async function initStore(kv: KVNamespace): Promise<void> {
  await seedMockData(kv);
}

// ---- Stocks ----
export async function listStocks(kv: KVNamespace): Promise<StockResponse[]> {
  const keys = await kvListKeys(kv, KEYS.STOCKS);
  const stocks: StockResponse[] = [];
  for (const key of keys) {
    const stock = await kvGet<StockResponse>(kv, key);
    if (stock) stocks.push(stock);
  }
  return stocks;
}

export async function getStock(kv: KVNamespace, symbol: string): Promise<StockResponse | undefined> {
  return kvGet<StockResponse>(kv, KEYS.STOCKS + symbol);
}

export async function createStock(kv: KVNamespace, input: StockCreate): Promise<StockResponse> {
  const existing = await getStock(kv, input.symbol);
  const ts = nowISO();
  let record: StockResponse;
  if (existing) {
    record = { ...existing, ...input, updated_at: ts } as StockResponse;
  } else {
    record = {
      symbol: input.symbol,
      name: input.name ?? null,
      quantity: input.quantity ?? 0,
      avg_price: input.avg_price ?? 0,
      currency: input.currency ?? "CNY",
      sector: input.sector ?? null,
      industry: input.industry ?? null,
      market: input.market ?? null,
      created_at: ts,
      updated_at: ts,
    };
  }
  await kvSet(kv, KEYS.STOCKS + input.symbol, record);
  return record;
}

export async function updateStock(kv: KVNamespace, symbol: string, patch: StockUpdate): Promise<StockResponse | undefined> {
  const cur = await getStock(kv, symbol);
  if (!cur) return undefined;
  const updated = { ...cur, ...patch, symbol, updated_at: nowISO() } as StockResponse;
  await kvSet(kv, KEYS.STOCKS + symbol, updated);
  return updated;
}

export async function deleteStock(kv: KVNamespace, symbol: string): Promise<boolean> {
  const existing = await getStock(kv, symbol);
  if (!existing) return false;
  await kvDelete(kv, KEYS.STOCKS + symbol);
  return true;
}

// ---- Transactions ----
export async function listTransactions(
  kv: KVNamespace,
  opts?: { symbol?: string; start_date?: string; end_date?: string }
): Promise<TransactionResponse[]> {
  const keys = await kvListKeys(kv, KEYS.TRANSACTIONS);
  let items: TransactionResponse[] = [];
  for (const key of keys) {
    const tx = await kvGet<TransactionResponse>(kv, key);
    if (tx) items.push(tx);
  }
  if (opts?.symbol) items = items.filter((t) => t.symbol === opts.symbol);
  if (opts?.start_date) items = items.filter((t) => (t.date ?? t.created_at ?? "") >= opts.start_date!);
  if (opts?.end_date) items = items.filter((t) => (t.date ?? t.created_at ?? "") <= opts.end_date!);
  items.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return items;
}

export async function getTransaction(kv: KVNamespace, id: string): Promise<TransactionResponse | undefined> {
  return kvGet<TransactionResponse>(kv, KEYS.TRANSACTIONS + id);
}

export async function createTransaction(kv: KVNamespace, input: TransactionCreate): Promise<TransactionResponse> {
  const id = uuid();
  const total = Number((Number(input.quantity) * Number(input.price)).toFixed(4));
  const record: TransactionResponse = {
    id,
    symbol: input.symbol,
    type: input.type,
    quantity: input.quantity,
    price: input.price,
    date: input.date ?? nowISO(),
    notes: input.notes ?? null,
    total,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  await kvSet(kv, KEYS.TRANSACTIONS + id, record);
  return record;
}

export async function updateTransaction(
  kv: KVNamespace,
  id: string,
  patch: TransactionUpdate
): Promise<TransactionResponse | undefined> {
  const cur = await getTransaction(kv, id);
  if (!cur) return undefined;
  const next = { ...cur, ...patch } as TransactionResponse;
  if (patch.quantity != null && patch.price != null) {
    next.total = Number((Number(patch.quantity) * Number(patch.price)).toFixed(4));
  } else if (patch.quantity != null) {
    next.total = Number((Number(patch.quantity) * Number(cur.price)).toFixed(4));
  } else if (patch.price != null) {
    next.total = Number((Number(cur.quantity) * Number(patch.price)).toFixed(4));
  }
  const updated = { ...next, updated_at: nowISO() };
  await kvSet(kv, KEYS.TRANSACTIONS + id, updated);
  return updated;
}

export async function deleteTransaction(kv: KVNamespace, id: string): Promise<boolean> {
  const existing = await getTransaction(kv, id);
  if (!existing) return false;
  await kvDelete(kv, KEYS.TRANSACTIONS + id);
  return true;
}

// ---- Dashboards ----
export async function listDashboards(kv: KVNamespace): Promise<DashboardResponse[]> {
  const keys = await kvListKeys(kv, KEYS.DASHBOARDS);
  const dashboards: DashboardResponse[] = [];
  for (const key of keys) {
    const dash = await kvGet<DashboardResponse>(kv, key);
    if (dash) dashboards.push(dash);
  }
  return dashboards;
}

export async function getDashboard(kv: KVNamespace, id: string): Promise<DashboardResponse | undefined> {
  return kvGet<DashboardResponse>(kv, KEYS.DASHBOARDS + id);
}

export async function createDashboard(kv: KVNamespace, input: DashboardCreate): Promise<DashboardResponse> {
  const id = uuid();
  const ts = nowISO();
  const record: DashboardResponse = {
    id,
    name: input.name,
    description: input.description ?? null,
    widgets: (input.widgets ?? []).slice(),
    tabs: (input.tabs ?? []).slice(),
    groups: (input.groups ?? []).slice(),
    created_at: ts,
    updated_at: ts,
  };
  await kvSet(kv, KEYS.DASHBOARDS + id, record);
  return record;
}

export async function updateDashboard(
  kv: KVNamespace,
  id: string,
  patch: DashboardUpdate
): Promise<DashboardResponse | undefined> {
  const cur = await getDashboard(kv, id);
  if (!cur) return undefined;
  const updated: DashboardResponse = {
    ...cur,
    name: patch.name ?? cur.name,
    description: patch.description !== undefined ? patch.description : cur.description,
    widgets: patch.widgets !== undefined ? patch.widgets : cur.widgets,
    tabs: patch.tabs !== undefined ? patch.tabs : cur.tabs,
    groups: patch.groups !== undefined ? patch.groups : cur.groups,
    updated_at: nowISO(),
  };
  await kvSet(kv, KEYS.DASHBOARDS + id, updated);
  return updated;
}

export async function deleteDashboard(kv: KVNamespace, id: string): Promise<boolean> {
  const existing = await getDashboard(kv, id);
  if (!existing) return false;
  await kvDelete(kv, KEYS.DASHBOARDS + id);
  return true;
}

// ---- Dashboard Widgets ----
export async function listDashboardWidgets(
  kv: KVNamespace,
  dashboardId: string
): Promise<WidgetResponse[] | undefined> {
  const d = await getDashboard(kv, dashboardId);
  return d?.widgets as WidgetResponse[] | undefined;
}

export async function addDashboardWidget(
  kv: KVNamespace,
  dashboardId: string,
  input: WidgetCreate
): Promise<WidgetResponse | undefined> {
  const cur = await getDashboard(kv, dashboardId);
  if (!cur) return undefined;
  const widgets = [...(cur.widgets ?? []), input];
  const updated: DashboardResponse = { ...cur, widgets, updated_at: nowISO() };
  await kvSet(kv, KEYS.DASHBOARDS + dashboardId, updated);
  return input;
}

export async function updateDashboardWidget(
  kv: KVNamespace,
  dashboardId: string,
  widgetId: string,
  patch: WidgetUpdate
): Promise<WidgetResponse | undefined> {
  const cur = await getDashboard(kv, dashboardId);
  if (!cur) return undefined;
  const widgets = (cur.widgets ?? []).map((w) => {
    if (w.id !== widgetId) return w;
    return {
      ...w,
      title: patch.title !== undefined ? patch.title : w.title,
      position: patch.position !== undefined ? patch.position : w.position,
      data: patch.data !== undefined ? patch.data : w.data,
    } as WidgetBase;
  });
  const updated: DashboardResponse = { ...cur, widgets, updated_at: nowISO() };
  await kvSet(kv, KEYS.DASHBOARDS + dashboardId, updated);
  return widgets.find((w) => w.id === widgetId);
}

export async function deleteDashboardWidget(kv: KVNamespace, dashboardId: string, widgetId: string): Promise<boolean> {
  const cur = await getDashboard(kv, dashboardId);
  if (!cur) return false;
  const widgets = (cur.widgets ?? []).filter((w) => w.id !== widgetId);
  if (widgets.length === (cur.widgets ?? []).length) return false;
  const updated: DashboardResponse = { ...cur, widgets, updated_at: nowISO() };
  await kvSet(kv, KEYS.DASHBOARDS + dashboardId, updated);
  return true;
}

// ---- Sessions ----
export async function listSessions(
  kv: KVNamespace
): Promise<{ id: string; title: string; created_at: string; updated_at: string }[]> {
  const keys = await kvListKeys(kv, KEYS.SESSIONS);
  const sessions: { id: string; title: string; created_at: string; updated_at: string }[] = [];
  for (const key of keys) {
    const s = await kvGet<{ id: string; title: string; created_at: string; updated_at: string }>(kv, key);
    if (s) sessions.push(s);
  }
  return sessions;
}

export async function getSession(kv: KVNamespace, id: string) {
  return kvGet<{ id: string; title: string; created_at: string; updated_at: string }>(kv, KEYS.SESSIONS + id);
}

export async function ensureSession(kv: KVNamespace, id: string, title?: string) {
  const existing = await getSession(kv, id);
  const ts = nowISO();
  if (existing) {
    const updated = { ...existing, updated_at: ts };
    await kvSet(kv, KEYS.SESSIONS + id, updated);
    return updated;
  }
  const rec = { id, title: title ?? `Session ${id.slice(0, 8)}`, created_at: ts, updated_at: ts };
  await kvSet(kv, KEYS.SESSIONS + id, rec);
  return rec;
}

export async function clearSessions(kv: KVNamespace): Promise<void> {
  const keys = await kvListKeys(kv, KEYS.SESSIONS);
  for (const key of keys) {
    await kvDelete(kv, key);
  }
}
