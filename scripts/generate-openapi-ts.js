#!/usr/bin/env node
// Re-generate src/openapi.ts from docs/openapi.json
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const srcPath = path.join(repoRoot, "docs", "openapi.json");
const outPath = path.join(repoRoot, "src", "openapi.ts");

const content = fs.readFileSync(srcPath, "utf-8");
// Verify JSON
JSON.parse(content);
const out = `// Auto-generated from docs/openapi.json. Do not edit by hand.\n` +
  `// Regenerate by running: npm run generate:openapi\n` +
  `export const openApiSpec = ${content.trimEnd()} as unknown as object;\n`;
fs.writeFileSync(outPath, out);
console.log(`Wrote ${out.length} bytes to ${path.relative(repoRoot, outPath)}`);
