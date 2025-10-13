# Admin Timesheet Dashboard — Developer Guide

This document describes how the amministrazione (admin) timesheet dashboard is structured, which data sources it consumes, and how the staging + inspection tooling fits together. Use it as a companion when extending the admin experience or debugging cross-cutting timesheet issues.

## High-level overview

- Entry point: `src/domains/timesheet/pages/DashboardAmministrazioneTimesheet.jsx`.
- The page renders inside a `TimesheetProvider` with `scope="all"` so every employee dataset is available in the shared context.
- The layout is split across three surface areas:
  1. **Filters bar** – global month navigation + search/role/azienda/commessa/status filters.
  2. **Admin grid** – calendar-style matrix of employees × days with staging overlays.
  3. **Employee inspector** – deep dive analytics, commessa breakdown, badge history, and segnalazioni for the selected employee.
- Changes never hit mocks directly. Everything flows through the staging layer (`useTimesheetStaging`) and is committed (or discarded) via `TimesheetStagingBar`.

## Data flow

1. `TimesheetProvider` loads the canonical `dataMap` via `useTimesheetData` (committed timesheets) and exposes setter APIs (`setEmployeeData`).
2. The dashboard pulls the roster using `listAllUsers()` and filters to roles that actually have timesheet data (`DIPENDENTE`, `OPERAIO`, `PM_CAMPO`, `COORDINATORE`).
3. Staging state comes from `useTimesheetStaging()`:
   - `entries` – raw staged drafts grouped by `employeeId|date`.
   - `getMergedDay(employeeId, dateKey)` – committed + staged overlay used for read models.
   - `buildStagedMetaMap()` – generates `{ [employeeId]: { [dateKey]: 'insert'|'update'|'delete' } }` consumed for tile glows and inspector chips.
4. Reference data (commesse, including closed entries) arrives through `useReferenceData({ commesse: true })`. The inspector relies on it to colorize charts, flag archived commesse, and compute non-work vs work splits.
5. Segnalazioni and badge widgets fetch through dedicated hooks (`useSegnalazione`, `useBadgeData`) so the inspector can surface communications without blocking the rest of the UI.

## Layout & components

| Area | Component | Responsibilities |
| ---- | --------- | ---------------- |
| Filters | `AdminFiltersBar` | Month navigation, quick jump to today, date picker shortcut, multi-role + azienda filters, free-text search, commessa filter, staged/non-work toggles. Updates local `filters` state in the page component. |
| Grid | `AdminTimesheetGrid` | Virtualized calendar table. Highlights staged cells via `stagedMeta`, supports employee selection and double-click to open the day editor. Emits selection callbacks that keep the provider’s `selection` in sync. |
| Inspector | `AdminEmployeeInspector` | Analytics, commessa insights, absence totals, badge status, segnalazioni timeline, and period navigation (`daily` vs `period` tabs). Pulls merged data + reference data to compute charts. |
| Global staging | `TimesheetStagingBar` | Shows number of staged entries, exposes **Conferma** (confirm) and **Annulla** (discard) actions. |
| Dialog | `DayEntryDialog` | Opens when a grid cell is double-clicked or inspector action triggers edits. Shares the same editor stack used by Dipendente to guarantee consistent validation. |

The page threads `selectedEmployeeId`, `selectedDay`, and `periodReferenceDate` through these components so switching employees or periods is reflected everywhere.

## Filtering & selection rules

- **Search** – matches against `nome` + `cognome` (case-insensitive).
- **Role filter** – defaults to `['all']`. When a specific role is chosen the roster is narrowed to employees containing that role.
- **Azienda filter** – filters by the mock `azienda` field.
- **Commessa filter** – checks the current month’s entries (excluding segnalazioni) and keeps employees with at least one matching commessa code.
- **Status filter** –
  - `staged`: only employees with staged changes (`stagedMeta[empId]`) survive.
  - `non-work`: keeps employees with MALATTIA/FERIE/PERMESSO/ROL across the month.
- The first employee that passes filters is auto-selected; losing selection (due to filter change) falls back to the new first employee to avoid empty inspector states.

## Period management

- Local state `currentDate` drives month/year navigation via **Prev / Next / Today** buttons.
- The inspector introduces its own `selectedPeriod` (`week`, `month`, `year`) and `periodReferenceDate`, coordinated through `parseDateKey` helpers. Changing the period realigns the reference anchor using `startOfWeek` / `startOfMonth` / `startOfYear`.
- `highlightedDates` in the grid marks the subset of days currently analyzed inside the inspector (period tab).

