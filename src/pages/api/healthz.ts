import { createNextApiHandler } from "@/server/vercel-adapter";
import { onRequestGet, onRequestOptions } from "../../../functions/api/healthz";

export default createNextApiHandler({
  GET: onRequestGet,
  OPTIONS: onRequestOptions,
});
