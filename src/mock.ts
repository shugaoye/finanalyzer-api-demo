function seededRandom(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

// --- Historical price ---
export function generateHistorical(symbol: string, start_date?: string, end_date?: string, interval = "1d") {
  const rnd = seededRandom(symbol + (interval ?? ""));
  const today = new Date();
  const end = end_date ? new Date(end_date) : today;
  const start = start_date ? new Date(start_date) : new Date(end.getTime() - 30 * 86400000);

  const dates: string[] = [];
  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  if (dates.length === 0) dates.push(end.toISOString().slice(0, 10));

  const basePrice = 10 + rnd() * 490;
  let price = basePrice;
  const results = dates.map((d) => {
    const open = price;
    const change = (rnd() - 0.48) * price * 0.04;
    const close = Math.max(0.01, open + change);
    const high = Math.max(open, close) + rnd() * price * 0.01;
    const low = Math.min(open, close) - rnd() * price * 0.01;
    const volume = Math.floor(1000000 + rnd() * 50000000);
    price = close;
    return { date: d, open: +open.toFixed(2), high: +high.toFixed(2), low: +Math.max(0.01, low).toFixed(2), close: +close.toFixed(2), volume };
  });
  return {
    symbol,
    interval,
    start_date: dates[0],
    end_date: dates[dates.length - 1],
    count: results.length,
    results,
  };
}

// --- Screener ---
export function generateScreener(opts: { is_realized?: boolean; use_cache?: boolean; market?: string; strategy_rate?: number }) {
  const symbols = [
    { symbol: "600519.SH", name: "贵州茅台", sector: "消费", industry: "白酒" },
    { symbol: "000858.SZ", name: "五粮液", sector: "消费", industry: "白酒" },
    { symbol: "601318.SH", name: "中国平安", sector: "金融", industry: "保险" },
    { symbol: "000001.SZ", name: "平安银行", sector: "金融", industry: "银行" },
    { symbol: "600036.SH", name: "招商银行", sector: "金融", industry: "银行" },
    { symbol: "300750.SZ", name: "宁德时代", sector: "能源", industry: "电池" },
    { symbol: "002594.SZ", name: "比亚迪", sector: "能源", industry: "汽车" },
    { symbol: "600900.SH", name: "长江电力", sector: "公用事业", industry: "电力" },
    { symbol: "AAPL.US", name: "Apple Inc.", sector: "科技", industry: "消费电子" },
    { symbol: "MSFT.US", name: "Microsoft", sector: "科技", industry: "软件" },
  ];
  const filtered = opts.market
    ? symbols.filter((s) => s.symbol.endsWith("." + opts.market!.toUpperCase()) || (opts.market === "US" && s.symbol.endsWith(".US")))
    : symbols;
  const rnd = seededRandom("screener" + JSON.stringify(opts));
  const rate = opts.strategy_rate ?? 0.2;
  const results = filtered.map((s) => {
    const r = rnd();
    const buy = r < rate;
    return {
      ...s,
      price: +(50 + rnd() * 450).toFixed(2),
      change_pct: +((rnd() - 0.5) * 10).toFixed(2),
      signal: buy ? "BUY" : "HOLD",
      score: +rnd().toFixed(3),
    };
  });
  return {
    market: opts.market ?? "ALL",
    strategy_rate: rate,
    count: results.length,
    results,
  };
}

// --- Ticker information ---
export function generateTickerInfo(symbol?: string) {
  const rnd = seededRandom("ticker" + (symbol ?? "default"));
  const s = symbol ?? "600519.SH";
  const price = +(50 + rnd() * 950).toFixed(2);
  const prevClose = +(price / (1 + (rnd() - 0.5) * 0.05)).toFixed(2);
  return {
    symbol: s,
    name: s.includes(".SH") || s.includes(".SZ") ? "示例股票" : s.includes(".US") ? "Sample Stock" : symbol,
    price,
    open: +(prevClose * (1 + (rnd() - 0.5) * 0.02)).toFixed(2),
    high: +(price * (1 + rnd() * 0.02)).toFixed(2),
    low: +(price * (1 - rnd() * 0.02)).toFixed(2),
    prev_close: prevClose,
    volume: Math.floor(rnd() * 10000000),
    amount: +(rnd() * 1000000000).toFixed(2),
    change: +(price - prevClose).toFixed(2),
    change_pct: +(((price - prevClose) / prevClose) * 100).toFixed(2),
    market_cap: +(rnd() * 1000000000000).toFixed(0),
    pe_ratio: +(5 + rnd() * 50).toFixed(2),
    pb_ratio: +(0.5 + rnd() * 10).toFixed(2),
    currency: s.endsWith(".US") ? "USD" : "CNY",
    updated_at: new Date().toISOString(),
  };
}

// --- Portfolio symbols list ---
export function defaultSymbols(): string[] {
  return ["600519.SH", "000858.SZ", "601318.SH", "300750.SZ", "AAPL.US", "MSFT.US", "TSLA.US"];
}

// --- Key metrics ---
export function generateKeyMetrics(symbol: string) {
  const rnd = seededRandom("metrics" + symbol);
  return {
    symbol,
    pe_ratio: +(5 + rnd() * 50).toFixed(2),
    pb_ratio: +(0.5 + rnd() * 10).toFixed(2),
    ps_ratio: +(0.5 + rnd() * 15).toFixed(2),
    market_cap: Math.floor(rnd() * 1000000000000),
    revenue_growth_pct: +((rnd() - 0.3) * 30).toFixed(2),
    earnings_growth_pct: +((rnd() - 0.3) * 40).toFixed(2),
    dividend_yield_pct: +(rnd() * 8).toFixed(2),
    beta: +(0.5 + rnd() * 1.5).toFixed(2),
    volatility_30d: +(rnd() * 0.1).toFixed(4),
    max_drawdown_pct: +(-5 - rnd() * 40).toFixed(2),
    sharpe_ratio: +(rnd() * 2).toFixed(3),
    updated_at: new Date().toISOString(),
  };
}

// --- News ---
export function generateNews(symbol: string, limit = 5) {
  const rnd = seededRandom("news" + symbol);
  const templates = [
    `${symbol} 公告：三季度业绩同比增长`,
    `${symbol} 获得机构增持，市场情绪偏多`,
    `${symbol} 所属板块今日走强`,
    `${symbol} 行业动态：监管政策更新`,
    `${symbol} 研究报告：券商维持买入评级`,
    `${symbol} 新产品发布，分析师看好前景`,
    `${symbol} 大股东披露最新持仓变动`,
  ];
  const items: Array<{ id: string; symbol: string; title: string; summary: string; source: string; published_at: string; url: string }> = [];
  for (let i = 0; i < limit; i++) {
    const d = new Date(Date.now() - Math.floor(rnd() * 30) * 86400000);
    items.push({
      id: `${symbol}-${i}`,
      symbol,
      title: templates[i % templates.length],
      summary: "这是一条模拟生成的新闻摘要，用于演示接口返回内容。",
      source: ["DemoNews", "DemoWire", "DemoFeed"][Math.floor(rnd() * 3)],
      published_at: d.toISOString(),
      url: `https://example.com/news/${symbol}/${i}`,
    });
  }
  items.sort((a, b) => b.published_at.localeCompare(a.published_at));
  return { symbol, count: items.length, items };
}

// --- Validate ---
export function validatePortfolio(stocks: Array<{ symbol: string }>, transactions: Array<{ symbol: string }>) {
  const errors: { symbol: string; message: string }[] = [];
  const symbols = new Set(stocks.map((s) => s.symbol));
  transactions.forEach((t) => {
    if (!symbols.has(t.symbol)) {
      errors.push({ symbol: t.symbol, message: "Transaction references stock not in portfolio" });
    }
  });
  return {
    stocks_count: stocks.length,
    transactions_count: transactions.length,
    errors,
    valid: errors.length === 0,
  };
}

// --- Ticker search ---
export function tickerSearch(query?: string) {
  const pool = [
    { symbol: "600519.SH", name: "贵州茅台" },
    { symbol: "000858.SZ", name: "五粮液" },
    { symbol: "601318.SH", name: "中国平安" },
    { symbol: "000001.SZ", name: "平安银行" },
    { symbol: "600036.SH", name: "招商银行" },
    { symbol: "300750.SZ", name: "宁德时代" },
    { symbol: "002594.SZ", name: "比亚迪" },
    { symbol: "600900.SH", name: "长江电力" },
    { symbol: "AAPL.US", name: "Apple Inc." },
    { symbol: "MSFT.US", name: "Microsoft" },
    { symbol: "TSLA.US", name: "Tesla" },
    { symbol: "NVDA.US", name: "NVIDIA" },
    { symbol: "GOOGL.US", name: "Alphabet" },
    { symbol: "AMZN.US", name: "Amazon" },
  ];
  const q = (query ?? "").trim().toLowerCase();
  const list = q ? pool.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) : pool;
  return { query: query ?? "", count: list.length, results: list };
}

