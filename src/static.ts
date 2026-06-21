export const appsJson = [
  {
    name: "Portfolio",
    description: "Manage investment portfolio, transactions, and position analysis.",
    img: "",
    allowCustomization: true,
    selected_agent: "finanalyzer-copilot",
    tabs: [
      {
        id: "portfolio-main",
        name: "Portfolio",
        layout: [],
      },
    ],
    groups: [],
    prompts: [
      "Show my portfolio summary",
      "What are my top holdings by value?",
      "Display recent transactions",
    ],
    mcp_servers: [],
  },
  {
    name: "Market",
    description: "Stock historical prices, market screener, and ticker information.",
    img: "",
    allowCustomization: true,
    selected_agent: "finanalyzer-copilot",
    tabs: [
      {
        id: "market-main",
        name: "Market",
        layout: [],
      },
    ],
    groups: [],
    prompts: [
      "Show historical price for AAPL",
      "Screen Chinese tech stocks",
      "Get ticker info for 600519.SH",
    ],
    mcp_servers: [],
  },
  {
    name: "Dashboard",
    description: "Custom dashboards with customizable widgets and visualizations.",
    img: "",
    allowCustomization: true,
    selected_agent: "finanalyzer-copilot",
    tabs: [
      {
        id: "dashboard-main",
        name: "Dashboard",
        layout: [],
      },
    ],
    groups: [],
    prompts: [
      "Create a new dashboard",
      "Show my existing dashboards",
      "Add a chart widget to dashboard",
    ],
    mcp_servers: [],
  },
];

export const agentsJson = {
  version: "1.0.0",
  agents: [
    {
      id: "finanalyzer-copilot",
      name: "Finanalyzer Copilot",
      description: "AI agent for financial queries, metrics calculation, and portfolio analysis.",
      features: { query: true, terminate: true, sessions: true },
    },
  ],
  tools: [
    { name: "historical_price", url: "/api/v1/cn/equity/price/historical", description: "Get historical prices" },
    { name: "screener", url: "/api/v1/cn/equity/screener", description: "Stock screener" },
    { name: "ticker_info", url: "/api/v1/cn/equity/ticker_information", description: "Ticker information" },
    { name: "key_metrics", url: "/api/v1/portfolio/key_metrics", description: "Key metrics" },
    { name: "news", url: "/api/v1/portfolio/news", description: "Related news" },
    { name: "ticker_search", url: "/api/v1/widgets/ticker_search", description: "Ticker search" },
  ],
};

