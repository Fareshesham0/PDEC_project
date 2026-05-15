import type { NextApiRequest, NextApiResponse } from "next";
import type { Env } from "../../functions/_lib/types";

declare const process: { env: Record<string, string | undefined> };

type ApiHandler = (ctx: { request: Request; env: Env }) => Promise<Response> | Response;

type StoredValue = {
  value: string;
  expiresAt: number | null;
};

const store = new Map<string, StoredValue>();

function isExpired(entry: StoredValue): boolean {
  return entry.expiresAt !== null && entry.expiresAt <= Date.now();
}

const memoryKv = {
  async get(key: string, type?: "json" | "text"): Promise<unknown | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
      store.delete(key);
      return null;
    }
    if (type === "json") return JSON.parse(entry.value);
    return entry.value;
  },
  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    const expiresAt = options?.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : null;
    store.set(key, { value, expiresAt });
  },
};

function createEnv(): Env {
  return {
    PDEC_KV: memoryKv as unknown as Env["PDEC_KV"],
    XPOSEDORNOT_API_KEY: process.env.XPOSEDORNOT_API_KEY,
    HIBP_API_KEY: process.env.HIBP_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  };
}

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(",") : value;
}

function toRequest(req: NextApiRequest): Request {
  const protocol = normalizeHeaderValue(req.headers["x-forwarded-proto"]) ?? "http";
  const host =
    normalizeHeaderValue(req.headers["x-forwarded-host"]) ??
    normalizeHeaderValue(req.headers.host) ??
    "localhost";
  const url = `${protocol}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    const normalized = normalizeHeaderValue(value);
    if (normalized) headers.set(key, normalized);
  }

  const method = (req.method ?? "GET").toUpperCase();
  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      body = req.body as BodyInit;
    } else if (req.body !== undefined) {
      body = JSON.stringify(req.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  return new Request(url, {
    method,
    headers,
    body,
  });
}

async function sendResponse(res: NextApiResponse, response: Response): Promise<void> {
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  res.status(response.status).send(buffer);
}

export function createNextApiHandler(handlers: {
  GET?: ApiHandler;
  POST?: ApiHandler;
  OPTIONS?: ApiHandler;
}) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const method = (req.method ?? "GET").toUpperCase();
    const handlerForMethod = handlers[method as "GET" | "POST" | "OPTIONS"];
    if (!handlerForMethod) {
      res.setHeader("allow", "GET,POST,OPTIONS");
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const request = toRequest(req);
    const response = await handlerForMethod({ request, env: createEnv() });
    await sendResponse(res, response);
  };
}
