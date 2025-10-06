# Timesheet Domain Hooks

Canonical home for all timesheet-related React hooks after the 2025-10 refactor.

## Structure
```
src/domains/timesheet/hooks/
  calendar/        # Calendar model & day status (month/year, grid rows, holidays, day status/color, legend)
  dayEntry/        # Single-day editing helpers (useDayEntryDerived, deletion confirm, unified entry editor)
  staging/         # Staging reducer, provider, selectors, facade (useTimesheetStaging, useStagedMetaMap)
  utils/           # Pure helpers (semanticTimesheet, computeDayUsed, timesheetModel, roleCapabilities)
  validation/      # Validation logic (e.g. validateDayHours)
  useTimesheetData.js          # Unified data loader (scope: all | list | single)
  useEmployeeTimesheetLoader.js
  useStableMergedDataMap.js
  useMonthCompleteness.js
  useDayAndMonthDetails.js
  useTimesheetFilters.js
  useSegnalazione.js
  useTimesheetApi.js
  useReferenceData.js
  useEmployeeMonthGridRows.js
  TimesheetProvider.jsx        # Provider + context hook exports
  index.js                     # Barrel exporting canonical hooks
```

## Import Guidelines
- Prefer the barrel:
  ```js
  import { useTimesheetStaging, useTimesheetData, useTimesheetEntryEditor } from '@domains/timesheet/hooks';
  ```
- For tree-shaking sensitive code (rare), you can deep import a specific file, e.g.:
  ```js
  import { computeDayDiff } from '@domains/timesheet/hooks/utils/timesheetModel.js';
  ```
- Do NOT import from removed legacy paths like `hooks/Timesheet/...`.

## Key Concepts
- **Base vs Draft**: Base data (from provider) is immutable; draft lives in staging until confirmed.
- **Semantic Hashing**: `semanticHash(records)` gives a quick content signature to prevent redundant staging cycles.
- **Diff Model**: `computeDayDiff(base, draft)` classifies operations: create/update/delete/mixed/no-op.
- **Merged Views**: Only editors (`DayEntryPanel`, admin detail panels) compose base + draft; calendar/grid tiles stay on base + glow metadata.

## Recommended Hook Usage
| Need | Hook |
|------|------|
| Load initial employee(s) timesheet data | `useTimesheetData` (inside `TimesheetProvider`) |
| Month/year navigation state | `useCalendarMonthYear` |
| Build calendar day cells | `useCalendarDays`, `useCalendarGridRows` |
| Employee × Month matrix rows | `useEmployeeMonthGridRows` |
| Single-day derived data (records, segnalazione, total) | `useDayEntryDerived` |
| Unified per-day entry editor state | `useTimesheetEntryEditor` |
| Stage / manage drafts | `useTimesheetStaging` + selectors (`useStagedMetaMap`) |
| Merge staged overlay for active employee view | `useStableMergedDataMap` |
| Completeness (month) | `useMonthCompleteness` |
| Day + month detail bundle | `useDayAndMonthDetails` |
| Filters (search / azienda / commessa) | `useTimesheetFilters` |
| Reference data (commesse, companies, etc.) | `useReferenceData` |
| Segnalazione data | `useSegnalazione` |

## Adding a New Hook
1. Place it under the appropriate subfolder (or root if cross-cutting).
2. Export it from `index.js` (canonical barrel).
3. Add a brief JSDoc or inline comment with input/output contract.
4. If it reads provider context, fail fast with a clear error if provider missing (or offer optional variant `useOptional...`).

## Testing Suggestions
- Use pure utility tests for: `computeDayDiff`, `semanticEqualArray`, `computeDayUsed`, validation.
- Reducer tests: staging transitions (create → update → noop → rollback → confirm).
- Hook tests (React Testing Library): `useTimesheetEntryEditor` (add/edit/delete + validation edge cases).

## Anti-Patterns (Avoid)
- Mutating `dataMap` directly outside provider helpers (always stage first, then commit).
- Passing entire `dataMap` into fine-grained components; slice early.
- Recomputing merged overlays for all employees—only merge for the active editing context.
- Deep imports from non-canonical legacy paths (they now throw build errors if reintroduced).

## Migration Notes
The legacy tree `hooks/Timesheet/` was removed on 2025-10-06. Any branches referencing it must be rebased and updated to the new structure. See `ARCHITECTURE.md` for the full refactor rationale.

## Future Enhancements
- Add optional suspense wrappers for data loading states.
- Introduce concurrency tokens (hash of base snapshot) into staging commit payloads.
- Expand role capabilities (e.g., read vs write splits) with memoized selectors.

---
Maintainer: (Assign team/owner)