export const widgetsJson: Record<string, object> = {
  "w-historical-price": {
    name: "Historical Price",
    description: "Display historical price data for a given symbol.",
    category: "Equity",
    subCategory: "Price",
    endpoint: "/api/v1/cn/equity/price/historical",
    type: "chart",
    gridData: { w: 20, h: 8, minW: 10, minH: 6 },
    params: [
      {
        paramName: "symbol",
        value: "600519.SH",
        label: "Symbol",
        type: "text",
        description: "Ticker symbol, e.g., 600519.SH",
      },
      {
        paramName: "interval",
        value: "1d",
        label: "Interval",
        type: "text",
        description: "Data interval: 1d, 1w, 1m",
      },
      {
        paramName: "start_date",
        value: "",
        label: "Start Date",
        type: "date",
        description: "Start date (YYYY-MM-DD)",
      },
      {
        paramName: "end_date",
        value: "",
        label: "End Date",
        type: "date",
        description: "End date (YYYY-MM-DD)",
      },
    ],
    data: {
      chart: { type: "line" },
    },
  },
  "w-screener": {
    name: "Stock Screener",
    description: "Screen stocks based on strategy filters.",
    category: "Equity",
    subCategory: "Screener",
    endpoint: "/api/v1/cn/equity/screener",
    type: "table",
    gridData: { w: 20, h: 10, minW: 10, minH: 6 },
    params: [
      {
        paramName: "market",
        value: "SH",
        label: "Market",
        type: "text",
        description: "Market: SH, SZ, or all",
      },
      {
        paramName: "is_realized",
        value: "false",
        label: "Realized Only",
        type: "text",
        description: "Filter by realized stocks",
      },
      {
        paramName: "strategy_rate",
        value: "0.2",
        label: "Strategy Rate",
        type: "number",
        description: "Strategy rate threshold",
      },
    ],
    data: {
      table: {
        index: "symbol",
        showAll: false,
        columnsDefs: [
          { headerName: "Symbol", field: "symbol", chartDataType: "category" },
          { headerName: "Name", field: "name", chartDataType: "category" },
          { headerName: "Price", field: "price", chartDataType: "series" },
          { headerName: "Change", field: "change", chartDataType: "series" },
        ],
      },
    },
  },
  "w-ticker-info": {
    name: "Ticker Information",
    description: "Display basic information and price for a ticker.",
    category: "Equity",
    subCategory: "Info",
    endpoint: "/api/v1/cn/equity/ticker_information",
    type: "table",
    gridData: { w: 12, h: 6, minW: 8, minH: 4 },
    params: [
      {
        paramName: "symbol",
        value: "600519.SH",
        label: "Symbol",
        type: "text",
        description: "Ticker symbol",
      },
    ],
    data: {
      table: {
        index: "symbol",
        showAll: true,
        columnsDefs: [
          { headerName: "Symbol", field: "symbol", chartDataType: "category" },
          { headerName: "Name", field: "name", chartDataType: "category" },
          { headerName: "Price", field: "price", chartDataType: "series" },
          { headerName: "Market Cap", field: "market_cap", chartDataType: "series" },
        ],
      },
    },
  },
  "w-key-metrics": {
    name: "Key Metrics",
    description: "Return key financial and valuation metrics for a symbol.",
    category: "Equity",
    subCategory: "Fundamental",
    endpoint: "/api/v1/portfolio/key_metrics",
    type: "table",
    gridData: { w: 16, h: 8, minW: 10, minH: 6 },
    params: [
      {
        paramName: "symbol",
        value: "600519.SH",
        label: "Symbol",
        type: "text",
        description: "Ticker symbol",
      },
    ],
    data: {
      table: {
        index: "metric",
        showAll: true,
        columnsDefs: [
          { headerName: "Metric", field: "metric", chartDataType: "category" },
          { headerName: "Value", field: "value", chartDataType: "series" },
        ],
      },
    },
  },
  "w-news": {
    name: "News",
    description: "Display news related to a symbol.",
    category: "Equity",
    subCategory: "News",
    endpoint: "/api/v1/portfolio/news",
    type: "table",
    gridData: { w: 20, h: 8, minW: 10, minH: 6 },
    params: [
      {
        paramName: "symbol",
        value: "600519.SH",
        label: "Symbol",
        type: "text",
        description: "Ticker symbol",
      },
      {
        paramName: "limit",
        value: "5",
        label: "Limit",
        type: "number",
        description: "Number of news items",
      },
    ],
    data: {
      table: {
        index: "title",
        showAll: true,
        columnsDefs: [
          { headerName: "Title", field: "title", chartDataType: "category" },
          { headerName: "Date", field: "date", chartDataType: "category" },
          { headerName: "Source", field: "source", chartDataType: "category" },
        ],
      },
    },
  },
  "w-ticker-search": {
    name: "Ticker Search",
    description: "Search for symbols by keyword.",
    category: "Equity",
    subCategory: "Search",
    endpoint: "/api/v1/widgets/ticker_search",
    type: "table",
    gridData: { w: 16, h: 8, minW: 10, minH: 6 },
    params: [
      {
        paramName: "query",
        value: "",
        label: "Query",
        type: "text",
        description: "Search keyword",
      },
    ],
    data: {
      table: {
        index: "symbol",
        showAll: true,
        columnsDefs: [
          { headerName: "Symbol", field: "symbol", chartDataType: "category" },
          { headerName: "Name", field: "name", chartDataType: "category" },
          { headerName: "Exchange", field: "exchange", chartDataType: "category" },
          { headerName: "Type", field: "type", chartDataType: "category" },
        ],
      },
    },
  },
};
