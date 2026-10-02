import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../lib/db.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid login data",
      });
    }

    const { email, password } = parsed.data;

    const result = await query(
      `select id, email, password_hash
       from owners
       where email = $1
       limit 1`,
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return reply.code(401).send({
        error: "Invalid email or password",
      });
    }

    const owner = result.rows[0];

    const valid = await bcrypt.compare(password, owner.password_hash);

    if (!valid) {
      return reply.code(401).send({
        error: "Invalid email or password",
      });
    }

    const token = await app.jwt.sign({
      ownerId: owner.id,
      email: owner.email,
    });

    return {
      token,
      owner: {
        id: owner.id,
        email: owner.email,
      },
    };
  });
}
