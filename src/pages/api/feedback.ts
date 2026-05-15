import { createNextApiHandler } from "@/server/vercel-adapter";
import { onRequestOptions, onRequestPost } from "../../../functions/api/feedback";

export default createNextApiHandler({
  POST: onRequestPost,
  OPTIONS: onRequestOptions,
});
