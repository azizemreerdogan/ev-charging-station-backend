import type { FastifyInstance } from "fastify";
export declare class AppError extends Error {
    code: string;
    statusCode: number;
    details?: unknown | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: unknown | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare function registerErrorHandler(app: FastifyInstance): void;
//# sourceMappingURL=errors.d.ts.map