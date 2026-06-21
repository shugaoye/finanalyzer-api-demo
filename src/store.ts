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

const nowISO = () => new Date().toISOString();
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

class Store<T extends { id?: string; created_at?: string | null; updated_at?: string | null }> {
  private items: Map<string, T> = new Map();
  private idKey: keyof T;

  constructor(idKey: keyof T = "id" as keyof T) {
    this.idKey = idKey;
  }

  all(): T[] {
    return Array.from(this.items.values());
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  set(id: string, value: T): void {
    this.items.set(id, value);
  }

  insert(value: T): T {
    const id = (value[this.idKey as keyof T] as string) || uuid();
    const ts = nowISO();
    const v = { ...(value as any), id, created_at: ts, updated_at: ts } as T;
    this.items.set(id, v);
    return v;
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const cur = this.items.get(id);
    if (!cur) return undefined;
    const updated = { ...(cur as any), ...(patch as any), id, updated_at: nowISO() } as T;
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  clear(): void {
    this.items.clear();
  }
}

export const stores = {
  stocks: new Map<string, StockResponse>(),
  transactions: new Map<string, TransactionResponse>(),
  dashboards: new Map<string, { response: DashboardResponse; widgetMap: Map<string, WidgetBase> }>(),
  sessions: new Map<string, { id: string; title: string; created_at: string; updated_at: string }>(),
  models: [
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "anthropic", description: "Default model for query processing." },
    { id: "gpt-4o", name: "GPT-4o", provider: "openai", description: "OpenAI latest flagship model." },
    { id: "deepseek-v3", name: "DeepSeek V3", provider: "deepseek", description: "DeepSeek reasoning model." },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", description: "Google Gemini family model." },
  ],
};

// --- Seed mock data at module load ---
// Cloudflare Workers are stateless, so we seed initial data
// to ensure every worker instance starts with demo data.
function seedMockData() {
  const ts = () => new Date().toISOString();

  // --- Stocks ---
  const seedStocks: Array<{ symbol: string; name: string; quantity: number; avg_price: number; currency: string; sector: string; industry: string; market: string }> = [
    { symbol: "600519.SH", name: "贵州茅台", quantity: 100, avg_price: 1680.5, currency: "CNY", sector: "消费", industry: "白酒", market: "SH" },
    { symbol: "000858.SZ", name: "五粮液", quantity: 500, avg_price: 168.2, currency: "CNY", sector: "消费", industry: "白酒", market: "SZ" },
    { symbol: "601318.SH", name: "中国平安", quantity: 1000, avg_price: 45.8, currency: "CNY", sector: "金融", industry: "保险", market: "SH" },
    { symbol: "300750.SZ", name: "宁德时代", quantity: 200, avg_price: 215.6, currency: "CNY", sector: "能源", industry: "电池", market: "SZ" },
    { symbol: "AAPL.US", name: "Apple Inc.", quantity: 50, avg_price: 198.5, currency: "USD", sector: "科技", industry: "消费电子", market: "US" },
    { symbol: "MSFT.US", name: "Microsoft", quantity: 30, avg_price: 420.0, currency: "USD", sector: "科技", industry: "软件", market: "US" },
  ];
  seedStocks.forEach((s) => {
    stores.stocks.set(s.symbol, { ...s, created_at: ts(), updated_at: ts() });
  });

  // --- Transactions ---
  const seedTransactions: Array<{ id: string; symbol: string; type: "buy" | "sell"; quantity: number; price: number; date: string; notes: string | null }> = [
    { id: "tx-001", symbol: "600519.SH", type: "buy", quantity: 100, price: 1680.5, date: "2026-01-15T00:00:00.000Z", notes: "Initial position" },
    { id: "tx-002", symbol: "000858.SZ", type: "buy", quantity: 500, price: 168.2, date: "2026-01-20T00:00:00.000Z", notes: null },
    { id: "tx-003", symbol: "601318.SH", type: "buy", quantity: 1000, price: 45.8, date: "2026-02-01T00:00:00.000Z", notes: null },
    { id: "tx-004", symbol: "300750.SZ", type: "buy", quantity: 200, price: 215.6, date: "2026-02-10T00:00:00.000Z", notes: null },
    { id: "tx-005", symbol: "AAPL.US", type: "buy", quantity: 50, price: 198.5, date: "2026-03-01T00:00:00.000Z", notes: "Tech allocation" },
    { id: "tx-006", symbol: "MSFT.US", type: "buy", quantity: 30, price: 420.0, date: "2026-03-05T00:00:00.000Z", notes: null },
  ];
  seedTransactions.forEach((t) => {
    const total = Number((t.quantity * t.price).toFixed(4));
    stores.transactions.set(t.id, { ...t, total, created_at: ts(), updated_at: ts() });
  });

  // --- Dashboards ---
  const seedDashboards: Array<{
    id: string;
    name: string;
    description: string;
    widgets: WidgetBase[];
    tabs: TabBase[];
    groups: Array<{ [key: string]: any }>;
  }> = [
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
      tabs: [
        { id: "tab-overview", name: "概览", icon: "layout" },
      ],
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
      tabs: [
        { id: "tab-analysis", name: "分析", icon: "bar-chart" },
      ],
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
      tabs: [
        { id: "tab-portfolio", name: "组合", icon: "wallet" },
      ],
      groups: [],
    },
  ];
  seedDashboards.forEach((d) => {
    const widgetMap = new Map<string, WidgetBase>();
    (d.widgets ?? []).forEach((w) => widgetMap.set(w.id, w));
    const response: DashboardResponse = {
      id: d.id,
      name: d.name,
      description: d.description,
      widgets: d.widgets,
      tabs: d.tabs,
      groups: d.groups,
      created_at: ts(),
      updated_at: ts(),
    };
    stores.dashboards.set(d.id, { response, widgetMap });
  });
}

