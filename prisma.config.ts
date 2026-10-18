import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma CLI schema operations should use the session-mode pooler.
    url: env("DIRECT_URL"),
  },
});
