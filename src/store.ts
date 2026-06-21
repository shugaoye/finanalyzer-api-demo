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
