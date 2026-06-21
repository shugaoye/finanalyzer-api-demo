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
    { symbol: "000333.SZ", name: "美的集团", sector: "消费", industry: "家电" },
    { symbol: "601899.SH", name: "紫金矿业", sector: "材料", industry: "矿业" },
    { symbol: "000651.SZ", name: "格力电器", sector: "消费", industry: "家电" },
    { symbol: "600030.SH", name: "中信证券", sector: "金融", industry: "证券" },
    { symbol: "601628.SH", name: "中国人寿", sector: "金融", industry: "保险" },
  ];
  const filtered = opts.market
    ? symbols.filter((s) => s.symbol.endsWith("." + opts.market!.toUpperCase()) || (opts.market === "US" && s.symbol.endsWith(".US")))
    : symbols;
  const rnd = seededRandom("screener" + JSON.stringify(opts));
  const rate = opts.strategy_rate ?? 0.2;
  const results = filtered.map((s) => {
    const r = rnd();
    const buy = r < rate;
    const price = +(50 + rnd() * 450).toFixed(2);
    return {
      ...s,
      price,
      change_pct: +((rnd() - 0.5) * 10).toFixed(2),
      signal: buy ? "BUY" : "HOLD",
      score: +rnd().toFixed(3),
      volume: Math.floor(rnd() * 100000000),
      market_cap: Math.floor(rnd() * 100000000000),
      pe_ratio: +(10 + rnd() * 40).toFixed(2),
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
  return ["600519.SH", "000858.SZ", "601318.SH", "300750.SZ", "AAPL.US", "MSFT.US", "TSLA.US", "600325.SH"];
}

// --- Stock data for portfolio/stocks widget ---
export function generateStockData(symbol: string) {
  const rnd = seededRandom("stockdata-" + symbol);
  const basePrice = 10 + rnd() * 490;
  const currentPrice = +(basePrice * (0.95 + rnd() * 0.1)).toFixed(2);
  const avgCost = +(basePrice * (0.9 + rnd() * 0.2)).toFixed(2);
  const quantity = Math.floor(100 + rnd() * 9900);
  const dividendYield = +(rnd() * 8).toFixed(2);
  
  return {
    symbol,
    name: getStockName(symbol),
    current_price: currentPrice,
    avg_cost: avgCost,
    quantity,
    total_value: +(currentPrice * quantity).toFixed(2),
    fifty_two_week_low: +(currentPrice * (0.7 + rnd() * 0.15)).toFixed(2),
    fifty_two_week_high: +(currentPrice * (1.2 + rnd() * 0.2)).toFixed(2),
    dividend_yield: dividendYield,
    latest_dividend: +(rnd() * 10).toFixed(2),
    strategy: rnd() > 0.5 ? "持有" : rnd() > 0.5 ? "买入" : "卖出",
    tradingview: `https://www.tradingview.com/chart/?symbol=${symbol}`,
  };
}

function getStockName(symbol: string): string {
  const nameMap: Record<string, string> = {
    "600519.SH": "贵州茅台",
    "000858.SZ": "五粮液",
    "601318.SH": "中国平安",
    "000001.SZ": "平安银行",
    "600036.SH": "招商银行",
    "300750.SZ": "宁德时代",
    "002594.SZ": "比亚迪",
    "600900.SH": "长江电力",
    "AAPL.US": "Apple Inc.",
    "MSFT.US": "Microsoft",
    "TSLA.US": "Tesla",
    "NVDA.US": "NVIDIA",
    "600325.SH": "华发股份",
    "000333.SZ": "美的集团",
    "601899.SH": "紫金矿业",
    "000651.SZ": "格力电器",
    "600030.SH": "中信证券",
    "601628.SH": "中国人寿",
  };
  return nameMap[symbol] || `Stock ${symbol}`;
}

// --- Key metrics ---
export function generateKeyMetrics(symbol: string) {
  const rnd = seededRandom("metrics" + symbol);
  const metrics = [
    { fact: "股票代码", value: symbol },
    { fact: "股票名称", value: getStockName(symbol) },
    { fact: "市盈率(PE)", value: +(5 + rnd() * 50).toFixed(2) + "倍" },
    { fact: "市净率(PB)", value: +(0.5 + rnd() * 10).toFixed(2) + "倍" },
    { fact: "市销率(PS)", value: +(0.5 + rnd() * 15).toFixed(2) + "倍" },
    { fact: "总市值", value: formatMarketCap(Math.floor(rnd() * 1000000000000)) },
    { fact: "营收增长率", value: +((rnd() - 0.3) * 30).toFixed(2) + "%" },
    { fact: "净利润增长率", value: +((rnd() - 0.3) * 40).toFixed(2) + "%" },
    { fact: "分红收益率", value: +(rnd() * 8).toFixed(2) + "%" },
    { fact: "Beta系数", value: +(0.5 + rnd() * 1.5).toFixed(2) },
    { fact: "30日波动率", value: +(rnd() * 0.1).toFixed(4) },
    { fact: "最大回撤", value: +(-5 - rnd() * 40).toFixed(2) + "%" },
    { fact: "夏普比率", value: +(rnd() * 2).toFixed(3) },
  ];
  return { symbol, metrics, updated_at: new Date().toISOString() };
}

function formatMarketCap(value: number): string {
  if (value >= 1000000000000) return (value / 1000000000000).toFixed(2) + " 万亿";
  if (value >= 100000000) return (value / 100000000).toFixed(2) + " 亿";
  if (value >= 10000) return (value / 10000).toFixed(2) + " 万";
  return value.toString();
}

// --- News ---
export function generateNews(symbol: string, limit = 5) {
  const rnd = seededRandom("news" + symbol);
  const templates = [
    `${getStockName(symbol)} 公告：三季度业绩同比增长超预期`,
    `${getStockName(symbol)} 获得机构增持，市场情绪偏多`,
    `${getStockName(symbol)} 所属板块今日走强，领涨两市`,
    `${getStockName(symbol)} 行业动态：监管政策更新解读`,
    `${getStockName(symbol)} 研究报告：券商维持买入评级`,
    `${getStockName(symbol)} 新产品发布，分析师看好前景`,
    `${getStockName(symbol)} 大股东披露最新持仓变动`,
    `${getStockName(symbol)} 股权激励计划落地，提振市场信心`,
    `${getStockName(symbol)} 与战略伙伴签署合作协议`,
    `${getStockName(symbol)} 回购股份计划进展顺利`,
  ];
  const sources = ["证券时报", "上海证券报", "证券日报", "中国证券报", "第一财经", "Wind资讯", "东方财富"];
  const authors = ["财经记者小王", "行业分析师老李", "市场研究员小张", "投资顾问陈先生", "资深分析师阿强"];
  const sentiments = ["positive", "negative", "neutral"];
  
  const items: Array<{ id: string; symbol: string; date: string; title: string; source: string; author: string; sentiment: string; url: string }> = [];
  for (let i = 0; i < limit; i++) {
    const d = new Date(Date.now() - Math.floor(rnd() * 30) * 86400000);
    items.push({
      id: `${symbol}-${i}`,
      symbol,
      date: d.toISOString(),
      title: templates[i % templates.length],
      source: sources[Math.floor(rnd() * sources.length)],
      author: authors[Math.floor(rnd() * authors.length)],
      sentiment: sentiments[Math.floor(rnd() * sentiments.length)],
      url: `https://example.com/news/${symbol}/${i}`,
    });
  }
  items.sort((a, b) => b.date.localeCompare(a.date));
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
    { symbol: "600519.SH", name: "贵州茅台", exchange: "SH", type: "stock" },
    { symbol: "000858.SZ", name: "五粮液", exchange: "SZ", type: "stock" },
    { symbol: "601318.SH", name: "中国平安", exchange: "SH", type: "stock" },
    { symbol: "000001.SZ", name: "平安银行", exchange: "SZ", type: "stock" },
    { symbol: "600036.SH", name: "招商银行", exchange: "SH", type: "stock" },
    { symbol: "300750.SZ", name: "宁德时代", exchange: "SZ", type: "stock" },
    { symbol: "002594.SZ", name: "比亚迪", exchange: "SZ", type: "stock" },
    { symbol: "600900.SH", name: "长江电力", exchange: "SH", type: "stock" },
    { symbol: "AAPL.US", name: "Apple Inc.", exchange: "US", type: "stock" },
    { symbol: "MSFT.US", name: "Microsoft", exchange: "US", type: "stock" },
    { symbol: "TSLA.US", name: "Tesla", exchange: "US", type: "stock" },
    { symbol: "NVDA.US", name: "NVIDIA", exchange: "US", type: "stock" },
    { symbol: "GOOGL.US", name: "Alphabet", exchange: "US", type: "stock" },
    { symbol: "AMZN.US", name: "Amazon", exchange: "US", type: "stock" },
    { symbol: "600325.SH", name: "华发股份", exchange: "SH", type: "stock" },
    { symbol: "000333.SZ", name: "美的集团", exchange: "SZ", type: "stock" },
    { symbol: "601899.SH", name: "紫金矿业", exchange: "SH", type: "stock" },
    { symbol: "000651.SZ", name: "格力电器", exchange: "SZ", type: "stock" },
  ];
  const q = (query ?? "").trim().toLowerCase();
  const list = q ? pool.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) : pool;
  return { query: query ?? "", count: list.length, results: list };
}

