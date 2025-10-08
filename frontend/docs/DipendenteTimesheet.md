# Dipendente Timesheet — Architecture & How it Works

This document explains how the "dipendente" timesheet works in this frontend codebase. It covers architecture, key components and hooks, mocks and validation rules, staging flow, and extension/debugging tips. Use it as a developer reference when making changes or adding features.

## High-level overview

- The timesheet UI is a calendar-centric view (month grid) where each day shows one or more timesheet rows (entries).
- The app distinguishes work entries (per-commessa) from non-work entries (FERIE, MALATTIA, PERMESSO, ROL).
- Changes made in the UI are normally staged (preview) via a local staging layer before being persisted by the backend or mock API.
- There are comprehensive mock APIs in `src/mocks` that emulate backend behaviour, seeding and validation rules.

## Key concepts

- Non-work codes: canonical list available at `src/domains/timesheet/hooks/utils/timesheetModel.js` as `NON_WORK_CODES` ("FERIE","MALATTIA","PERMESSO","ROL"). Prefer using that constant instead of hard-coded strings.
- Staging: a client-side staging layer (hook `useTimesheetStaging`) lets you preview changes and produces `stagedMap`/`stagedMeta` used by calendar tiles to show staged visual states.
- Personal absence editor: specialized UI to create/edit full-day personal absences (`PersonalAbsenceEditor.jsx`) that produces a draft of non-work entries for a date.

## Folder layout (relevant paths)

- `src/domains/timesheet/components/calendar` — calendar components (WorkCalendar, DayEntryTile, DayEntryDialog, etc.).
- `src/domains/timesheet/components/panels` — panels and editors (DayEntryPanel, PersonalAbsenceEditor, etc.).
- `src/domains/timesheet/hooks` — domain hooks (staging, calendar helpers, entry helpers).
- `src/domains/timesheet/hooks/utils/timesheetModel.js` — canonical NON_WORK_CODES and helpers (e.g. `isWorkCode`).
- `src/mocks` — in-repo mock implementations (ProjectMock, TimesheetAbsencesMock, TimesheetAggregatesMock, etc.).

## Important functions & components

- `computeDayStatus` (`src/domains/timesheet/components/calendar/utils/dayStatus.js`)
  - Determines the visual status of a calendar tile.
  - Now recognizes `non-work-full` when the sum of non-work entries for a day equals 8 hours (checked before other special cases).

- `DayEntryTile` / `WorkCalendar` (`src/domains/timesheet/components/calendar`)
  - `WorkCalendar` constructs a `stagedStatusMap` and uses `computeDayStatus` to compute `status`.
  - The calendar prefers staged statuses (e.g. `staged-insert`, `staged-update`, `staged-delete`) when present.

- `PersonalAbsenceEditor` (`src/domains/timesheet/components/panels/PersonalAbsenceEditor.jsx`)
  - Lets a user compose non-work drafts (FERIE/MALATTIA/PERMESSO/ROL) for a single day.
  - Emits `onChangeDraft` and `onConfirm` with the draft array (entries shaped like timesheet rows).
  - Uses builder helpers from `useNonWorkDraftBuilder.js`.

- Staging hook: `useTimesheetStaging()`
  - Exposes `stageDraft(employeeId, dateKey, draft, meta)` and `stagedMap`, `stagedMeta`.
  - `WorkCalendar` reads `stagedMap` to decide staged visual states.

- Mock APIs
  - `src/mocks/ProjectMock.js` — central mock data store + seeding + update APIs (e.g. `updateOperaioPersonalDay` which validates and persists personal absences).
  - `src/mocks/TimesheetAbsencesMock.js` — absence summaries and ledgers (monthly and range), includes ROL in totals.
  - `src/mocks/TimesheetAggregatesMock.js` — aggregates per employee and global-by-commessa with optional `opts?.includeNonWork` to return `nonWork` aggregates for HR/ADMIN.

## Validation rules (business invariants)

Implemented at mock/update level and enforced in the UI as well where possible:

- MALATTIA is exclusive: when a day is MALATTIA it must occupy the entire 8 hours (no other codes same day). Updates violating this are rejected by mock validation.
- FERIE rules: FERIE can be the full 8h or combined with PERMESSO/ROL such that the sum is exactly 8h. Partial FERIE-only days or combos not summing to 8h are considered invalid.
- Daily total hours per employee must never exceed 8h (work + non-work combined). Mock APIs and save/update flows validate and throw informative Italian errors on violations.

