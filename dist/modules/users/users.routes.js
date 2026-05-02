import { z } from "zod";
import { prisma } from "../../db/client.js";
import { NotFoundError } from "../../utils/errors.js";
const updateMeSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().max(32).optional(),
});
export async function userRoutes(app) {
    const r = app.withTypeProvider();
    r.get("/me", { onRequest: [app.authenticate], schema: { tags: ["users"] } }, async (req) => {
        const user = await prisma.user.findUnique({
            where: { id: req.currentUser.sub },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new NotFoundError("User");
        return user;
    });
    r.patch("/me", {
        onRequest: [app.authenticate],
        schema: { body: updateMeSchema, tags: ["users"] },
    }, async (req) => {
        const user = await prisma.user.update({
            where: { id: req.currentUser.sub },
            data: req.body,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
            },
        });
        return user;
    });
}
//# sourceMappingURL=users.routes.js.map