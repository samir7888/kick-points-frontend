import { z } from "zod";
import { env } from "./env";

export const slugSchema = z.string().regex(/^[A-Za-z0-9_-]{1,50}$/, "Use 1–50 letters, numbers, underscores or hyphens.");
export const amountSchema = z.coerce.number().int().min(env.minVoteAmount, `Enter at least ${env.minVoteAmount} points.`);
