import { buildServer } from "./utils/server.js";
import { env } from "./config/env.js";

async function gracefulShutdown({
    app,
    signal,
}: {
    app: Awaited<ReturnType<typeof buildServer>>;
    signal: NodeJS.Signals;
}) {
    app.log.info({ signal }, "shutting down");
    try {
        await app.close();
        process.exit(0);
    } catch (err) {
        app.log.error({ err }, "error during shutdown");
        process.exit(1);
    }
}

async function main() {
    const app = await buildServer();

    for (const signal of ["SIGINT", "SIGTERM"] as const) {
        process.on(signal, () => {
            void gracefulShutdown({ app, signal });
        });
    }

    await app.listen({
        port: env.PORT,
        host: env.HOST,
    });
}

main().catch((err) => {
    console.error("fatal startup error", err);
    process.exit(1);
});