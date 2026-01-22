import { env } from "../config/env.config.ts";
import { createClient } from "./index.ts";

const baseUrl = env.API_BASE_URL;

const client = createClient({ baseUrl });
