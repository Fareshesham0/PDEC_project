export interface KvNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: "json"): Promise<unknown | null>;
  get(key: string, type?: "json" | "text"): Promise<unknown | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

export interface Env {
  PDEC_KV: KvNamespace;
  XPOSEDORNOT_API_KEY?: string;
  HIBP_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

export interface ApiContext {
  request: Request;
  env: Env;
}

export type ApiHandler = (ctx: ApiContext) => Promise<Response> | Response;
