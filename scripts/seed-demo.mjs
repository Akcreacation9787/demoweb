import "dotenv/config";
import { seedDemoData } from "../src/lib/seed.ts";
import { pool } from "../src/db/index.ts";

try {
  const result = await seedDemoData();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
