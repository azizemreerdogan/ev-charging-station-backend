import fastify from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
export declare function buildServer(): Promise<fastify.FastifyInstance<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, fastify.FastifyBaseLogger, ZodTypeProvider>>;
//# sourceMappingURL=server.d.ts.map