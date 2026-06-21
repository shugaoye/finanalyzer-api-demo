export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface StockResponse {
  symbol: string;
  name?: string | null;
  quantity?: number | null;
  avg_price?: number | null;
  avg_cost?: number | null;
  currency?: string | null;
  sector?: string | null;
  industry?: string | null;
  market?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  current_price?: number | null;
  total_value?: number | null;
  fifty_two_week_low?: number | null;
  fifty_two_week_high?: number | null;
  dividend_yield?: number | null;
  latest_dividend?: number | null;
  strategy?: string | null;
  tradingview?: string | null;
  [key: string]: JsonValue | undefined;
}

export interface StockCreate {
  symbol: string;
  name?: string | null;
  quantity?: number | null;
  avg_price?: number | null;
  avg_cost?: number | null;
  currency?: string | null;
  sector?: string | null;
  industry?: string | null;
  market?: string | null;
  current_price?: number | null;
  [key: string]: JsonValue | undefined;
}

export interface StockUpdate {
  name?: string | null;
  quantity?: number | null;
  avg_price?: number | null;
  avg_cost?: number | null;
  currency?: string | null;
  sector?: string | null;
  industry?: string | null;
  market?: string | null;
  [key: string]: JsonValue | undefined;
}

export interface StockDeleteRequest {
  symbol: string;
}

export interface StockDeleteResponse {
  success: boolean;
  symbol: string;
  message?: string | null;
}

export interface TransactionResponse {
  id: string;
  symbol: string;
  name?: string | null;
  type: "buy" | "sell" | string;
  transaction_type?: string | null;
  quantity: number;
  price: number;
  date?: string | null;
  notes?: string | null;
  total?: number | null;
  total_value?: number | null;
  base_value?: number | null;
  transaction_fee?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: JsonValue | undefined;
}

export interface TransactionCreate {
  symbol: string;
  name?: string | null;
  type: "buy" | "sell" | string;
  transaction_type?: string | null;
  quantity: number;
  price: number;
  date?: string | null;
  notes?: string | null;
  total_value?: number | null;
  base_value?: number | null;
  transaction_fee?: number | null;
  [key: string]: JsonValue | undefined;
}

export interface TransactionUpdate {
  symbol?: string | null;
  name?: string | null;
  type?: string | null;
  transaction_type?: string | null;
  quantity?: number | null;
  price?: number | null;
  date?: string | null;
  notes?: string | null;
  [key: string]: JsonValue | undefined;
}

export interface WidgetBase {
  id: string;
  type: string;
  title: string;
  position: { [key: string]: JsonValue };
  data?: { [key: string]: JsonValue } | null;
}

export type WidgetCreate = WidgetBase;
export type WidgetResponse = WidgetBase;

export interface WidgetUpdate {
  title?: string | null;
  position?: { [key: string]: JsonValue } | null;
  data?: { [key: string]: JsonValue } | null;
}

export interface TabBase {
  id: string;
  name: string;
  icon?: string | null;
}

export interface WidgetInfo {
  widget_uuid: string;
  name: string;
}

export interface TabInfo {
  tab_id?: string;
  widgets?: WidgetInfo[] | null;
}

export interface DashboardInfo {
  id: string;
  name: string;
  current_tab_id: string;
  tabs?: TabInfo[] | null;
}

export interface DashboardCreate {
  name: string;
  description?: string | null;
  widgets?: WidgetBase[] | null;
  tabs?: TabBase[] | null;
  groups?: Array<{ [key: string]: JsonValue }> | null;
}

export interface DashboardResponse {
  id: string;
  name: string;
  description?: string | null;
  widgets?: WidgetBase[] | null;
  tabs?: TabBase[] | null;
  groups?: Array<{ [key: string]: JsonValue }> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DashboardUpdate {
  name?: string | null;
  description?: string | null;
  widgets?: WidgetBase[] | null;
  tabs?: TabBase[] | null;
  groups?: Array<{ [key: string]: JsonValue }> | null;
}

export interface QueryRequest {
  query: string;
  session_id?: string | null;
  stream?: boolean | null;
  user_api_keys?: { openai_api_key?: string | null } | null;
  [key: string]: JsonValue | undefined;
}

export interface ValidationErrorItem {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: JsonValue;
  ctx?: { [key: string]: JsonValue };
}

export interface HTTPValidationError {
  detail: ValidationErrorItem[];
}

export interface SessionInfo {
  id: string;
  title?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider?: string | null;
  description?: string | null;
}
