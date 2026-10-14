import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_MIN_VOTE_AMOUNT: z.coerce.number().int().positive().default(10),
  NEXT_PUBLIC_PREMIUM_PRICE: z.coerce.number().positive().default(1),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MIN_VOTE_AMOUNT: process.env.NEXT_PUBLIC_MIN_VOTE_AMOUNT,
  NEXT_PUBLIC_PREMIUM_PRICE: process.env.NEXT_PUBLIC_PREMIUM_PRICE,
});

if (!parsed.success)
  throw new Error(`Invalid frontend environment: ${parsed.error.message}`);

export const env = {
  siteUrl: parsed.data.NEXT_PUBLIC_SITE_URL,
  minVoteAmount: parsed.data.NEXT_PUBLIC_MIN_VOTE_AMOUNT,
  premiumPrice: parsed.data.NEXT_PUBLIC_PREMIUM_PRICE,
};
