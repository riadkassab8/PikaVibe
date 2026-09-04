import fs from 'node:fs';
const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
for (let i = 218; i <= 230; i++) console.log(`${i}: ${JSON.stringify(lines[i - 1])}`);