## Inspector deep dive

`AdminEmployeeInspector` composes several panels:

- **Hero header** – employee avatar, badge chip (`useBadgeData`), quick summary for the chosen period.
- **Analytics cards** – total work hours, number of recorded days, staged vs committed indicators.
- **Commessa insights** – pie chart + table for active commesse, archived commesse list, with colors derived from `getCommessaColor`.
- **Absence summary** – table listing `FERIE`, `MALATTIA`, `PERMESSO`, `ROL` with both hours and distinct day counts. Utilizes constants from `AdminEmployeeInspector/utils.js`.
- **Daily breakdown** – timeline of entries for the selected day, segnalazioni (if any), and CTA to open the `DayEntryDialog`.
- **Period tab** – aggregated view for the range determined by `selectedPeriod` (`week`/`month`/`year`).

The inspector holds internal state (`internalPeriod`, `internalReferenceKey`) but syncs with the parent when props are provided, allowing the page to drive period selection externally.

## Staging workflow

1. **Edit initiation** – double-click a grid cell or use inspector shortcuts to open `DayEntryDialog`.
2. **Drafting** – the dialog uses the shared day editor stack (`useDayEditor`) to construct drafts. The staging hook’s `stageDraft` is invoked with the new entries.
3. **Visual feedback** – `AdminTimesheetGrid` receives `stagedMeta` and `stagingEntries` to draw glows and icons. The inspector reads merged data to reflect staged numbers immediately.
4. **Commit** – `TimesheetStagingBar` calls `useTimesheetStaging().confirmAll()`, which builds a batch payload and delegates to mock API updaters (via staging reducer). After a successful commit, the provider refreshes the `dataMap`.
5. **Discard** – the same bar can discard all staged entries, resetting to committed data without reloading.

## Permissions & roles

- The router (`TimesheetRouter.jsx`) routes
  - `AMMINISTRATORE`, `DIRETTORE_TECNICO`, `DIRETTORE_GENERALE` → admin dashboard.
  - `COORDINATORE` → coordinatore dashboard.
  - `DIPENDENTE` → personal dashboard.
- Admin dashboard exposes editing tools for every employee returned by `listAllUsers()` except pure admin roles.
- Mock validations (inside `ProjectMock.js`) still enforce business invariants (max 8h, MALATTIA exclusivity, FERIE combos). Failed commits surface the mock’s Italian error messages in staging notifications.

## Key files & helpers

- `src/domains/timesheet/pages/DashboardAmministrazioneTimesheet.jsx`
- `src/domains/timesheet/components/admin-grid/AdminTimesheetGrid/`
- `src/domains/timesheet/components/admin-grid/AdminFiltersBar/`
- `src/domains/timesheet/components/admin-grid/AdminEmployeeInspector/`
- `src/domains/timesheet/components/staging/TimesheetStagingBar.jsx`
- `src/domains/timesheet/hooks/staging/`
- `src/mocks/ProjectMock.js` (timesheet state + validation)
- `src/mocks/TimesheetAggregatesMock.js`, `TimesheetAbsencesMock.js` (aggregated data shown in inspector)

## Extending tips

- **Add a new filter** – extend `filters` state in the page, update `AdminFiltersBar` props, and adjust the `filteredEmployees` memo to enforce the rule.
- **Custom staged visuals** – tweak `AdminTimesheetGrid`’s staged meta handling to emit new status tokens and map them to icons/styles (same approach as `WorkCalendar`).
- **New analytics panels** – compute metrics inside `AdminEmployeeInspectorContainer` since it already collates the merged day records; surface them via the view component.
- **Backend integration** – replace mock calls with API hooks inside `TimesheetStagingProvider` once server endpoints exist; the dashboard consumes the provider abstractions so no page-level changes should be required.

## Running & verification

From the repository root:

```powershell
cd frontend
npm install  # once
npm run dev  # optional, development server
npm run build
```

The production build (`npm run build`) should complete without errors; recent iterations of the admin dashboard were validated with this command.

---

For follow-ups consider adding diagrams (component hierarchy or data flow), or a troubleshooting appendix listing common staging validation failures and where they originate in the mocks.
