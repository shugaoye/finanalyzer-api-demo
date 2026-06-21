export const appsJson = [
  {
    name: "持仓管理",
    img: "https://x0.ifengimg.com/ucms/2025_16/A25F85EA69929D10BE12190E20264C43657282E1_size230_w1013_h584.jpg",
    img_dark: "",
    img_light: "",
    description: "A股数据。",
    allowCustomization: true,
    tabs: {
      cn_holdings: {
        id: "cn_holdings",
        name: "持股",
        layout: [
          { i: "portfolio/stocks", x: 0, y: 2, w: 40, h: 14, groups: ["Group 1"] },
          { i: "portfolio/transactions", x: 0, y: 16, w: 40, h: 14, groups: ["Group 1"] }
        ]
      },
      cn_overview: {
        id: "cn_overview",
        name: "简况",
        layout: [
          { i: "portfolio/key_metrics", x: 0, y: 2, w: 13, h: 21, groups: ["Group 1"], state: { chartView: { enabled: false, chartType: "line" }, columnState: { default: { columnOrder: { orderedColIds: ["fact", "value"] } } } } },
          { i: "portfolio/news", x: 13, y: 2, w: 27, h: 21, groups: ["Group 1"], state: { params: { limit: "20" }, chartView: { enabled: false, chartType: "line" }, columnState: { default: { columnPinning: { leftColIds: ["date"], rightColIds: [] }, columnOrder: { orderedColIds: ["title", "author", "date", "sentiment", "url", "source"] } } } } }
        ]
      }
    },
    groups: [
      { name: "Group 1", type: "ticker", paramName: "symbol", defaultValue: "600325", widgetIds: ["portfolio/transactions", "portfolio/stocks", "portfolio/key_metrics", "portfolio/news"] }
    ]
  }
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
  "equity/screener": {
    name: "股价范围",
    description: "Get the current stock information.",
    category: "Equity",
    type: "html",
    widgetId: "equity/screener",
    endpoint: "/v1/cn/equity/screener",
    gridData: { w: 40, h: 30 },
    source: "A股",
    params: [
      { paramName: "is_realized", description: "Whether to include only realized transactions.", label: "包括已卖出交易", type: "boolean", value: false },
      { paramName: "use_cache", description: "Whether to use cache.", label: "使用缓存", type: "boolean", value: true },
      { paramName: "market", description: "Market to use.", value: "HK", label: "市场", type: "text", options: [{ value: "SH", label: "上海" }, { value: "SZ", label: "深圳" }, { value: "BJ", label: "北京" }, { value: "HK", label: "香港" }] },
      { paramName: "strategy_rate", description: "strategy rate", value: "0.05", label: "交易策略", type: "text", options: [{ value: "0.05", label: "5%" }, { value: "0.1", label: "10%" }, { value: "0.15", label: "15%" }, { value: "0.2", label: "20%" }, { value: "0.25", label: "25%" }] }
    ]
  },
  "equity/ticker_information": {
    name: "Ticker Information",
    description: "Information about a particular asset such as price, volume, industry, country, etc.",
    category: "Equity",
    type: "html",
    widgetId: "equity/ticker_information",
    endpoint: "/v1/cn/equity/ticker_information",
    gridData: { w: 20, h: 6, min_h: 5, max_h: 7 },
    source: "A股",
    params: [{ paramName: "symbol", type: "ticker", label: "Symbol", description: "The symbol of the asset, e.g. 600000.SH", value: "600000.SH" }]
  },
  "dashboard/list": {
    name: "Dashboard List",
    description: "List all dashboards",
    type: "table",
    category: "Dashboard",
    widgetId: "dashboard/list",
    endpoint: "/v1/dashboard",
    runButton: true,
    gridData: { w: 50, h: 20 },
    data: {
      dataKey: "",
      table: {
        showAll: true,
        enableAdvanced: true,
        columnsDefs: [
          { field: "id", headerName: "ID", headerTooltip: "Dashboard ID", cellDataType: "text", pinned: "left" },
          { field: "name", headerName: "Name", headerTooltip: "Dashboard name", cellDataType: "text" },
          { field: "description", headerName: "Description", headerTooltip: "Dashboard description", cellDataType: "text" },
          { field: "widgets", headerName: "Widgets", headerTooltip: "Number of widgets", cellDataType: "number", valueGetter: "params.data.widgets.length" },
          { field: "created_at", headerName: "Created At", headerTooltip: "Creation timestamp", cellDataType: "text" },
          { field: "updated_at", headerName: "Updated At", headerTooltip: "Update timestamp", cellDataType: "text" }
        ]
      }
    },
    source: ["Dashboard"],
    params: []
  },
  "portfolio/stocks": {
    name: "自选股",
    description: "Manage and view your portfolio stocks",
    type: "table",
    category: "Equity",
    widgetId: "portfolio/stocks",
    endpoint: "/v1/portfolio/stocks",
    runButton: true,
    gridData: { w: 50, h: 20 },
    data: {
      dataKey: "",
      table: {
        showAll: true,
        enableAdvanced: true,
        columnsDefs: [
          { field: "symbol", headerName: "股票代码", headerTooltip: "股票代码（例如：000001.SZ,600000.SH）", cellDataType: "text", pinned: "left", renderFn: "cellOnClick", renderFnParams: { actionType: "groupBy", groupByParamName: "symbol" } },
          { field: "name", headerName: "股票名称", headerTooltip: "股票名称", cellDataType: "text" },
          { field: "current_price", headerName: "当前价格", headerTooltip: "当前市场价格", cellDataType: "number" },
          { field: "avg_cost", headerName: "平均成本", headerTooltip: "平均成本", cellDataType: "number" },
          { field: "quantity", headerName: "持仓数量", headerTooltip: "持仓数量", cellDataType: "number" },
          { field: "total_value", headerName: "持仓总价值", headerTooltip: "持仓总价值", cellDataType: "number" },
          { field: "fifty_two_week_low", headerName: "52周最低价", headerTooltip: "52周最低价", cellDataType: "number" },
          { field: "fifty_two_week_high", headerName: "52周最高价", headerTooltip: "52周最高价", cellDataType: "number" },
          { field: "dividend_yield", headerName: "分红收益率", headerTooltip: "分红收益率", formatterFn: "percent", cellDataType: "number", renderFn: "columnColor", renderFnParams: { colorRules: [{ condition: "between", range: { min: 3, max: 5 }, color: "blue" }, { condition: "gt", value: 5, color: "green" }] } },
          { field: "latest_dividend", headerName: "最新分红金额", headerTooltip: "最新分红金额", cellDataType: "number" },
          { field: "strategy", headerName: "投资策略", headerTooltip: "投资策略", cellDataType: "text", renderFn: "columnColor", renderFnParams: { colorRules: [{ condition: "contains", value: "卖出", color: "green" }, { condition: "contains", value: "买入", color: "red" }] } },
          { field: "tradingview", headerName: "TradingView", headerTooltip: "TradingView chart link", cellDataType: "text" }
        ]
      }
    },
    source: ["Portfolio"],
    params: [
      { paramName: "symbol", description: "Filter by stock symbol", type: "ticker", value: "600325.SH", label: "股票代码", multiSelect: false, show: true },
      {
        paramName: "添加", description: "添加股票到组合", type: "form", endpoint: "/v1/portfolio/stocks", inputParams: [
          { paramName: "symbol", type: "text", value: "", label: "股票代码", description: "股票代码" },
          { paramName: "name", type: "text", value: "", label: "股票名称", description: "股票名称" },
          { paramName: "add_stock", type: "button", value: true, label: "添加", description: "Add a new stock to the portfolio" }
        ]
      },
      {
        paramName: "删除", description: "删除股票从组合", type: "form", endpoint: "/v1/portfolio/delete-stock", inputParams: [
          { paramName: "symbol", type: "text", value: "", label: "股票代码", description: "股票代码", validation: { required: true, pattern: "^\\d{6}\\.(SZ|SH|BJ)$|^\\d{4,5}\\.HK$", patternMessage: "股票代码格式无效，示例：000001.SZ、600000.SH、00700.HK" } },
          { paramName: "delete_stock", type: "button", value: true, label: "删除", description: "删除股票从组合" },
          { paramName: "cancel", type: "button", value: false, label: "取消", description: "取消删除操作" }
        ], successMessage: "股票删除成功，列表已刷新", errorMessages: { "404": "股票代码不存在于自选股中", "400": "股票代码格式无效", "500": "删除股票时发生错误，请稍后重试" }
      }
    ]
  },
  "portfolio/transactions": {
    name: "交易记录管理",
    description: "Manage and view your portfolio transactions",
    type: "table",
    category: "Equity",
    widgetId: "portfolio/transactions",
    endpoint: "/v1/portfolio/transactions",
    runButton: true,
    gridData: { w: 50, h: 20 },
    data: {
      dataKey: "",
      table: {
        showAll: true,
        enableAdvanced: true,
        columnsDefs: [
          { field: "id", pinned: "left", headerName: "ID", headerTooltip: "Transaction ID", cellDataType: "number" },
          { field: "date", headerName: "Date", headerTooltip: "Transaction date", cellDataType: "dateString" },
          { field: "symbol", headerName: "Symbol", headerTooltip: "Stock symbol code", cellDataType: "text" },
          { field: "name", headerName: "Name", headerTooltip: "Stock name", cellDataType: "text" },
          { field: "transaction_type", headerName: "Type", headerTooltip: "Transaction type (买入/卖出)", cellDataType: "text", renderFn: "columnColor", renderFnParams: { colorRules: [{ condition: "contains", value: "卖出", color: "green" }, { condition: "contains", value: "买入", color: "red" }] } },
          { field: "price", headerName: "Price", headerTooltip: "Transaction price per share", cellDataType: "number" },
          { field: "quantity", headerName: "Quantity", headerTooltip: "Number of shares traded", cellDataType: "number" },
          { field: "base_value", headerName: "Base Value", headerTooltip: "Base value (price × quantity)", cellDataType: "number" },
          { field: "transaction_fee", headerName: "Fee", headerTooltip: "Transaction fee", cellDataType: "number" },
          { field: "total_value", headerName: "Total Value", headerTooltip: "Total transaction value including fees", cellDataType: "number" },
          { field: "created_at", headerName: "Created At", headerTooltip: "Record creation time", cellDataType: "text" },
          { field: "updated_at", headerName: "Updated At", headerTooltip: "Record update time", cellDataType: "text" }
        ]
      }
    },
    source: ["Portfolio"],
    params: [
      { paramName: "symbol", description: "Filter by stock symbol", type: "ticker", value: "600325.SH", label: "Symbol", multiSelect: false, show: true },
      { paramName: "start_date", description: "Filter by start date", type: "text", value: "", label: "Start Date", optional: true },
      { paramName: "end_date", description: "Filter by end date", type: "text", value: "", label: "End Date", optional: true },
      {
        paramName: "添加", description: "添加交易记录", type: "form", endpoint: "/v1/portfolio/transactions", inputParams: [
          { paramName: "date", type: "text", value: "", label: "日期", description: "交易日期（例如：2024-01-01）" },
          { paramName: "symbol", type: "text", value: "", label: "股票代码", description: "股票代码（例如：000001.SZ, 600000.SH）" },
          { paramName: "name", type: "text", value: "", label: "股票名称", description: "股票名称" },
          { paramName: "price", type: "number", value: 0, label: "价格", description: "股票价格" },
          { paramName: "quantity", type: "number", value: 0, label: "数量", description: "股票数量" },
          { paramName: "total_value", type: "number", value: 0, label: "总价值", description: "总价值" },
          { paramName: "transaction_type", type: "text", value: "买入", label: "交易类型", description: "交易类型（买入/卖出）", options: [{ label: "买入", value: "买入" }, { label: "卖出", value: "卖出" }] },
          { paramName: "添加", type: "button", value: true, label: "添加", description: "添加交易记录" }
        ]
      }
    ]
  },
  "portfolio/key_metrics": {
    name: "基本信息",
    description: "Get key company information.",
    category: "Equity",
    type: "markdown",
    widgetId: "portfolio/key_metrics",
    endpoint: "/v1/portfolio/key_metrics",
    gridData: { w: 10, h: 12 },
    data: {
      table: {
        showAll: true,
        columns: [
          { field: "fact", headerName: "Fact", width: 200 },
          { field: "value", headerName: "Value", width: 200 }
        ]
      }
    },
    source: "A股",
    params: [{ paramName: "symbol", type: "ticker", label: "Symbol", value: "600325.SH", description: "Symbol to get company facts" }]
  },
  "portfolio/news": {
    name: "相关新闻",
    description: "Get recent news articles for stocks.",
    category: "Equity",
    type: "table",
    widgetId: "portfolio/news",
    endpoint: "/v1/portfolio/news",
    gridData: { w: 40, h: 8 },
    data: {
      table: {
        showAll: true,
        columnsDefs: [
          { field: "date", headerName: "Date", width: 180, cellDataType: "text", pinned: "left" },
          { field: "title", headerName: "Title", width: 300, cellDataType: "text" },
          { field: "source", headerName: "Source", width: 150, cellDataType: "text" },
          { field: "author", headerName: "Author", width: 150, cellDataType: "text" },
          { field: "sentiment", headerName: "Sentiment", width: 120, cellDataType: "text" },
          { field: "url", headerName: "URL", width: 200, cellDataType: "text" }
        ]
      }
    },
    source: "A股",
    params: [
      { paramName: "symbol", type: "ticker", label: "Symbol", value: "600325.SH", description: "Stock symbol to get news" },
      { type: "number", paramName: "limit", label: "Number of Articles", value: "10", description: "Maximum number of news articles to display" }
    ]
  }
};