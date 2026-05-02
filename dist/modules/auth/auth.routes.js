import { loginBodySchema, registerBodySchema, } from "./auth.schema.js";
import { authenticateUser, registerUser } from "./auth.service.js";
export async function authRoutes(app) {
    const r = app.withTypeProvider();
    r.post("/register", { schema: { body: registerBodySchema, tags: ["auth"] } }, async (req, reply) => {
        const user = await registerUser(req.body);
        const token = app.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return reply.code(201).send({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    });
    r.post("/login", { schema: { body: loginBodySchema, tags: ["auth"] } }, async (req) => {
        const user = await authenticateUser(req.body);
        const token = app.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    });
}
//# sourceMappingURL=auth.routes.js.map