#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'src');

function writeBarrel(dir) {
  const files = fs.readdirSync(dir).filter(f => /\.jsx?$|\.tsx?$/.test(f) && f !== 'index.js');
  if (!files.length) return;
  const lines = files.map(f => {
    const name = path.basename(f, path.extname(f));
    return `export { default as ${name} } from './${f}';`;
  });
  const content = lines.join('\n') + '\n';
  const target = path.join(dir, 'index.js');
  fs.writeFileSync(target, content, 'utf8');
  console.log('barrel ->', target);
}

const targets = [
  'domains/timesheet/components/calendar',
  'domains/timesheet/components/panels',
  'domains/timesheet/components/staging',
  'domains/timesheet/hooks/staging',
  'domains/timesheet/hooks/dayEntry',
  'domains/timesheet/pages',
  'shared/components/Bars',
  'shared/components/Buttons',
  'shared/components/BadgeCard',
  'shared/components/Calendar',
  'shared/dialogs',
  'app/layouts'
];

targets.forEach(t => {
  const dir = path.join(root, t);
  if (fs.existsSync(dir)) writeBarrel(dir);
});
