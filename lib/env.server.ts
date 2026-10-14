import { z } from "zod";

const schema = z.object({ API_INTERNAL_URL: z.string().url().default("http://localhost:8000") });
const parsed = schema.safeParse({ API_INTERNAL_URL: process.env.API_INTERNAL_URL });
if (!parsed.success) throw new Error(`Invalid server environment: ${parsed.error.message}`);

export const serverEnv = { apiInternalUrl: parsed.data.API_INTERNAL_URL };
