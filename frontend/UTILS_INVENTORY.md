# Utils Inventory

This document lists utility modules found in the frontend source and describes their exported symbols, purpose, and suggested reuse points.

---

## Calendar utilities

Path: `src/Components/Calendar/utils`
Barrel: `src/Components/Calendar/utils/index.js` (exports from the files below)

- `tileStyles.js`
  - Exports:
    - `getTileSx(theme, options)`
  - Purpose: produces theme-aware MUI `sx` style object for calendar tiles. Handles selected/holiday/weekend/out-of-month/status-based styling.
  - Suggested reuse: any calendar tile or date cell component (e.g. `DayEntryTile.jsx`, `WorkCalendar.jsx`, `EmployeeMonthGrid.jsx`). Import via `@components/Calendar/utils` or relative path.

- `dayStatus.js`
  - Exports:
    - `computeDayStatus({ dayData, dayOfWeek, segnalazione, dateStr, isHoliday, today })`
  - Purpose: derives day state (e.g., `ferie`, `malattia`, `permesso`, `complete`, `partial`, `future`, `admin-warning`) and flags for display such as `showHours` and `iconTopRight`.
  - Suggested reuse: calendar rendering components to determine how to draw a day's UI and whether to show hours or an icon.

- `dateUtils.js`
  - Exports:
    - `parseISO(dateStr)` → Date|null
    - `isWeekend(date)` → boolean
    - `makeDateOnly(date)` → Date|null
  - Purpose: safe date parsing and day-only operations to avoid timezone/time-of-day bugs.
  - Suggested reuse: any components or hooks that need reliable day comparisons or weekend checks.

- `monthNames.js`
  - Exports:
    - `shortMonth` (array)
    - `fullMonth` (array)
    - `formatMonthShortLabel(dateObj, labelArr, baseYear)`
  - Purpose: month name constants and label formatting helper.
  - Suggested reuse: `MonthSelector.jsx`, `WorkCalendar` headers, or any month label UI.

---

## Timesheet utils (canonical)

- `src/domains/timesheet/hooks/utils/computeDayUsed.js`
  - Exports: `computeDayUsed(all, current, mode, editIndex)` (named + default)
  - Purpose: sum hours excluding the currently edited entry (index/ref/id/fallback comparison guards)
  - Reuse: `DayEntryPanel`, `useTimesheetEntryEditor`, admin editing flows.

- `src/domains/timesheet/hooks/utils/semanticTimesheet.js`
  - Exports: `normalizeRecord`, `semanticEqualArray`, `semanticHash`, `semanticEqual`
  - Purpose: lightweight structural equality & hashing for day records (staging diff short-circuit).

- `src/domains/timesheet/hooks/utils/timesheetModel.js`
  - Exports: `computeDayDiff`, `summarizeDayDiff`
  - Purpose: classify staged vs base day changes for diff panels & badges.

- `src/domains/timesheet/hooks/utils/roleCapabilities.js`
  - Exports: `roleCapabilities`, `getRoleCapabilities`, `rolesWithPersonalEntries`, `filterEntriesByRole`, `filterEntriesByRoleWithEdit`, `filterAnalyticsEntries`, `partitionEntries`
  - Purpose: role-based visibility & edit semantics for multi-employee contexts / analytics filters.

- (Optional aggregation) If resurrected: place `aggregateAbsences` under `src/domains/timesheet/hooks/utils/` when needed; legacy path removed.

---

## Badge & Avatar utilities

- `src/Components/BadgeCard/utils/badgeUtils.js`
  - Exports:
    - `COMPANY_LOGOS` (frozen mapping)
    - `resolveBadgeData({ props, user })`
  - Purpose: normalize badge data, choose logo fallbacks and holder/company identification.
  - Suggested reuse: `BadgeCard/Badge.jsx`, header badges, or anywhere a company-user badge is rendered.

- `src/Components/Avatar/utils/color.js`
  - Exports:
    - `stringToColor(str)`
    - `darkenColor(hex, factor)`
  - Purpose: deterministic color generation from strings and simple color darkening.
  - Suggested reuse: avatar components (`AvatarInitials.jsx`, `CustomAvatarGroup.jsx`) or any component that wants deterministic color from text.

---

## Sidebar utilities

- `src/Components/Bars/sidebarUtils.js`
  - Exports:
    - `getInitials(name, max = 2)`
    - `renderIcon(IconOrElement, sx)`
    - `computeSidebarItemColors(theme, selected)`
  - Purpose: small helpers for sidebar rendering, initials extraction, safe icon rendering and consistent color derivation.
  - Suggested reuse: `Sidebar.jsx`, `SidebarItem.jsx`, `PageHeader.jsx`.

---

## Misc / other helpers found

- `src/mocks/*` — mock data & APIs
  - Files: `ProjectMock.js`, `UsersMock.js`, `EmployeeCommesseMock.js`, `employeeTasksMock.js`, `TimesheetAggregatesMock.js`, `handlers.js`, `browser.js`.
  - Purpose: mock datasets and async functions used by `useTimesheetApi` and other parts of the app.
  - Suggested reuse: test harnesses, local development; import via `@mocks/*` (project uses `@mocks` alias)

---

## Notes and recommendations

- Prefer importing from canonical barrels/aliases when available:
  - Calendar utils: `@/Components/Calendar/utils` (or future domain relocation)
  - Timesheet domain hooks & utils: `@domains/timesheet/hooks` (barrel) or specific `@domains/timesheet/hooks/utils/*`
  - Mocks: `@mocks/*`

- Tests (recommended):
  - `computeDayUsed` (edit, add, id vs no-id, reference exclusion)
  - `semanticHash` / `semanticEqualArray` (collision/basic equality)
  - `computeDayDiff` (all operation classifications)
  - `validateDayHours` (limit boundaries, mixed personal/work hours)

- Consolidation:
  - All former `Hooks/Timesheet/*` helpers have been migrated or removed. Avoid reintroducing duplicate calendar logic—centralize through the calendar utils barrel.

- Backward compatibility:
  - Legacy shims removed; any reference to `Hooks/Timesheet` should be considered an error now.

---

Updated after refactor consolidation on 2025-10-06.
