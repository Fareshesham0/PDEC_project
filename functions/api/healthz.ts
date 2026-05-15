import { json, options } from "../_lib/http";
import type { ApiHandler } from "../_lib/types";

export const onRequestOptions = () => options();

export const onRequestGet: ApiHandler = async () => json({ status: "ok" });
