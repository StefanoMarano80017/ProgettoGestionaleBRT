# Progetto Gestionale – Architecture & Data Flow

_Last updated: 2025-10-05_

## Scope
This document focuses on the runtime architecture and information flow for the currently relevant user‑facing pages:
- Login (`Pages/Login.jsx`)
- Home (`Pages/Home.jsx`)
- Dipendente Timesheet (`Pages/Timesheet/DipendenteTimesheet.jsx`)
- Dashboard Amministrazione Timesheet (`Pages/Timesheet/DashboardAmministrazioneTimesheet.jsx`)

It also maps the core subsystems (Auth, Timesheet Domain, Staging Layer, Calendar/Grid UI) and identifies candidate unused code for cleanup (separate section placeholder – populated after deeper static graph scan).

---
## High-Level Layered View

```
Presentation (Pages & Composite Panels)
 ├─ Login / Home
 ├─ DipendenteTimesheet
 └─ DashboardAmministrazioneTimesheet

Domain UI Components
 ├─ StagedChangesPanel
 ├─ DayEntryPanel / AdminDetailsPanel
 ├─ WorkCalendar / EmployeeMonthGrid / DayEntryTile
 ├─ CommesseDashboard / FiltersBar / TileLegend / BadgeCard
 └─ Dialogs (EditEntryDialog, SegnalazioneDialog, ConfirmDialog)

State & Hooks Layer
 ├─ AuthProvider / useAuth
 ├─ TimesheetProvider & Context (employees, dataMap, selection helpers)
 ├─ Staging Reducer + useTimesheetStaging (entries, order, ops)
 ├─ Domain hooks: useEmployeeTimesheetLoader, useMonthCompleteness, useMultipleMonthCompleteness,
 │   useStableMergedDataMap, useStagedMetaMap, useTimesheetEntryEditor, useDayAndMonthDetails,
 │   useTimesheetAggregates, useTimesheetFilters, useSegnalazione, useSelection
 └─ Utility models: semantic hashes, diff & merge helpers

Data Sources (Mock / Future API)
 ├─ UsersMock (authenticate)
 ├─ Project / Commessa mocks
 └─ Timesheet mock loaders (applyStagedToMock, etc.)
```

---
## Data Models (Key Shapes)

### Auth
```
AuthState: {
  user: { id, username, roles[], azienda, ... },
  token: string | null
}
AuthContext Value: {
  user, token, isAuthenticated: boolean, roles: string[],
  login(username, password) -> Promise<{user, token}>,
  logout(), hasRole(role)
}
```

### Timesheet Base Data
```
TimesheetDataMap: {
  [employeeId: string]: {
     [dateKey: 'YYYY-MM-DD']: Array<Record>
  }
}
Record: { commessa: string, ore: number, descrizione?: string }
```

### Staging Entry (Reducer State)
```
StagingState: {
  entries: {
    [employeeId]: {
      [dateKey]: {
        employeeId,
        dateKey,
        base: Record[]      // snapshot at first stage
        draft: Record[]|[]|null // null => day-delete (explicit)
        op: 'create' | 'update' | 'delete' | 'noop'
        previousOp?: string
        hashes: { base: string, draft: string }
        dirty: boolean
      }
    }
  },
  order: [ "empId|dateKey", ... ]
}
```

### Derived Meta
- `useStagedMetaMap` → `{ [employeeId]: { [dateKey]: op } }` (filters out `noop`).
- `useStableMergedDataMap` → overlays staged `draft` for read contexts that must reflect local edits (employee page editing panel) while calendar tiles still show committed base + glow.

### Diff Object (Panel)
```
DayDiff: {
  type: 'new-day'|'day-delete'|'insert-only'|'update-only'|'delete-only'|'mixed'|'no-op',
  inserts: number,
  updates: number,
  deletes: number,
  original: Record[] | [],
  staged: Record[] | [] | null,
  changes: Array<{ type: 'insert'|'update'|'delete', before?, after? }>
}
```

---
## Core Flows

### 1. Login
```
User submits credentials → useAuth.login → authenticate (Mocks) → set AuthContext & localStorage → Navigate to /Home or preserved route in location.state.from
```
Sequence (simplified):
1. `Login.jsx` form submit
2. `login()` calls `authenticate()` (UsersMock) → success returns { user, token }
3. AuthProvider updates context state + persists to localStorage
4. React Router navigation to original target (RequireAuth stored) or `/Home`

