const { execSync } = require("child_process");

const port = process.env.PORT || 8080;
const hostname = "0.0.0.0";

console.log(`Starting Next.js on ${hostname}:${port}`);

execSync(`npx next start -H ${hostname} -p ${port}`, {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: hostname, PORT: String(port) },
});
