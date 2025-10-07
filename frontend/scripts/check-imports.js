#!/usr/bin/env node
/**
 * check-imports.js
 * Scans source tree for deprecated legacy aliases and prints a report.
 * Exits with code 1 if any forbidden imports are found (for CI use).
 */
import { readdirSync, statSync, readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src'); // eslint-disable-line no-undef

// When the legacy archive has been deleted, set LEGACY_ARCHIVE_PRESENT=false (or rely on default detection)
const legacyArchivePath = path.join(root, '_legacy_archive');
const legacyArchiveExists = (() => { try { return statSync(legacyArchivePath).isDirectory(); } catch { return false; } })();

// Forbidden patterns with remediation suggestion
const forbidden = [
  {
    match: '@/Components/',
    suggest: 'Importa dal percorso migrato: @shared/components/...'
  },
  {
    match: '@/app/layouts/AuthContext',
    suggest: "Usa '@/app/providers/AuthProvider'"
  },
  {
    match: '@/app/layouts/ThemeContext',
    suggest: "Usa '@/app/providers/ThemeProvider'"
  },
  {
    match: '@/Hooks/',
    suggest: 'Punta a domains/auth/hooks o shared/hooks a seconda del caso'
  },
  {
    match: 'src/Components/',
    suggest: 'Percorso relativo legacy: sostituiscilo con @shared/components'
  },
  {
    match: 'src/app/layouts/AuthContext',
    suggest: "Sostituisci con '@/app/providers/AuthProvider'"
  },
  {
    match: 'src/app/layouts/ThemeContext',
    suggest: "Sostituisci con '@/app/providers/ThemeProvider'"
  }
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    if (entry === '_legacy_archive' && legacyArchiveExists) continue; // skip only if still present
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
  for (const rule of forbidden) {
    if (txt.includes(rule.match)) {
      violations.push({ file: f, pattern: rule.match, suggest: rule.suggest });
    }
  }
}

if (violations.length) {
  console.error('\nForbidden legacy imports found (', violations.length, '):');
  const rel = p => path.relative(process.cwd(), p); // eslint-disable-line no-undef
  for (const v of violations) {
    console.error(' -', rel(v.file));
    console.error('    pattern :', v.pattern);
    if (v.suggest) console.error('    suggest :', v.suggest);
  }
  console.error('\nFix the above imports before proceeding.');
  if (legacyArchiveExists) {
    console.error('Note: _legacy_archive still exists; consider deleting it once all shims are removed.');
  }
  process.exit(1); // eslint-disable-line no-undef
} else {
  console.log('No forbidden legacy imports found.');
  if (legacyArchiveExists) {
    console.log('Reminder: _legacy_archive directory still present but not scanned. You can delete it now.');
  }
}
