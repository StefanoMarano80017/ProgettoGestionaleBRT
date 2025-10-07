#!/usr/bin/env node
// Modernized rewire-imports script (idempotent). Converts legacy/temporary paths
// to canonical shared/domains locations. Safe to re-run.
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const src = path.resolve(process.cwd(), 'src'); // eslint-disable-line no-undef

const patterns = [
  // Old dashboard components -> shared
  { from: /@\/Components\/DataGridDashboard\/FiltersBar/g, to: '@shared/components/DataGridDashboard/FiltersBar' },
  { from: /@\/Components\/DataGridDashboard\/NavigationBar/g, to: '@shared/components/DataGridDashboard/NavigationBar' },
  { from: /@\/Components\/DataGridDashboard\/Filters\//g, to: '@shared/components/Filters/' },
  { from: /@\/Components\/DataGridDashboard\/ColorDot/g, to: '@shared/components/Filters/ColorDot' },
  // Theme move
  { from: /@theme\//g, to: '@shared/theme/' },
  // Generic legacy top-level aliases -> root '@/' (can prune later)
  { from: /@components\//g, to: '@/' },
  { from: /@hooks\//g, to: '@/' },
  // Calendar relocation hint (only if still present)
  { from: /@calendar\//g, to: '@domains/timesheet/components/calendar/' },
  { from: /@entries\//g, to: '@/' },
];

let modified = 0;

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) processFile(full);
  }
}

function processFile(file) {
  let text = readFileSync(file, 'utf8');
  let changed = false;
  for (const { from, to } of patterns) {
    if (from.test(text)) {
      text = text.replace(from, to);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, text, 'utf8');
    modified++;
    console.log('[rewire] updated', path.relative(process.cwd(), file)); // eslint-disable-line no-undef
  }
}

walk(src);
console.log(`[rewire] files modified: ${modified}`);
