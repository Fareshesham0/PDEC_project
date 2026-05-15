import { createNextApiHandler } from "@/server/vercel-adapter";
import { onRequestOptions, onRequestPost } from "../../../functions/api/check";

export default createNextApiHandler({
  POST: onRequestPost,
  OPTIONS: onRequestOptions,
});
