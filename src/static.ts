export const appsJson = {
  name: "finanalyzer-workspace",
  version: "1.5.12",
  apps: [
    {
      id: "portfolio",
      name: "组合管理",
      description: "管理投资组合、交易记录与持仓分析。",
      url: "/#/portfolio",
      icon: "wallet",
      default: true,
    },
    {
      id: "market",
      name: "市场行情",
      description: "股票历史价格、行情筛选器与标的信息。",
      url: "/#/market",
      icon: "trending-up",
    },
    {
      id: "dashboard",
      name: "仪表盘",
      description: "自定义仪表盘与可视化部件。",
      url: "/#/dashboard",
      icon: "layout",
    },
  ],
};

export const agentsJson = {
  version: "1.0.0",
  agents: [
    {
      id: "finanalyzer-copilot",
      name: "Finanalyzer Copilot",
      description: "负责处理金融查询、指标计算与组合分析的默认代理。",
      holder_url: "",
      features: { query: true, terminate: true, sessions: true },
    },
  ],
  tools: [
    { name: "historical_price", url: "/api/v1/cn/equity/price/historical", description: "获取历史价格" },
    { name: "screener", url: "/api/v1/cn/equity/screener", description: "选股器" },
    { name: "ticker_info", url: "/api/v1/cn/equity/ticker_information", description: "标的信息" },
    { name: "key_metrics", url: "/api/v1/portfolio/key_metrics", description: "关键指标" },
    { name: "news", url: "/api/v1/portfolio/news", description: "相关新闻" },
    { name: "ticker_search", url: "/api/v1/widgets/ticker_search", description: "标的搜索" },
  ],
};

export const widgetsJson = {
  version: "1.0.0",
  widgets: [
    {
      uuid: "w-historical-price",
      origin: "core",
      widget_id: "cn.equity.price.historical",
      name: "历史价格",
      description: "展示指定标的历史价格数据。",
      params: [
        { name: "symbol", type: "ticker", description: "标的代码", default_value: "600519.SH" },
        { name: "interval", type: "string", description: "数据间隔", default_value: "1d" },
      ],
    },
    {
      uuid: "w-screener",
      origin: "core",
      widget_id: "cn.equity.screener",
      name: "选股器",
      description: "基于策略筛选器返回股票列表。",
      params: [
        { name: "market", type: "string", description: "市场", default_value: "SH" },
        { name: "strategy_rate", type: "number", description: "策略率", default_value: 0.2 },
      ],
    },
    {
      uuid: "w-ticker-info",
      origin: "core",
      widget_id: "cn.equity.ticker_information",
      name: "标的信息",
      description: "展示标的基础信息与价格。",
      params: [{ name: "symbol", type: "ticker", description: "标的代码", default_value: "600519.SH" }],
    },
    {
      uuid: "w-key-metrics",
      origin: "core",
      widget_id: "portfolio.key_metrics",
      name: "关键指标",
      description: "返回标的关键财务与估值指标。",
      params: [{ name: "symbol", type: "ticker", description: "标的代码", default_value: "600519.SH" }],
    },
    {
      uuid: "w-news",
      origin: "core",
      widget_id: "portfolio.news",
      name: "相关新闻",
      description: "展示与标的相关的新闻列表。",
      params: [
        { name: "symbol", type: "ticker", description: "标的代码", default_value: "600519.SH" },
        { name: "limit", type: "number", description: "返回数量", default_value: 5 },
      ],
    },
    {
      uuid: "w-ticker-search",
      origin: "core",
      widget_id: "widgets.ticker_search",
      name: "标的搜索",
      description: "按关键字搜索标的。",
      params: [{ name: "query", type: "text", description: "查询关键字", default_value: "" }],
    },
  ],
};
