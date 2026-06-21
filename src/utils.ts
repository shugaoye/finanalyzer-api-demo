import type { HTTPValidationError, ValidationErrorItem } from "./types";

export function json(data: unknown, status = 200, headersInit?: HeadersInit): Response {
  const headers = new Headers(headersInit);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

export function noContent(status = 204): Response {
  return new Response(null, { status });
}

export function notFound(message = "Not Found"): Response {
  return json({ error: message }, 404);
}

export function badRequest(message = "Bad Request", detail?: any): Response {
  return json({ error: message, detail: detail ?? undefined }, 400);
}

export function validationError(errors: ValidationErrorItem[]): Response {
  const body: HTTPValidationError = { detail: errors };
  return json(body, 422);
}

export function requireBody<T>(body: any, required: (keyof T)[]): Response | null {
  const missing = required.filter((k) => !(k in (body ?? {})));
  if (missing.length > 0) {
    return validationError(
      missing.map((k) => ({ loc: ["body", String(k)], msg: "Field required", type: "missing" }))
    );
  }
  return null;
}

export async function readJSON(req: Request): Promise<any> {
  if (!req.body || req.headers.get("content-type")?.includes("application/json") === false) {
    try {
      return await req.json();
    } catch {
      return {};
    }
  }
  try {
    return await req.json();
  } catch {
    return {};
  }
}
