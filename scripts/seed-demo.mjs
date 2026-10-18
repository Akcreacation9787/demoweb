import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`;

try {
  const response = await fetch(`${baseUrl}/api/seed`, { method: "POST" });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Seed endpoint returned HTTP ${response.status}`);
  }

  console.log(JSON.stringify(body, null, 2));
} catch (error) {
  if (error?.cause?.code !== "ECONNREFUSED" && error?.cause?.code !== "ECONNRESET") {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } else {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const server = spawn(command, ["run", "dev"], {
      stdio: "inherit",
      env: { ...process.env, PORT: port },
      shell: process.platform === "win32",
    });

    const stopServer = () => server.kill("SIGTERM");
    process.once("SIGINT", stopServer);
    process.once("SIGTERM", stopServer);

    server.once("error", (serverError) => {
      console.error(`Could not start the dev server: ${serverError.message}`);
      process.exitCode = 1;
    });
    server.once("exit", (code) => {
      process.exitCode = code ?? 1;
    });

    const startedAt = Date.now();
    let seeded = false;
    const poll = setInterval(async () => {
      if (seeded || server.exitCode !== null) return;
      try {
        const response = await fetch(`${baseUrl}/api/seed`, { method: "POST" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Seed endpoint returned HTTP ${response.status}`);
        seeded = true;
        clearInterval(poll);
        console.log(JSON.stringify(body, null, 2));
        stopServer();
      } catch (pollError) {
        if (Date.now() - startedAt > 90000) {
          clearInterval(poll);
          console.error(pollError instanceof Error ? pollError.message : pollError);
          stopServer();
          process.exitCode = 1;
        }
      }
    }, 1500);
  }
}
