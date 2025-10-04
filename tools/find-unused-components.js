const fs = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function readUtf8(filePath){
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e){
    return '';
  }
}

const workspace = path.resolve(__dirname, '..');
const frontend = path.join(workspace, 'frontend');
const componentsDirs = [
  path.join(frontend, 'src', 'Components'),
  path.join(frontend, 'src', 'components'),
];

const allFrontendFiles = walk(path.join(frontend, 'src')).filter(f => /\.(js|jsx|ts|tsx)$/.test(f));

const componentFiles = [];
componentsDirs.forEach(dir => {
  if (fs.existsSync(dir)){
    const files = walk(dir).filter(f => /\.(js|jsx|ts|tsx)$/.test(f));
    componentFiles.push(...files);
  }
});

const candidates = [];

componentFiles.forEach(file => {
  const basename = path.basename(file, path.extname(file));
  // search for word matches of basename in all frontend files excluding the file itself
  const regex = new RegExp('\\b' + basename + '\\b', 'g');
  let totalMatches = 0;
  let pagesMatches = 0;
  allFrontendFiles.forEach(f => {
    if (path.resolve(f) === path.resolve(file)) return; // skip self
    const txt = readUtf8(f);
    if (!txt) return;
    const matches = txt.match(regex);
    if (matches) {
      totalMatches += matches.length;
      if (f.startsWith(path.join(frontend, 'src', 'Pages'))) {
        pagesMatches += matches.length;
      }
    }
  });

  if (totalMatches === 0 && pagesMatches === 0){
    candidates.push({ file: path.relative(workspace, file).replace(/\\/g, '/'), basename });
  }
});

const out = { generatedAt: new Date().toISOString(), candidates, scanned: componentFiles.length };
fs.writeFileSync(path.join(workspace, 'unused-components.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