### 2. Employee Timesheet Editing & Staging
```
TimesheetProvider(scope='single') mounts → load employee base data (useEmployeeTimesheetLoader)
User selects day in WorkCalendar → DayEntryPanel renders with mergedData
User edits entries → DayEntryPanel debounces and calls staging.stageDraft(empId,dateKey,draft)
Staging reducer stores snapshot (base) & draft → op classification
Calendar still reads base data; glow via stagedMeta (op mapped to staged-* tag)
StagedChangesPanel lists diffs purely from staging.entries (base vs draft)
User clicks Confirm → batch commit hook applyStagedToMock → on success staging cleared
```

### 3. Admin Multi-Employee Editing
```
TimesheetProvider(scope='all') → loads all employees + timesheet map
EmployeeMonthGrid shows base hours per day (no staged overlay) + glow from stagedMeta
Selecting (emp, date) loads details via useDayAndMonthDetails
Edits in AdminDetailsPanel / dialogs update local detail state then staging.stageDraft(emp,date,draft)
Commit through StagedChangesPanel (same shared component) → batch apply
Filters & completeness metrics recompute on base data only until commit
```

### 4. Staging Operation Lifecycle
```
Initial edit → UPSERT_ENTRY: capture base snapshot if first time; classify op
Subsequent edits → reuse frozen base; re-classify
If draft semantically equals base → entry converted to 'noop' (retained) or skipped if first staging (stability)
Rollback / Revert (panel chip X or double-click) → staging.rollbackEntry removes entry (restores base view)
Confirm → build payload (entries with op != 'noop') → remoteApplyFn → success clears reducer; failure triggers rollback payload
```

### 5. Visual State Separation
```
Calendar / Grid tiles: show committed base (tsCtx.dataMap) + highlight (stagedMeta op → glow)
Editing panels (DayEntryPanel, AdminDetailsPanel) use merged data: base plus staged draft for current day
StagedChangesPanel: independent view of staging snapshot (base + draft) unaffected by outside dataMap refresh jitter
```

---
## Key Components Responsibilities
| Component | Responsibility | Reads Base | Reads Draft | Writes Staging | Shows Glow |
|-----------|---------------|-----------|------------|----------------|-----------|
| WorkCalendar | Month view (single employee) | Yes | No | No | Yes (stagedMeta) |
| EmployeeMonthGrid | Matrix employees × days | Yes | No | No | Yes (stagedDaysMap) |
| DayEntryPanel | Focused day editing (employee) | Via mergedData | Yes | Yes (stageDraft) | N/A |
| AdminDetailsPanel | Focused editing (admin) | Yes (details) | Local copy → stage | Yes | N/A |
| StagedChangesPanel | Diff & control actions | Via staging.entries | Yes | Rollback / Discard / Confirm | N/A |
| DayEntryTile | Visual per day cell | Yes | No | No | Yes (stagedOp→glow) |

---
## Invariants & Design Decisions
- Base (committed) data is immutable for the UI until a successful commit; staging drafts never mutate `dataMap` directly.
- A staging entry’s `base` snapshot never changes after first staging to prevent op flip-flopping (e.g., create→update).
- Calendar & grids avoid recomputing diffs per tile; a precomputed staged meta map feeds glow classification.
- No deletion side-effects are applied visually to base arrays; delete shows as empty tile with red glow.
- `noop` entries are retained after prior edits to stabilize classification & prevent flicker; filtered from payload/visual diff list.

---
## Information Flow Diagram (Textual)
```
[User Edit] → DayEntryPanel local draft → stageDraft() → stagingReducer(entries/op)
   ├─ StagedChangesPanel (list diffs from staging.entries)
   ├─ useStagedMetaMap → WorkCalendar / EmployeeMonthGrid (glow)
   └─ useStableMergedDataMap → DayEntryPanel merged view

Confirm → buildBatchPayload() → remoteApplyFn(applyStagedToMock) → success: clear staging + (future) refresh base data
```

---
## Extension Points / Future Enhancements
- Replace mock `applyStagedToMock` with real REST/GraphQL backend connector (transactional batch endpoint).
- Add optimistic concurrency token per day (hash of base) included in batch payload; server detects conflicts.
- Introduce unit tests for staging reducer transitions (create→update→noop→rollback sequences).
- Enable partial commit (selection subset) in StagedChangesPanel.
- Add offline persistence (localStorage) for staging entries on navigation-away safeguard.

---
## Legacy Removed (2025-10-05 Cleanup)
The following previously identified legacy modules were removed to reduce surface area:

Removed components:
- `Components/Timesheet/DetailsPanel.jsx` (superseded by `AdminDetailsPanel` + `DayEntryPanel`).

Removed hooks (unused in active flows):
- `usePmGroups.js`
- `useOpPersonal.js`
- `useOperaiTimesheet.js`

