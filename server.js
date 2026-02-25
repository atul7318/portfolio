const { spawn } = require("child_process");
const path = require("path");

const port = process.env.PORT || "8080";
const hostname = "0.0.0.0";

// Resolve the next CLI entry point (works cross-platform)
const nextCli = require.resolve("next/dist/bin/next");

console.log(`[server.js] Starting Next.js on http://${hostname}:${port}`);
console.log(`[server.js] Next CLI: ${nextCli}`);
console.log(`[server.js] NODE_ENV: ${process.env.NODE_ENV}`);

const child = spawn(process.execPath, [nextCli, "start", "-H", hostname, "-p", port], {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: hostname, PORT: port },
});

child.on("error", (err) => {
  console.error("[server.js] Failed to start:", err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
