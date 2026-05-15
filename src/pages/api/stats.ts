import { createNextApiHandler } from "@/server/vercel-adapter";
import { onRequestGet, onRequestOptions } from "../../../functions/api/stats";

export default createNextApiHandler({
  GET: onRequestGet,
  OPTIONS: onRequestOptions,
});