// --- Dashboard from template ---
export function buildDashboardFromTemplate(templateName: string) {
  const templates: Record<string, { name: string; description: string; widgets: any[]; tabs: any[] }> = {
    default: {
      name: "默认仪表盘",
      description: "包含概览、持仓、交易与行情等基础部件。",
      widgets: [
        { id: "w-overview", type: "overview", title: "投资概览", position: { x: 0, y: 0, w: 12, h: 4 }, data: {} },
        { id: "w-holdings", type: "holdings", title: "持仓概览", position: { x: 0, y: 4, w: 6, h: 6 }, data: {} },
        { id: "w-transactions", type: "transactions", title: "最近交易", position: { x: 6, y: 4, w: 6, h: 6 }, data: {} },
      ],
      tabs: [{ id: "tab-overview", name: "概览" }],
    },
    cn_market: {
      name: "A股市场仪表盘",
      description: "针对 A 股市场的行情与指标展示。",
      widgets: [
        { id: "w-cn-price", type: "line_chart", title: "价格走势", position: { x: 0, y: 0, w: 12, h: 5 }, data: {} },
        { id: "w-cn-screener", type: "table", title: "选股器", position: { x: 0, y: 5, w: 12, h: 6 }, data: {} },
      ],
      tabs: [{ id: "tab-market", name: "市场" }],
    },
    portfolio: {
      name: "组合分析仪表盘",
      description: "针对组合关键指标、新闻与业绩表现。",
      widgets: [
        { id: "w-metrics", type: "metrics", title: "关键指标", position: { x: 0, y: 0, w: 12, h: 4 }, data: {} },
        { id: "w-news", type: "news", title: "相关新闻", position: { x: 0, y: 4, w: 12, h: 6 }, data: {} },
      ],
      tabs: [{ id: "tab-analysis", name: "分析" }],
    },
  };
  return templates[templateName] ?? templates.default;
}
