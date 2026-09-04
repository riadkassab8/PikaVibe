import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\.ts$/.test(entry.name)) files.push(full);
  }
}
walk(root);

function resolveSpecifier(file, spec) {
  if (!spec.startsWith(".")) return spec;
  if (/\.(?:js|jsx|ts|tsx|mjs|cjs|json)$/.test(spec)) return spec;
  const absolute = path.resolve(path.dirname(file), spec);
  if (fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()) return `${spec}/index.js`;
  return `${spec}.js`;
}

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const updated = original.replace(/(from\s+["']|import\(\s*["'])(\.[^"']+)(["']\s*\)?)/g, (_, prefix, spec, suffix) => `${prefix}${resolveSpecifier(file, spec)}${suffix}`);
  if (updated !== original) fs.writeFileSync(file, updated, "utf8");
}
console.log(`Updated ${files.length} TypeScript files under ${root}`);
