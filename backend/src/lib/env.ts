import type { Context } from "hono";

export type Env = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
  };
  Variables: {
    ownerId: string;
  };
};

export type AppContext = Context<Env>;
