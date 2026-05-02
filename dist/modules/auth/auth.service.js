import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";
export async function registerUser(input) {
    const passwordHash = await hashPassword(input.password);
    try {
        const user = await prisma.user.create({
            data: {
                email: input.email.toLowerCase(),
                passwordHash,
                name: input.name,
                phone: input.phone ?? null,
                role: input.role,
            },
        });
        return user;
    }
    catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002") {
            throw new ConflictError("Email already registered");
        }
        throw err;
    }
}
export async function authenticateUser(input) {
    const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
    });
    if (!user || user.deletedAt) {
        throw new UnauthorizedError("Invalid credentials");
    }
    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) {
        throw new UnauthorizedError("Invalid credentials");
    }
    if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
        throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`);
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map