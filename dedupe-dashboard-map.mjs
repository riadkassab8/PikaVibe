import fs from 'node:fs';
const path = 'E:/Desktop folders/react_app/Ecommerce_projects/New folder/Home-Goods-Hub/bilingual-audit/dashboard.tsx';
const source = fs.readFileSync(path, 'utf8');
const start = source.indexOf('const dashboardEnglish: Record<string, string> = {');
const end = source.indexOf('\n};', start);
if (start < 0 || end < 0) throw new Error('dashboardEnglish map not found');
const body = source.slice(start, end);
const entryPattern = /'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'/g;
const seen = new Set();
const entries = [];
for (const match of body.matchAll(entryPattern)) {
  const key = match[1];
  if (seen.has(key)) continue;
  seen.add(key);
  entries.push(`  '${key}': '${match[2]}'`);
}
const replacement = `const dashboardEnglish: Record<string, string> = {\n${entries.join(',\n')}\n`;
fs.writeFileSync(path, source.slice(0, start) + replacement + source.slice(end), 'utf8');
console.log(`DEDUPED_TRANSLATIONS=${entries.length}`);