Barrel exports pruned in `Hooks/Timesheet/index.js` and root `Hooks/index.js`.

Rationale: not referenced transitively by Login, Home, DipendenteTimesheet, DashboardAmministrazioneTimesheet, or their imported component trees. Reintroduction should follow new staging snapshot contract (base + draft overlay).

Retained utility `computeDayUsed` (still referenced by `DayEntryPanel`, editor hooks, and admin page logic).

---
## Cleanup Strategy (Preview)
1. Build dependency graph (import traversal from target pages) → mark reachable.
2. Collect files in `src` not reachable → manual review to avoid false positives (e.g., dynamic imports, index.js re-exports).
3. Categorize:
   - Remove (dead, superseded)
   - Consolidate (duplicate utilities)
   - Defer (future feature placeholders, document rationale)
4. Execute removal in incremental PRs for safer diffs.

---
## Glossary
- Base Data: Committed authoritative timesheet entries.
- Draft: Local edited candidate (staged) replacement for a day.
- Op: Operation classification relative to frozen base (`create|update|delete|noop`).
- Glow: Visual highlight on a day tile indicating uncommitted change.

---
## Ownership & Contact
- Timesheet domain & staging: (Assign owner)
- Auth & Routing: (Assign owner)

(Replace placeholders with actual team/maintainer names.)

---
_End of Architecture Overview_

---
## Modal Day Editing (2025-10-05 Update)

Both employee and admin timesheet pages now use a unified modal dialog (`DayEntryDialog`) for per‑day editing, opened via double‑click on a calendar tile.

### Interaction Changes
| Page | Previous Behavior | New Behavior |
|------|-------------------|--------------|
| DipendenteTimesheet | Inline `DayEntryPanel` beside calendar after selecting a day; double‑click unused | Single click selects day (context hints); double‑click opens `DayEntryDialog` wrapping `DayEntryPanel` (auto staging) |
| DashboardAmministrazioneTimesheet | Selection + inline `AdminDetailsPanel` editing with embedded entry editor dialogs | Single click selects (emp, day) for context; double‑click opens modal `DayEntryDialog` (for focused editing) while `AdminDetailsPanel` remains for summaries |

### Rationale
1. Reduces layout shift and vertical scroll when editing many days in sequence.
2. Provides consistent editing affordance across roles (employee vs admin).
3. Improves isolation of edit state (dialog lifecycle controls staging debounce cleanly).
4. Prepares ground for future keyboard navigation (enter/space to open, esc to close) and accessibility improvements.

### Technical Notes
* `DayEntryTile` gained `onDoubleClick` prop; both `WorkCalendar` and `EmployeeMonthGrid` plumb this up as `onDayDoubleClick`.
* Admin grid (`EmployeeMonthGrid`) now accepts `onDayDoubleClick` and triggers dialog after performing the usual selection & detail load.
* `DayEntryDialog` lazy‑renders `DayEntryPanel` only while open to minimize background effect work.
* Data passed to the dialog:
  - Employee page: merged data map (base + potential staging overlay logic internal to panel via context selectors).
  - Admin page: per‑employee slice of `mergedDataMap`; staging overlay still resolved inside `DayEntryPanel` through `useTimesheetStaging` with provided `employeeId` + `date`.
* Staging behavior inside the dialog remains identical—debounced `stageDraft` calls with phantom deletion guard.

### Accessibility & TODO
Planned incremental improvements (not yet implemented):
* Focus trap & initial focus (set to first actionable button in dialog header or first entry row add button).
* Return focus to originating tile after dialog close for keyboard users.
* ARIA labels: enrich dialog title to include employee name (admin view) and localized date long-form.

### Migration Considerations
Existing external references to inline `DayEntryPanel` (if any in future branches) should be updated to use the dialog pattern for consistency. `AdminDetailsPanel` remains for broader monthly stats & multi‑day context; its embedded ad‑hoc editing flows can be gradually deprecated in favor of the modal once parity is confirmed.

### Shared Hook: useDayEditor (2025-10-05)
`useDayEditor` centralizes the `(employeeId, date, open)` state for `DayEntryDialog`. Both `DipendenteTimesheet` and `DashboardAmministrazioneTimesheet` invoke `openEditor(empId, date)` on double‑click and pass the returned state into `DayEntryDialog`. Benefits:
* Removes duplicated dialogDay state logic across pages.
* Eases future enhancements (keyboard shortcuts, deep link to a specific day) by adding logic once.
* Simplifies accessibility focus return handling in a single place (future improvement).

---