// --- Dashboard from template ---
export function buildDashboardFromTemplate(templateName: string) {
  // Map app IDs/tabs to dashboard templates
  const templateMap: Record<string, { name: string; description: string; widgets: any[]; tabs: any[] }> = {
    // Default template
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
    // cn_market template
    cn_market: {
      name: "A股市场仪表盘",
      description: "针对 A 股市场的行情与指标展示。",
      widgets: [
        { id: "w-cn-price", type: "line_chart", title: "价格走势", position: { x: 0, y: 0, w: 12, h: 5 }, data: {} },
        { id: "w-cn-screener", type: "table", title: "选股器", position: { x: 0, y: 5, w: 12, h: 6 }, data: {} },
      ],
      tabs: [{ id: "tab-market", name: "市场" }],
    },
    // portfolio template
    portfolio: {
      name: "组合分析仪表盘",
      description: "针对组合关键指标、新闻与业绩表现。",
      widgets: [
        { id: "w-metrics", type: "metrics", title: "关键指标", position: { x: 0, y: 0, w: 12, h: 4 }, data: {} },
        { id: "w-news", type: "news", title: "相关新闻", position: { x: 0, y: 4, w: 12, h: 6 }, data: {} },
      ],
      tabs: [{ id: "tab-analysis", name: "分析" }],
    },
    // Holdings management app (持仓管理) - cn_holdings tab
    cn_holdings: {
      name: "持仓管理",
      description: "A股持仓管理与交易记录。",
      widgets: [
        { id: "portfolio/stocks", type: "table", title: "持股列表", position: { x: 0, y: 2, w: 40, h: 14 }, data: { groups: ["Group 1"] } },
        { id: "portfolio/transactions", type: "table", title: "交易记录", position: { x: 0, y: 16, w: 40, h: 14 }, data: { groups: ["Group 1"] } },
      ],
      tabs: [{ id: "cn_holdings", name: "持股" }],
    },
    // Holdings management app - cn_overview tab
    cn_overview: {
      name: "持仓概况",
      description: "持仓关键指标与新闻概览。",
      widgets: [
        { id: "portfolio/key_metrics", type: "metrics", title: "关键指标", position: { x: 0, y: 2, w: 13, h: 21 }, data: { groups: ["Group 1"] } },
        { id: "portfolio/news", type: "news", title: "相关新闻", position: { x: 13, y: 2, w: 27, h: 21 }, data: { groups: ["Group 1"] } },
      ],
      tabs: [{ id: "cn_overview", name: "简况" }],
    },
    // Equity screener template
    "equity/screener": {
      name: "股价筛选器",
      description: "根据条件筛选股票。",
      widgets: [
        { id: "equity/screener", type: "screener", title: "股票筛选", position: { x: 0, y: 0, w: 40, h: 30 }, data: {} },
      ],
      tabs: [{ id: "main", name: "筛选" }],
    },
    // Holdings management app name
    "持仓管理": {
      name: "持仓管理",
      description: "A股数据。",
      widgets: [
        { id: "portfolio/stocks", type: "table", title: "持股列表", position: { x: 0, y: 2, w: 40, h: 14 }, data: { groups: ["Group 1"] } },
        { id: "portfolio/transactions", type: "table", title: "交易记录", position: { x: 0, y: 16, w: 40, h: 14 }, data: { groups: ["Group 1"] } },
        { id: "portfolio/key_metrics", type: "metrics", title: "关键指标", position: { x: 0, y: 2, w: 13, h: 21 }, data: { groups: ["Group 1"] } },
        { id: "portfolio/news", type: "news", title: "相关新闻", position: { x: 13, y: 2, w: 27, h: 21 }, data: { groups: ["Group 1"] } },
      ],
      tabs: [
        { id: "cn_holdings", name: "持股" },
        { id: "cn_overview", name: "简况" },
      ],
    },
  };

  // Try exact match first, then try URL-decoded version, then default
  return templateMap[templateName] ?? templateMap[decodeURIComponent(templateName)] ?? templateMap["default"];
}
