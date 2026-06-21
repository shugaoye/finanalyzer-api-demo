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

  // --- Stocks with full data matching widget specifications ---
  const seedStocks = [
    {
      symbol: "600519.SH", name: "贵州茅台", quantity: 100, avg_price: 1680.5, avg_cost: 1650.0, currency: "CNY", sector: "消费", industry: "白酒", market: "SH",
      current_price: 1720.50, total_value: 172050, fifty_two_week_low: 1550.00, fifty_two_week_high: 1850.00,
      dividend_yield: 2.50, latest_dividend: 21.65, strategy: "持有", tradingview: "https://www.tradingview.com/chart/?symbol=600519.SH"
    },
    {
      symbol: "000858.SZ", name: "五粮液", quantity: 500, avg_price: 168.2, avg_cost: 165.0, currency: "CNY", sector: "消费", industry: "白酒", market: "SZ",
      current_price: 172.80, total_value: 86400, fifty_two_week_low: 148.00, fifty_two_week_high: 195.00,
      dividend_yield: 2.80, latest_dividend: 3.20, strategy: "买入", tradingview: "https://www.tradingview.com/chart/?symbol=000858.SZ"
    },
    {
      symbol: "601318.SH", name: "中国平安", quantity: 1000, avg_price: 45.8, avg_cost: 44.5, currency: "CNY", sector: "金融", industry: "保险", market: "SH",
      current_price: 48.20, total_value: 48200, fifty_two_week_low: 40.00, fifty_two_week_high: 55.00,
      dividend_yield: 4.20, latest_dividend: 1.80, strategy: "持有", tradingview: "https://www.tradingview.com/chart/?symbol=601318.SH"
    },
    {
      symbol: "300750.SZ", name: "宁德时代", quantity: 200, avg_price: 215.6, avg_cost: 210.0, currency: "CNY", sector: "能源", industry: "电池", market: "SZ",
      current_price: 228.50, total_value: 45700, fifty_two_week_low: 185.00, fifty_two_week_high: 260.00,
      dividend_yield: 1.20, latest_dividend: 1.56, strategy: "持有", tradingview: "https://www.tradingview.com/chart/?symbol=300750.SZ"
    },
    {
      symbol: "AAPL.US", name: "Apple Inc.", quantity: 50, avg_price: 198.5, avg_cost: 195.0, currency: "USD", sector: "科技", industry: "消费电子", market: "US",
      current_price: 215.30, total_value: 10765, fifty_two_week_low: 178.00, fifty_two_week_high: 235.00,
      dividend_yield: 0.50, latest_dividend: 0.24, strategy: "买入", tradingview: "https://www.tradingview.com/chart/?symbol=AAPL.US"
    },
    {
      symbol: "MSFT.US", name: "Microsoft", quantity: 30, avg_price: 420.0, avg_cost: 410.0, currency: "USD", sector: "科技", industry: "软件", market: "US",
      current_price: 445.80, total_value: 13374, fifty_two_week_low: 375.00, fifty_two_week_high: 460.00,
      dividend_yield: 0.80, latest_dividend: 0.75, strategy: "持有", tradingview: "https://www.tradingview.com/chart/?symbol=MSFT.US"
    },
    {
      symbol: "600325.SH", name: "华发股份", quantity: 2000, avg_price: 8.5, avg_cost: 8.2, currency: "CNY", sector: "地产", industry: "房地产开发", market: "SH",
      current_price: 9.15, total_value: 18300, fifty_two_week_low: 6.80, fifty_two_week_high: 11.50,
      dividend_yield: 5.80, latest_dividend: 0.48, strategy: "卖出", tradingview: "https://www.tradingview.com/chart/?symbol=600325.SH"
    },
    {
      symbol: "000333.SZ", name: "美的集团", quantity: 800, avg_price: 55.2, avg_cost: 53.8, currency: "CNY", sector: "消费", industry: "家电", market: "SZ",
      current_price: 58.60, total_value: 46880, fifty_two_week_low: 48.00, fifty_two_week_high: 68.00,
      dividend_yield: 3.80, latest_dividend: 1.80, strategy: "持有", tradingview: "https://www.tradingview.com/chart/?symbol=000333.SZ"
    },
  ];
  for (const s of seedStocks) {
    await kvSet(kv, KEYS.STOCKS + s.symbol, { ...s, created_at: ts, updated_at: ts });
  }

  // --- Transactions with full data matching widget specifications ---
  const seedTransactions = [
    { id: "tx-001", symbol: "600519.SH", name: "贵州茅台", type: "买入", transaction_type: "买入", quantity: 100, price: 1680.5, 
      date: "2026-01-15T09:30:00.000Z", notes: "Initial position", total: 168050, total_value: 168218.05, base_value: 168050, transaction_fee: 168.05 },
    { id: "tx-002", symbol: "000858.SZ", name: "五粮液", type: "买入", transaction_type: "买入", quantity: 500, price: 168.2, 
      date: "2026-01-20T10:15:00.000Z", notes: null, total: 84100, total_value: 84184.10, base_value: 84100, transaction_fee: 84.10 },
    { id: "tx-003", symbol: "601318.SH", name: "中国平安", type: "买入", transaction_type: "买入", quantity: 1000, price: 45.8, 
      date: "2026-02-01T14:00:00.000Z", notes: null, total: 45800, total_value: 45845.80, base_value: 45800, transaction_fee: 45.80 },
    { id: "tx-004", symbol: "300750.SZ", name: "宁德时代", type: "买入", transaction_type: "买入", quantity: 200, price: 215.6, 
      date: "2026-02-10T11:30:00.000Z", notes: null, total: 43120, total_value: 43163.12, base_value: 43120, transaction_fee: 43.12 },
    { id: "tx-005", symbol: "AAPL.US", name: "Apple Inc.", type: "买入", transaction_type: "买入", quantity: 50, price: 198.5, 
      date: "2026-03-01T09:45:00.000Z", notes: "Tech allocation", total: 9925, total_value: 9934.93, base_value: 9925, transaction_fee: 9.93 },
    { id: "tx-006", symbol: "MSFT.US", name: "Microsoft", type: "买入", transaction_type: "买入", quantity: 30, price: 420.0, 
      date: "2026-03-05T10:00:00.000Z", notes: null, total: 12600, total_value: 12612.60, base_value: 12600, transaction_fee: 12.60 },
    { id: "tx-007", symbol: "600325.SH", name: "华发股份", type: "买入", transaction_type: "买入", quantity: 2000, price: 8.5, 
      date: "2026-03-15T13:30:00.000Z", notes: "Dividend play", total: 17000, total_value: 17017.00, base_value: 17000, transaction_fee: 17.00 },
    { id: "tx-008", symbol: "000333.SZ", name: "美的集团", type: "买入", transaction_type: "买入", quantity: 800, price: 55.2, 
      date: "2026-03-20T14:45:00.000Z", notes: "Value investment", total: 44160, total_value: 44204.16, base_value: 44160, transaction_fee: 44.16 },
    { id: "tx-009", symbol: "000858.SZ", name: "五粮液", type: "卖出", transaction_type: "卖出", quantity: 200, price: 175.5, 
      date: "2026-04-01T10:20:00.000Z", notes: "Partial profit taking", total: 35100, total_value: 35064.90, base_value: 35100, transaction_fee: 35.10 },
    { id: "tx-010", symbol: "601318.SH", name: "中国平安", type: "买入", transaction_type: "买入", quantity: 500, price: 46.2, 
      date: "2026-04-10T11:00:00.000Z", notes: "Average down", total: 23100, total_value: 23123.10, base_value: 23100, transaction_fee: 23.10 },
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
      avg_cost: input.avg_cost ?? (input.avg_price ?? 0),
      currency: input.currency ?? "CNY",
      sector: input.sector ?? null,
      industry: input.industry ?? null,
      market: input.market ?? null,
      current_price: input.current_price ?? (input.avg_price ?? 0),
      total_value: input.current_price ? (input.current_price * (input.quantity ?? 1)) : null,
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
  const baseValue = Number((Number(input.quantity) * Number(input.price)).toFixed(4));
  const feeRate = 0.001;
  const transactionFee = Number((baseValue * feeRate).toFixed(4));
  const totalValue = Number((baseValue + transactionFee).toFixed(4));
  
  const record: TransactionResponse = {
    id,
    symbol: input.symbol,
    name: input.name ?? null,
    type: input.type,
    transaction_type: input.transaction_type ?? input.type,
    quantity: input.quantity,
    price: input.price,
    date: input.date ?? nowISO(),
    notes: input.notes ?? null,
    total: baseValue,
    total_value: input.total_value ?? totalValue,
    base_value: input.base_value ?? baseValue,
    transaction_fee: input.transaction_fee ?? transactionFee,
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
    const baseValue = Number((Number(patch.quantity) * Number(patch.price)).toFixed(4));
    next.base_value = baseValue;
    next.total = baseValue;
    next.transaction_fee = Number((baseValue * 0.001).toFixed(4));
    next.total_value = Number((baseValue + (baseValue * 0.001)).toFixed(4));
  } else if (patch.quantity != null) {
    const baseValue = Number((Number(patch.quantity) * Number(cur.price)).toFixed(4));
    next.base_value = baseValue;
    next.total = baseValue;
    next.transaction_fee = Number((baseValue * 0.001).toFixed(4));
    next.total_value = Number((baseValue + (baseValue * 0.001)).toFixed(4));
  } else if (patch.price != null) {
    const baseValue = Number((Number(cur.quantity) * Number(patch.price)).toFixed(4));
    next.base_value = baseValue;
    next.total = baseValue;
    next.transaction_fee = Number((baseValue * 0.001).toFixed(4));
    next.total_value = Number((baseValue + (baseValue * 0.001)).toFixed(4));
  }
  if (patch.transaction_type != null) {
    next.type = patch.transaction_type;
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
