#!/usr/bin/env node
import { readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src');
const INDEX = 'index.js';

function toIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function generateBarrel(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  const files = entries.filter(e => e.isFile() && /\.(jsx?|tsx?)$/.test(e.name) && e.name !== INDEX);
  const subdirs = entries.filter(e => e.isDirectory());
  if (!files.length && !subdirs.length) return;
  const lines = [];
  for (const f of files) {
    const base = path.basename(f.name, path.extname(f.name));
    const id = toIdentifier(base);
    const fullPath = path.join(dir, f.name);
    let source = '';
    try { source = readFileSync(fullPath, 'utf8'); } catch {}
    const hasDefault = /export\s+default\s+/m.test(source);
    if (hasDefault) {
      lines.push(`export { default as ${id} } from './${base}';`);
    } else {
      // no default: skip alias line to avoid breaking consumers; rely on named exports only
      // Optionally we could attempt to infer a primary named export, but keeping it simple.
    }
    lines.push(`export * from './${base}';`);
  }
  for (const d of subdirs) {
    const subIndex = path.join(dir, d.name, INDEX);
    try { statSync(subIndex); lines.push(`export * from './${d.name}';`); } catch {}
  }
  lines.push('');
  const content = lines.join('\n');
  const target = path.join(dir, INDEX);
  let existing = '';
  try { existing = readFileSync(target, 'utf8'); } catch {}
  if (existing === content) return;
  writeFileSync(target, content, 'utf8');
  console.log('[barrel] updated', path.relative(root, target));
}

const targets = [
  'domains/timesheet/components/panels',
  'domains/timesheet/components/staging',
  'domains/timesheet/hooks/staging',
  'domains/timesheet/hooks/dayEntry',
  'domains/timesheet/pages',
  'shared/components/Bars',
  'shared/components/Buttons',
  'shared/components/BadgeCard',
  'shared/components/Calendar',
  'shared/components/Filters',
  'shared/components/Avatar',
  'shared/dialogs',
  'app/layouts'
];

for (const rel of targets) {
  generateBarrel(path.join(root, rel));
}

// Optional recursive pass for nested barrels inside shared/hooks/filters etc.
generateBarrel(path.join(root, 'shared/hooks/filters'));
