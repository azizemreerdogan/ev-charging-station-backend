import { ZodError } from "zod";
export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "AppError";
    }
}
export class NotFoundError extends AppError {
    constructor(resource) {
        super("NOT_FOUND", `${resource} not found`, 404);
    }
}
export class ConflictError extends AppError {
    constructor(message) {
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
    constructor(message, details) {
        super("VALIDATION_ERROR", message, 422, details);
    }
}
export function registerErrorHandler(app) {
    app.setErrorHandler((err, _req, reply) => {
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
//# sourceMappingURL=errors.js.map