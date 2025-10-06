#!/usr/bin/env node
/**
 * check-imports.js
 * Scans source tree for deprecated legacy aliases and prints a report.
 * Exits with code 1 if any forbidden imports are found (for CI use).
 */
import { readdirSync, statSync, readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src');
const forbidden = [
  '@/Components/',
  '@/app/layouts/AuthContext',
  '@/app/layouts/ThemeContext',
  '@/Hooks/',
  'src/Components/', // direct relative style (fallback)
  'src/app/layouts/AuthContext',
  'src/app/layouts/ThemeContext'
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    if (entry === '_legacy_archive') continue; // skip archived legacy code
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(root);
let violations = [];
for (const f of files) {
  const txt = readFileSync(f, 'utf8');
  for (const pattern of forbidden) {
    if (txt.includes(pattern)) {
      violations.push({ file: f, pattern });
    }
  }
}

if (violations.length) {
  console.error('\nForbidden legacy imports found:');
  for (const v of violations) {
    console.error('-', path.relative(process.cwd(), v.file), '->', v.pattern);
  }
  process.exit(1);
} else {
  console.log('No forbidden legacy imports found.');
}
