import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle/mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://root:YOUR_MYSQL_PASSWORD@127.0.0.1:3306/ater",
  },
});
