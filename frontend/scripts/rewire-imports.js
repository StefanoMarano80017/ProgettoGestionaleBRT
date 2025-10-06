#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');

const patterns = [
  // mapping: old import -> new alias path
  { from: /@routes\//g, to: "@/Routes/" },
  { from: /@layouts\//g, to: "@/Layouts/" },
  { from: /@pages\//g, to: "@/Pages/" },
  { from: /@components\//g, to: "@/Components/" },
  { from: /@hooks\//g, to: "@/Hooks/" },
  { from: /@services\//g, to: "@/Services/" },
  { from: /@theme\//g, to: "@/shared/theme/" },
  { from: /@calendar\//g, to: "@domains/timesheet/components/calendar/" },
  { from: /@entries\//g, to: "@/Components/Entries/" },
  // timesheet specific
  { from: /src\/Pages\/Timesheet/g, to: "@domains/timesheet/pages" },
];

let modified = 0;
function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(it => {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) return walk(full);
    if (!/\.jsx?$|\.tsx?$/.test(it.name)) return;
    let content = fs.readFileSync(full, 'utf8');
    let original = content;
    patterns.forEach(p => { content = content.replace(p.from, p.to); });
    if (content !== original) {
      fs.writeFileSync(full, content, 'utf8');
      modified++;
      console.log('rewired', full);
    }
  });
}

walk(src);
console.log('files modified:', modified);