Note: These rules are enforced in `ProjectMock.updateOperaioPersonalDay` (server-side mock) and seeders auto-correct generated data where appropriate (with one-time console warnings).

## Non-work full days & UI

- `non-work-full` is a new DayStatus value used to clearly show days that are entirely non-work for the employee (8h of non-work). It's detected by `computeDayStatus`.
- Styling/icons are in `statusIcons.utils.js` and `tileStyles.js`. Tile styling gives `non-work-full` a neutral/disabled background to visually distinguish full non-work days from partial absences.
- Staged entries: the calendar prefers staged visual states when `stagedMeta` or `stagedMap` indicates a change. If you want staged-non-work-full to show the same icon + a glow instead of a generic staged glow, update the staged classifier in `WorkCalendar` to emit a composite status (e.g. `staged-non-work-full`) and add a mapping in `statusIcons.utils.js` / `tileStyles.js`.

## Aggregates & HR/ADMIN

- `TimesheetAggregatesMock.getEmployeeMonthSummary(employeeId, year, month, opts = {})`
  - By default behaves as before and returns `{ total, commesse }`.
  - If `opts.includeNonWork === true` it adds `nonWork: { total, FERIE, MALATTIA, PERMESSO, ROL }`.
  - `nonWork` is not injected into the `commesse` array; it's attached as an additional property to preserve backwards compatibility.

- `TimesheetAggregatesMock.getGlobalMonthByCommessa(params, opts = {})`
  - When `opts.includeNonWork === true`, it returns the array of commessa rows with `.nonWork` attached to the array object.

- `TimesheetAbsencesMock` includes `ROL` in monthly and range totals (`totals` and `hoursPerType`). `getVacationBalances` remains FERIE-focused and does not expose extra properties by default.

## How to run locally

From the workspace root (the `frontend` is a subfolder):

```powershell
cd frontend
npm install    # if needed
npm run dev     # start dev server
npm run build   # production build (used in CI/verification)
```

The build command was used to verify recent changes and should pass without errors.

## Extending or changing behaviour

- Adding a new non-work code
  - Update `NON_WORK_CODES` in `src/domains/timesheet/hooks/utils/timesheetModel.js`.
  - Update mocks (`ProjectMock`, `TimesheetAbsencesMock`, `TimesheetAggregatesMock`) if the mock logic needs to count the new code in summaries.
  - Update UI icons / legends: `statusIcons.utils.js`, `TileLegend` (if present) and `tileStyles.js` for colors.

- Changing staged visuals to prefer non-work icons
  - Edit the staged classifier in `WorkCalendar.jsx` (the `stagedStatusMap` computation).
  - Produce a composite staged status (e.g. `staged-non-work-full`) and add corresponding icon/style entries.

## Testing suggestions

- Unit tests for `computeDayStatus` covering:
  - pure work day sums (complete/partial)
  - non-work full day detection (mixtures of FERIE/ROL/PERMESSO summing to 8)
  - MALATTIA exclusive detection

- Integration tests that assert:
  - Staging and `WorkCalendar` visual precedence (staged vs computed)
  - `TimesheetAggregatesMock` returns `nonWork` only when `opts.includeNonWork === true`

## Debugging tips

- Seeds and mocks log one-time warnings when they auto-correct incoherent generated data; check browser console for these messages.
- To inspect staged state at runtime open React devtools and inspect the `Timesheet` provider state; `stagedMap` and `stagedMeta` live in the timesheet context.
- To reproduce mock validation errors, call `ProjectMock.updateOperaioPersonalDay` directly (or via the UI) with an invalid draft (e.g. MALATTIA + other codes). The mock throws an Error with an Italian message describing the validation failure.

## Contribution notes

- Keep API shapes backward-compatible. New information should be optional (e.g. `opts.includeNonWork`) and not remove existing fields.
- Prefer domain-level constants (`NON_WORK_CODES`, `isWorkCode`) rather than scattered string literals.
- Add tests when changing business rules.

---

If you want, I can:
- Add a small unit test file for `computeDayStatus` and run the test runner.
- Expand this doc with diagrams (SVG) or a short developer quickstart.
- Generate a `docs/index.md` to surface this file in a docs site.

Which follow-up would you like next?