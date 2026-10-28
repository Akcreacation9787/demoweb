import "dotenv/config";

if (process.env.NODE_ENV === "production") {
  throw new Error("Demo seeding is disabled in production.");
}

const [{ seedDemoData }, { pool }] = await Promise.all([
  import("../src/lib/seed.ts"),
  import("../src/db/index.ts"),
]);

try {
  const result = await seedDemoData();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
