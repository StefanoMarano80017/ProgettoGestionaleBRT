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

## Timesheet utils

- `src/Hooks/Timesheet/utils/computeDayUsed.js`
  - Exports:
    - `computeDayUsed(all, current, mode, editIndex)` (named + default)
  - Purpose: Returns the sum of hours in `all` excluding the `current` edited entry. Exclusion checks by index, reference, id, and as fallback compares `commessa`, `ore`, and `descrizione`.
  - Suggested reuse: any Edit dialog or editor that must compute "hours used today excluding the entry being edited." (e.g. EditEntryDialog callers, DetailsPanel, DayEntryPanel, OperaioEditor, Dashboard pages)

- `src/Hooks/Timesheet/aggregation/aggregateAbsences.js`
  - Exports:
    - `aggregateAbsences(data, year, monthIndex)` (named + default)
  - Purpose: compute monthly days & hours for special codes: `FERIE`, `MALATTIA`, `PERMESSO`.
  - Suggested reuse: monthly summaries and aggregation hooks or reports.

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
  - Calendar tools: `@components/Calendar/utils` or `src/Components/Calendar/utils`.
  - Timesheet utils: `@hooks/Timesheet/utils/computeDayUsed`.
  - Mocks: `@mocks/ProjectMock`, `@mocks/UsersMock`, etc.

- Tests: Add unit tests for pure utils (high ROI):
  - `computeDayUsed` (happy paths + edit index + reference equality + idless fallback)
  - `validateDayHours` (if present under `src/Hooks/Timesheet/validation`) — ensure daily limits & edge cases.

- Consolidation opportunities:
  - There are multiple small helper functions spread across `Hooks/Timesheet/calendar/*` and `Components/Calendar/utils/*` that should remain in the calendar utils barrel. Ensure all calendar components use the barrel to avoid accidental duplication.

- Backward compatibility:
  - A small shim (`Components/Calendar/computeDayUsed.js`) was left in place to avoid breaking legacy imports; consider removing it once all imports use the canonical `@hooks/Timesheet/utils/computeDayUsed` path.

---

Generated by automated repository scan on OCT 04 2025.
