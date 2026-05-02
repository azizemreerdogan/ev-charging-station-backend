import { z } from "zod";
import "dotenv/config";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default("1d"),
    TAX_RATE: z.coerce.number().min(0).max(1).default(0.18),
});
export const env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map