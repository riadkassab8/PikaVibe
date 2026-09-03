import fs from 'node:fs';
const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8');
for (const line of text.split(/\r?\n/)) {
  if (/notifyInfo|notifySuccess|notifyError|confirmAction/.test(line)) console.log(JSON.stringify(line));
}
