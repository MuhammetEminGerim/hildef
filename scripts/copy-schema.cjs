const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const src = path.join(projectRoot, 'electron', 'db', 'schema.sql');
const destDir = path.join(projectRoot, 'dist', 'main', 'db');
const dest = path.join(destDir, 'schema.sql');

if (!fs.existsSync(src)) {
  console.error('schema.sql not found at', src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied schema.sql to', dest);


