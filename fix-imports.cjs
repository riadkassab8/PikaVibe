const fs = require('fs');
const path = require('path');

const srcDir = 'e:/Desktop folders/react_app/Ecommerce_projects/New folder/Home-Goods-Hub/artifacts/api-server/src';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/db\/src\/index\.js";/g, 'from "@workspace/db";');
    newContent = newContent.replace(/from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/db\/src\/schema\/index\.js";/g, 'from "@workspace/db";');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('Fixed', filePath);
    }
  }
});