seedMockData();

function withTimestamps<T extends object>(obj: T): T & { created_at: string; updated_at: string } {
  const ts = nowISO();
  return { ...obj, created_at: ts, updated_at: ts };
}

function updateTimestamps<T extends { updated_at?: string | null }>(obj: T): T {
  return { ...obj, updated_at: nowISO() };
}

// ---- Stocks ----
export function listStocks(): StockResponse[] {
  return Array.from(stores.stocks.values());
}

export function getStock(symbol: string): StockResponse | undefined {
  return stores.stocks.get(symbol);
}

export function createStock(input: StockCreate): StockResponse {
  const existing = stores.stocks.get(input.symbol);
  if (existing) {
    const updated = updateTimestamps({ ...existing, ...input });
    stores.stocks.set(input.symbol, updated);
    return updated;
  }
  const record = withTimestamps({
    symbol: input.symbol,
    name: input.name ?? null,
    quantity: input.quantity ?? 0,
    avg_price: input.avg_price ?? 0,
    currency: input.currency ?? "CNY",
    sector: input.sector ?? null,
    industry: input.industry ?? null,
    market: input.market ?? null,
  }) as StockResponse;
  stores.stocks.set(input.symbol, record);
  return record;
}

export function updateStock(symbol: string, patch: StockUpdate): StockResponse | undefined {
  const cur = stores.stocks.get(symbol);
  if (!cur) return undefined;
  const updated = updateTimestamps({ ...cur, ...patch, symbol });
  stores.stocks.set(symbol, updated);
  return updated;
}

export function deleteStock(symbol: string): boolean {
  return stores.stocks.delete(symbol);
}

// ---- Transactions ----
export function listTransactions(opts?: { symbol?: string; start_date?: string; end_date?: string }): TransactionResponse[] {
  let items = Array.from(stores.transactions.values());
  if (opts?.symbol) items = items.filter((t) => t.symbol === opts.symbol);
  if (opts?.start_date) items = items.filter((t) => (t.date ?? t.created_at ?? "") >= opts.start_date!);
  if (opts?.end_date) items = items.filter((t) => (t.date ?? t.created_at ?? "") <= opts.end_date!);
  items.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return items;
}

export function getTransaction(id: string): TransactionResponse | undefined {
  return stores.transactions.get(id);
}

export function createTransaction(input: TransactionCreate): TransactionResponse {
  const id = uuid();
  const total = Number((Number(input.quantity) * Number(input.price)).toFixed(4));
  const record = withTimestamps({
    id,
    symbol: input.symbol,
    type: input.type,
    quantity: input.quantity,
    price: input.price,
    date: input.date ?? nowISO(),
    notes: input.notes ?? null,
    total,
  }) as TransactionResponse;
  stores.transactions.set(id, record);
  return record;
}

export function updateTransaction(id: string, patch: TransactionUpdate): TransactionResponse | undefined {
  const cur = stores.transactions.get(id);
  if (!cur) return undefined;
  const next = { ...cur, ...patch } as TransactionResponse;
  if (patch.quantity != null && patch.price != null) {
    next.total = Number((Number(patch.quantity) * Number(patch.price)).toFixed(4));
  } else if (patch.quantity != null) {
    next.total = Number((Number(patch.quantity) * Number(cur.price)).toFixed(4));
  } else if (patch.price != null) {
    next.total = Number((Number(cur.quantity) * Number(patch.price)).toFixed(4));
  }
  const updated = updateTimestamps(next);
  stores.transactions.set(id, updated);
  return updated;
}

