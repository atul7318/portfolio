import { cpSync } from "fs";

// Copy public assets and static files into the standalone output
cpSync("public", ".next/standalone/public", { recursive: true });
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });

console.log("✓ Copied public/ and .next/static/ into standalone build");
