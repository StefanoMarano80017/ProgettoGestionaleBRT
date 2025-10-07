## Progetto Gestionale – Architecture & Runtime Design

_Last updated: 2025-10-06 (post-legacy cleanup & shim removal)_

## Executive Overview
Domain‑centric modular frontend with strong separation of concerns:
```
App Shell (routing, layouts, providers)
  ├─ Domains (auth, timesheet, future placeholders)
  ├─ Shared UI Library (shared/components, dialogs, theme, hooks, utils)
  └─ Cross-Cutting Providers (AuthProvider, ThemeProvider)
```
Legacy `Components/`, context shims, and `_legacy_archive` have been fully purged. A pre‑build import checker enforces canonical paths.

## Scope
1. Layering & boundaries
2. Provider contracts
3. Timesheet domain models & flows
4. Utilities strategy
5. Import rules & enforcement
6. Migration recap
7. Testing strategy
8. Performance considerations
9. Open TODOs & governance

## Layered View
```
Presentation (Pages / Layouts)
 ├─ Login / Home (to be domain-scoped)
 ├─ DipendenteTimesheet
 └─ Coordinatore/Admin Timesheet

Shared Components
 ├─ Bars / Filters / BadgeCard / Dialogs / Calendar / Entries / TaskManager / Inputs
 └─ Theming (themes + hook)

Domain: Timesheet
 ├─ components/calendar, staging
 ├─ hooks/{calendar,dayEntry,staging,utils,validation}
 ├─ pages
 └─ services

Providers
 ├─ AuthProvider
 └─ ThemeProvider

Mocks (temporary data sources)
```

## Provider Contracts
### AuthProvider
```
value: {
  user: { id, username, roles[], azienda, ... } | null,
  token: string | null,
  isAuthenticated: boolean,
  roles: string[],
  login(username, password): Promise<{ user, token }>,
  logout(): void,
  hasRole(role: string): boolean
}
```
Invariants: `isAuthenticated === !!user && !!token`; login persists atomically.

### ThemeProvider
```
value: {
  mode: 'light' | 'dark',
  toggleTheme(): void,
  muiTheme: Theme
}
```
Invariants: persistent mode toggle; consumers use `useThemeContext` only.

## Timesheet Domain Models
### Base Data
```
TimesheetDataMap: { [employeeId]: { [dateKey: 'YYYY-MM-DD']: Record[] } }
Record: { commessa: string, ore: number, descrizione?: string }
```

### Staging State
```
StagingState.entries[empId][dateKey] = {
  employeeId, dateKey,
  base: Record[],      // frozen snapshot
  draft: Record[] | [] | null,
  op: 'create' | 'update' | 'delete' | 'noop',
  hashes: { base, draft },
  dirty: boolean
}
```

### Derived Meta & Diff
`useStagedMetaMap` → op per tile; `useStableMergedDataMap` → merged view for focused editing.
`DayDiff` surfaces semantic change type + per‑record inserts/updates/deletes.

## Core Flows (Condensed)
1. Login: form → `login()` → mock auth → context update → redirect.
2. Employee edit: load single employee → select day → edit → stage → confirm commit.
3. Multi-employee admin: load all → per selection open panel/dialog → stage per day → batch confirm.
4. Staging lifecycle: freeze base, classify op, rollback on cancel, purge on commit.
5. Visual separation: tiles show base + glow; editor uses merged base+draft only for active day/employee.

## Key Component Roles
| Component | Base? | Draft? | Writes Staging | Notes |
|-----------|-------|--------|----------------|-------|
| WorkCalendar | ✓ | ✗ | ✗ | Uses staged meta for glow |
| EmployeeMonthGrid | ✓ | ✗ | ✗ | Multi-employee base grid |
| DayEntryPanel | via merged | ✓ | ✓ | Focused editor |
| StagedChangesPanel | via staging | ✓ | rollback/confirm | Diff + controls |
| DayEntryTile | ✓ | ✗ | ✗ | Visual op indicator |

## Invariants
- Base data immutable until commit.
- Staging `base` snapshot never mutates.
- `noop` retained for stability (filtered from payload).
- Diff building isolated (staging panel) to avoid per-tile overhead.

## Information Flow (Text)
```
Edit → stageDraft → stagingReducer
  ├─ StagedChangesPanel (diff list)
  ├─ useStagedMetaMap → Calendar/Grid (glow)
  └─ useStableMergedDataMap → Editor (merged view)

Confirm → build payload → apply (mock/real) → clear staging
```

## Migration Recap
| Phase | Action | Result |
|-------|--------|--------|
| 1 | Inventory & alias audit | Legacy surface mapped |
| 2 | Introduce shared/ | Centralized UI library |
| 3 | Move providers | `app/providers/*` canonical |
| 4 | Stub & rewire imports | Non-breaking transition |
| 5 | Barrel script upgrade | Correct default export handling |
| 6 | Import checker | Prevent regressions |
| 7 | Archive quarantine | Legacy isolated |
| 8 | Purge archive & shims | Clean final state |

## Import Rules (Enforced)
Blocked: `@/Components/`, `@/app/layouts/AuthContext`, `@/app/layouts/ThemeContext`, `@/Hooks/`.
Allowed patterns: `@/app/providers/*Provider`, `@shared/components/...`, `@shared/hooks/useThemeContext`, `@domains/<domain>/hooks/...`.
Guidelines: No cross-domain deep imports; promote utils only when reused across domains; keep barrels acyclic.

## Utilities Strategy
| Category | Location | Promotion Rule |
|----------|----------|----------------|
| Domain semantic | domains/timesheet/hooks/utils | Stay unless ≥2 domains need it |
| Generic date range | shared/utils | Already shared |
| Component-scoped helper | component dir (utils/) | Migrate upward if reused |

## Testing Strategy (Planned)
| Target | Type | Purpose |
| stagingReducer | Unit | Op transitions & invariants |
| computeDayUsed / semanticTimesheet | Unit | Pure calc correctness |
| timesheetModel | Unit + snapshot | Structural guarantees |
| roleCapabilities | Unit | Role logic stability |
| useStagedMetaMap | Hook test | Derived map integrity |
| DayEntryPanel staging flow | Integration | End-to-end UX semantics |

Stack: Vitest + React Testing Library.

## Performance Considerations
- Memoize derived maps; stable provider values.
- Defer heavy diffs until panel open.
- Avoid merged map computation for all employees at once.

## Open TODOs
- Domain-ize `Pages/` (auth/appShell split).
- Real backend integration for staging commit.
- Accessibility: dialog focus return + ARIA enrichment.
- Add test matrix (above) to CI.

## Governance (Proposed)
| Area | Owner (TBD) | Notes |
|------|-------------|-------|
| Auth / Providers | <assign> | Token refresh, security |
| Timesheet Domain | <assign> | Performance & correctness |
| Shared UI | <assign> | Design consistency |
| Tooling / Scripts | <assign> | Fast break fix |

## Change Log (Doc)
- Rewritten for post-clean state.
- Added provider contracts & import enforcement.
- Added migration table & test strategy.
- Consolidated legacy removal narrative.

_End of Architecture Overview_


