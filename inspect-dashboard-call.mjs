import fs from 'node:fs';
const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (/notifyInfo|notifyError|confirmAction/.test(lines[i])) console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