export function deleteTransaction(id: string): boolean {
  return stores.transactions.delete(id);
}

// ---- Dashboards ----
export function listDashboards(): DashboardResponse[] {
  return Array.from(stores.dashboards.values()).map((d) => d.response);
}

export function getDashboard(id: string): DashboardResponse | undefined {
  return stores.dashboards.get(id)?.response;
}

export function createDashboard(input: DashboardCreate): DashboardResponse {
  const id = uuid();
  const widgetMap = new Map<string, WidgetBase>();
  (input.widgets ?? []).forEach((w) => widgetMap.set(w.id, w));
  const response = withTimestamps({
    id,
    name: input.name,
    description: input.description ?? null,
    widgets: (input.widgets ?? []).slice(),
    tabs: (input.tabs ?? []).slice(),
    groups: (input.groups ?? []).slice(),
  }) as DashboardResponse;
  stores.dashboards.set(id, { response, widgetMap });
  return response;
}

export function updateDashboard(id: string, patch: DashboardUpdate): DashboardResponse | undefined {
  const cur = stores.dashboards.get(id);
  if (!cur) return undefined;
  const newWidgets = patch.widgets ?? cur.response.widgets ?? [];
  const widgetMap = new Map<string, WidgetBase>();
  newWidgets.forEach((w) => widgetMap.set(w.id, w));
  const updated = updateTimestamps({
    ...cur.response,
    name: patch.name ?? cur.response.name,
    description: patch.description !== undefined ? patch.description : cur.response.description,
    widgets: newWidgets,
    tabs: patch.tabs !== undefined ? patch.tabs : cur.response.tabs,
    groups: patch.groups !== undefined ? patch.groups : cur.response.groups,
  }) as DashboardResponse;
  stores.dashboards.set(id, { response: updated, widgetMap });
  return updated;
}

export function deleteDashboard(id: string): boolean {
  return stores.dashboards.delete(id);
}

// ---- Dashboard Widgets ----
export function listDashboardWidgets(dashboardId: string): WidgetResponse[] | undefined {
  const d = stores.dashboards.get(dashboardId);
  return d ? Array.from(d.widgetMap.values()) : undefined;
}

export function addDashboardWidget(dashboardId: string, input: WidgetCreate): WidgetResponse | undefined {
  const d = stores.dashboards.get(dashboardId);
  if (!d) return undefined;
  d.widgetMap.set(input.id, input);
  d.response.widgets = Array.from(d.widgetMap.values());
  d.response.updated_at = nowISO();
  return input;
}

export function updateDashboardWidget(dashboardId: string, widgetId: string, patch: WidgetUpdate): WidgetResponse | undefined {
  const d = stores.dashboards.get(dashboardId);
  if (!d) return undefined;
  const cur = d.widgetMap.get(widgetId);
  if (!cur) return undefined;
  const updated = {
    ...cur,
    title: patch.title !== undefined ? patch.title : cur.title,
    position: patch.position !== undefined ? patch.position : cur.position,
    data: patch.data !== undefined ? patch.data : cur.data,
  } as WidgetBase;
  d.widgetMap.set(widgetId, updated);
  d.response.widgets = Array.from(d.widgetMap.values());
  d.response.updated_at = nowISO();
  return updated;
}

export function deleteDashboardWidget(dashboardId: string, widgetId: string): boolean {
  const d = stores.dashboards.get(dashboardId);
  if (!d || !d.widgetMap.has(widgetId)) return false;
  d.widgetMap.delete(widgetId);
  d.response.widgets = Array.from(d.widgetMap.values());
  d.response.updated_at = nowISO();
  return true;
}

// ---- Sessions ----
export function listSessions(): { id: string; title: string; created_at: string; updated_at: string }[] {
  return Array.from(stores.sessions.values());
}

export function getSession(id: string) {
  return stores.sessions.get(id);
}

export function ensureSession(id: string, title?: string) {
  const existing = stores.sessions.get(id);
  if (existing) {
    existing.updated_at = nowISO();
    return existing;
  }
  const ts = nowISO();
  const rec = { id, title: title ?? `Session ${id.slice(0, 8)}`, created_at: ts, updated_at: ts };
  stores.sessions.set(id, rec);
  return rec;
}

export function clearSessions(): void {
  stores.sessions.clear();
}
