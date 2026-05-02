import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 400,
        public details?: unknown,
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super("NOT_FOUND", `${resource} not found`, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super("CONFLICT", message, 409);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super("UNAUTHORIZED", message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super("FORBIDDEN", message, 403);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super("VALIDATION_ERROR", message, 422, details);
    }
}

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((err: FastifyError, _req, reply) => {
        if (err instanceof AppError) {
            return reply.code(err.statusCode).send({
                code: err.code,
                message: err.message,
                ...(err.details !== undefined ? { details: err.details } : {}),
            });
        }

        if (err instanceof ZodError) {
            return reply.code(422).send({
                code: "VALIDATION_ERROR",
                message: "Invalid request payload",
                details: err.issues,
            });
        }

        if (err.validation) {
            return reply.code(422).send({
                code: "VALIDATION_ERROR",
                message: err.message,
                details: err.validation,
            });
        }

        if (err.statusCode && err.statusCode < 500) {
            return reply.code(err.statusCode).send({
                code: err.code ?? "ERROR",
                message: err.message,
            });
        }

        app.log.error({ err }, "unhandled error");
        return reply.code(500).send({
            code: "INTERNAL_ERROR",
            message: "Internal server error",
        });
    });
}
