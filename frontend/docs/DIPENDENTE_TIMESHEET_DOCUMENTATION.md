# Dipendente Timesheet Page - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Hierarchy](#component-hierarchy)
4. [Data Flow](#data-flow)
5. [Core Components](#core-components)
6. [Hooks & State Management](#hooks--state-management)
7. [Features](#features)
8. [User Interactions](#user-interactions)
9. [Styling & Theming](#styling--theming)
10. [Technical Decisions](#technical-decisions)

---

## Overview

The **Dipendente Timesheet Page** is the primary interface for employees to view and manage their work hours. It provides a comprehensive view of:
- Daily work calendar with visual status indicators
- Commesse (project assignments) dashboard with statistics
- Personal absence tracking (Ferie, Malattia, Permesso, ROL)
- Time entry creation and editing
- Badge status display

**File Location**: `src/domains/timesheet/pages/DipendenteTimesheet.jsx`

**Route**: `/dipendente` or `/timesheet` (via TimesheetRouter)

---

## Architecture

### Design Pattern: **Container-Presenter with Context**

```
┌─────────────────────────────────────────┐
│   DipendenteTimesheet (Container)       │
│   - Provides TimesheetProvider context  │
│   - Determines effectiveId from auth    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   InnerDipendente (Smart Component)     │
│   - Hooks orchestration                 │
│   - Data loading & computation          │
│   - Event handlers                      │
│   - State management                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   TimesheetMainLayout (Presenter)       │
│   - Two-column bento layout             │
│   - Dashboard + Calendar arrangement    │
│   - Pure presentation logic             │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
 ┌───────────┐  ┌────────────┐
 │ Dashboard │  │  Calendar  │
 │ Component │  │  Component │
 └───────────┘  └────────────┘
```

### Layer Separation

1. **Context Layer** (`TimesheetProvider`)
   - Global timesheet state management
   - Data loading orchestration
   - Staging (uncommitted changes) management

2. **Smart Layer** (`InnerDipendente`)
   - Hooks composition
   - Derived state computation
   - Business logic
   - Event handling

3. **Presentation Layer** (`TimesheetMainLayout`)
   - Layout structure
   - Component composition
   - Visual presentation
   - No business logic

4. **Shared Components**
   - Reusable UI elements
   - Calendar tiles, dashboard charts
   - Dialogs and panels

---

## Component Hierarchy

```
DipendenteTimesheet (Root)
├── TimesheetProvider (Context)
│   └── InnerDipendente (Smart Component)
│       ├── Box (Container)
│       │   └── Container (MUI)
│       │       ├── TimesheetMainLayout
│       │       │   ├── TimesheetPageHeader
│       │       │   │   ├── BadgeCard
│       │       │   │   └── Status Chip
│       │       │   │
│       │       │   └── Two-Column Bento Layout
│       │       │       ├── LEFT COLUMN: CommesseDashboard
│       │       │       │   ├── Header (Gradient)
│       │       │       │   ├── PieChart (MUI X Charts)
│       │       │       │   ├── Riepilogo Box
│       │       │       │   │   ├── Period Selector (Sett|Mese|Anno)
│       │       │       │   │   ├── Absence Stats Cards
│       │       │       │   │   │   ├── Ferie (pink)
│       │       │       │   │   │   ├── Malattia (green)
│       │       │       │   │   │   ├── Permesso (blue)
│       │       │       │   │   │   └── ROL (blue)
│       │       │       │   │   └── Legenda Grafico
│       │       │       │   │       └── Color dots + commessa names
│       │       │       │   │
│       │       │       │   └── Commesse List
│       │       │       │       └── Commessa Items
│       │       │       │           ├── Color border (left 4px)
│       │       │           ├── Color dot (12px)
│       │       │       │           ├── Name + Stats
│       │       │       │           └── Action button
│       │       │       │
│       │       │       └── RIGHT COLUMN: WorkCalendar
│       │       │           ├── CalendarHeader
│       │       │           │   ├── Navigation (< >)
│       │       │           │   ├── Month/Year Display
│       │       │           │   └── Date Picker Button
│       │       │           │
│       │       │           ├── StagedChangesCompact
│       │       │           │   └── Pending changes indicator
│       │       │           │
│       │       │           ├── Week Days Header
│       │       │           │   └── Lu Ma Me Gi Ve Sa Do
│       │       │           │
│       │       │           ├── Calendar Grid (6 weeks × 7 days)
│       │       │           │   └── DayEntryTile (×42)
│       │       │           │       ├── Day number
│       │       │           │       ├── Status icon
│       │       │           │       ├── Hours badge
│       │       │           │       └── Staged indicator
│       │       │           │
│       │       │           └── TileLegend
│       │       │               └── Status icons with tooltips
│       │       │
│       │       └── DayEntryDialog (Modal)
│       │           ├── Dialog Header
│       │           │   ├── Employee name
│       │           │   ├── Date
│       │           │   └── Close button
│       │           │
│       │           └── DayEntryPanel
│       │               ├── Absence Editor (Ferie/Malattia/etc)
│       │               ├── Entry List (work entries)
│       │               │   └── EntryListItem (×n)
│       │               │       ├── Commessa chip
│       │               │       ├── Hours input
│       │               │       ├── Description
│       │               │       └── Delete button
│       │               │
│       │               ├── Add Entry Button
│       │               └── Action Buttons
│       │                   ├── Cancel
│       │                   └── Save/Stage
```

---

## Data Flow

### 1. **Initial Load**

```
User navigates to /dipendente
        ↓
DipendenteTimesheet mounts
        ↓
TimesheetProvider initializes
        ├── Creates global context
        └── Initializes staging store
        ↓
InnerDipendente renders
        ├── useEmployeeTimesheetLoader executes
        │   ├── Fetches employee timesheet data
        │   └── Stores in context.dataMap
        │
        ├── useReferenceData executes
        │   ├── Fetches assigned sottocommesse
        │   └── Returns commesseList
        │
        └── useBadgeData executes
            ├── Calculates badge status
            └── Returns badgeData
        ↓
Components render with data
```

### 2. **Data Transformation Pipeline**

```
Raw Data (from mock/API)
        ↓
Context Storage (dataMap)
        ↓
Staging Layer (uncommitted changes)
        ↓
useStableMergedDataMap
        ├── Merges staged + persisted data
        └── Returns mergedData { dateKey: [entries] }
        ↓
Presentation Components
        ├── CommesseDashboard (aggregate stats)
        └── WorkCalendar (day-by-day view)
```

### 3. **User Edit Flow**

```
User double-clicks a day
        ↓
handleDayDoubleClick(day)
        ├── setSelectedDay(day)
        └── dayEditor.openEditor(employeeId, day)
        ↓
DayEntryDialog opens
        ├── Shows existing entries for that day
        └── User edits/adds entries
        ↓
User clicks "Save" or "Stage"
        ↓
staging.stageChange(...)
        ├── Stores in staging map
        └── Triggers re-render
        ↓
useStagedMetaMap updates
        ├── Calculates staged status per date
        └── Returns { dateKey: 'create'|'update'|'delete' }
        ↓
Calendar tiles show staged indicator
        ↓
User commits/discards via StagedChangesCompact
        ├── Commit → Persists to backend
        └── Discard → Removes from staging
```

---

## Core Components

### 1. DipendenteTimesheet (Root Container)

**Location**: `src/domains/timesheet/pages/DipendenteTimesheet.jsx`

**Purpose**: Entry point, provides context and determines employee ID

**Code**:
```jsx
export default function DipendenteTimesheet({ employeeId: propEmployeeId }) {
  const { user } = useAuth() || {};
  const effectiveId = propEmployeeId || user?.id || 'emp-001';
  
  return (
    <TimesheetProvider scope="single" employeeIds={[effectiveId]}>
      <InnerDipendente employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
```

**Responsibilities**:
- ✅ Authenticate user and get employee ID
- ✅ Provide TimesheetProvider context
- ✅ Delegate to InnerDipendente

**Props**:
- `employeeId` (optional): Override employee ID (for testing/admin view)

---

### 2. InnerDipendente (Smart Component)

**Purpose**: Orchestrates hooks, manages state, handles events

**Key Hooks**:
```jsx
// Context & Staging
const ctx = useTimesheetContext();          // Global timesheet state
const staging = useTimesheetStaging();      // Staging store (uncommitted changes)
const dayEditor = useDayEditor();           // Day editor dialog state

// Data Loading
useEmployeeTimesheetLoader(employeeId);     // Loads timesheet data into context

// State
const [selectedDay, setSelectedDay] = useState(null);
const [period, setPeriod] = useState('month');

// Data Computation
const { mergedData } = useStableMergedDataMap({
  dataMap: ctx?.dataMap || {},
  staging,
  employeeId,
  mode: 'single'
});

// Reference Data
const { commesse: commesseList, loading: commesseLoading } = useReferenceData({
  commesse: true,
  employeeId
});

// Badge Status
const badgeData = useBadgeData(employeeId, isBadgiatoToday);
```

**Event Handlers**:
```jsx
const handleDayDoubleClick = (day) => {
  setSelectedDay(day);
  dayEditor.openEditor(employeeId, day);
};
```

**Computed Values**:
```jsx
// Today's badge status
const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
const isBadgiatoToday = useMemo(
  () => Boolean(mergedData?.[todayKey]?.length),
  [mergedData, todayKey]
);

// Staged changes metadata
const stagedMetaAll = useStagedMetaMap(staging);
const stagedMeta = useMemo(() => stagedMetaAll[employeeId] || {}, [stagedMetaAll, employeeId]);
```

---

### 3. TimesheetMainLayout (Presenter)

**Location**: `src/domains/timesheet/components/TimesheetMainLayout.jsx`

**Purpose**: Layout structure, two-column bento design

**Layout Structure**:
```jsx
<Box> (Container)
  <TimesheetPageHeader /> (Badge + Status)
  
  <Box> (Two-column flex)
    {/* LEFT: Dashboard */}
    <Box flex="1 1 600px" height={850px}>
      <CommesseDashboard />
    </Box>
    
    {/* RIGHT: Calendar */}
    <Box width={420px} height={850px}>
      <WorkCalendar />
    </Box>
  </Box>
</Box>
```

**Props** (13 total):
```typescript
{
  employeeId: string;              // Employee identifier
  mergedData: Object;              // Merged timesheet data
  selectedDay: string;             // Currently selected date
  onDaySelect: Function;           // Day selection handler
  onDayDoubleClick: Function;      // Day edit handler
  commesseList: Array;             // Assigned sottocommesse
  commesseLoading: boolean;        // Loading state
  stagedMeta: Object;              // Staged changes metadata
  missingPrevSet: Set;             // Incomplete previous days
  period: 'week'|'month'|'year';   // Dashboard period
  refDate: Date;                   // Reference date for period
  onPeriodChange: Function;        // Period change handler
  badgeData: Object;               // Badge information
}
```

**Responsibilities**:
- ✅ Bento layout (dashboard + calendar side-by-side)
- ✅ Responsive design (stacks on mobile)
- ✅ Equal heights (850px) for visual harmony
- ✅ Gap spacing (24px) for breathing room

---

### 4. CommesseDashboard

**Location**: `src/shared/components/DipendenteHomePage/CommesseDashboard.jsx`

**Purpose**: Visualize commessa hours, absences, and statistics

**Sections**:

#### A. Header (Gradient)
```jsx
<Box gradient background>
  <Typography>Ore Lavorate</Typography>
  <Typography>Periodo: {period}</Typography>
  <Chip>Status</Chip>
</Box>
```

#### B. PieChart (MUI X Charts)
```jsx
<PieChart
  series={[{
    data: pieData,  // [{ id, value, label, color }]
    innerRadius: 30,
    outerRadius: 100,
    paddingAngle: 2,
    cornerRadius: 4
  }]}
/>
```

**Color Generation**: Uses hash-based algorithm optimized for sottocommessa work types (DL, INST, PROG, etc.)

#### C. Riepilogo Box (Statistics)
```jsx
<Box gradient header>
  <Typography>Riepilogo</Typography>
  <Typography>{periodDisplay}</Typography>
  <ButtonGroup>
    <Button>Sett</Button>
    <Button>Mese</Button>
    <Button>Anno</Button>
  </ButtonGroup>
</Box>

{/* Absence Stats */}
<Stack spacing={0.75}>
  {/* Ferie */}
  <Box card>
    <BeachAccessIcon /> Ferie
    <Typography>{days}g • {hours}h</Typography>
  </Box>
  
  {/* Malattia, Permesso, ROL */}
  ...
</Stack>

{/* Legenda Grafico */}
<Box>
  {pieData.map(item => (
    <Box>
      <ColorDot color={item.color} />
      <Typography>{item.label}</Typography>
      <Typography>{item.value}h</Typography>
    </Box>
  ))}
</Box>
```

#### D. Commesse List
```jsx
{listStats.map(stat => (
  <Box
    borderLeft={`4px solid ${getCommessaColor(stat.commessa)}`}
    hover effects
  >
    <ColorDot color={getCommessaColor(stat.commessa)} />
    <Typography>{stat.commessa}</Typography>
    <Typography>{stat.days} giorni</Typography>
    <Chip>{stat.total}h</Chip>
    <Chip>{stat.total > 0 ? 'Attiva' : 'Chiusa'}</Chip>
    <IconButton><OpenInNewIcon /></IconButton>
  </Box>
))}
```

**Data Computations**:

1. **listStats** (useMemo):
   ```javascript
   - Creates Map of all assigned commesse
   - Iterates data entries within period range
   - Aggregates: total hours, days worked, last date
   - Filters by active/closed based on commesseFilter
   - Returns sorted array
   ```

2. **chartData** (useMemo):
   ```javascript
   - Sums hours per commessa in period
   - Filters out 0-hour commesse
   - Maps to PieChart format with colors
   - Returns { pieData, labels, values }
   ```

3. **riepilogo** (useMemo):
   ```javascript
   - Checks for __monthlySummary (optimized path)
   - Falls back to manual aggregation
   - Counts days + hours for: FERIE, MALATTIA, PERMESSO, ROL
   - Avoids double-counting days (seen Set per day)
   ```

**Period Switching**:
```jsx
<ButtonGroup>
  <Button onClick={() => onPeriodChange('week')}>Sett</Button>
  <Button onClick={() => onPeriodChange('month')}>Mese</Button>
  <Button onClick={() => onPeriodChange('year')}>Anno</Button>
</ButtonGroup>
```

**Color Highlighting**:
- Left border: 4px solid color
- Color dot: 12px with glow shadow
- Background tint on hover
- Smooth transitions (0.2s ease-in-out)

---

### 5. WorkCalendar

**Location**: `src/domains/timesheet/components/calendar/WorkCalendar.jsx`

**Purpose**: Monthly calendar view with day entry tiles

**Architecture**: Container-View-Controller pattern

```
WorkCalendar (Wrapper)
├── WorkCalendarContainer (Smart)
│   ├── Hooks orchestration
│   ├── Data preparation
│   └── Event handling
└── WorkCalendarView (Presenter)
    ├── CalendarHeader
    ├── StagedChangesCompact
    ├── Week days header
    ├── Calendar grid
    └── TileLegend
```

**Key Features**:

1. **Month Navigation**:
   ```jsx
   const { currentMonth, currentYear, setMonthYear } = useCalendarMonthYear();
   ```

2. **Day Status Computation**:
   ```jsx
   const { status, showHours } = computeDayStatus({
     dayData,
     dayOfWeek,
     segnalazione,
     dateStr,
     isHoliday,
     today
   });
   ```

3. **Staged Changes Visualization**:
   ```jsx
   const stagedStatusMap = useVisibleStagedStatusMap({
     stagedMeta,
     stagedMap,
     tsCtx,
     activeEmployeeId,
     visibleDateKeys
   });
   ```

**Calendar Tiles** (DayEntryTile):
```jsx
<DayEntryTile
  dateStr={dateStr}
  day={day}
  isSelected={isSelected}
  status={status}              // 'complete', 'incomplete', 'absent', etc.
  showHours={showHours}
  totalHours={totalHours}
  onClick={onDayClick}
  onDoubleClick={onDayDoubleClick}
  tooltipContent={tooltipContent}
  stagedStatus={stagedStatus}  // 'staged-insert', 'staged-update', etc.
  stagedOp={stagedOp}          // 'create', 'update', 'delete'
/>
```

**Tile Colors** (based on status):
- Complete: Green
- Incomplete: Yellow
- Absent: Pink
- Empty: Gray
- Holiday: Blue outline
- Today: Bold border

**Interactions**:
- Single click: Select day (blue border)
- Double click: Open DayEntryDialog
- Hover: Tooltip with details
- Keyboard: Arrow navigation

---

### 6. DayEntryDialog

**Location**: `src/domains/timesheet/components/calendar/DayEntryDialog.jsx`

**Purpose**: Modal for editing day entries

**Structure**:
```jsx
<Dialog open={open} onClose={onClose}>
  <DialogTitle>
    {employeeName}
    <Typography>{date}</Typography>
  </DialogTitle>
  
  <DialogContent>
    <DayEntryPanel
      selectedDay={date}
      data={data}
      commesse={commesse}
      employeeId={employeeId}
      onDraftChange={handleDraftChange}
    />
  </DialogContent>
</Dialog>
```

**Workflow**:
1. User double-clicks day
2. Dialog opens with existing entries
3. User can:
   - Edit absence (Ferie/Malattia/etc)
   - Add/edit/delete work entries
   - Change hours and descriptions
4. User clicks "Save" or "Stage"
5. Changes committed to staging
6. Dialog closes
7. Calendar updates with staged indicator

---

### 7. DayEntryPanel

**Location**: `src/domains/timesheet/components/panels/DayEntryPanel.jsx`

**Purpose**: Edit interface for day entries

**Sections**:

#### A. Personal Absence Editor
```jsx
<PersonalAbsenceEditor
  dayType={absenceType}          // 'FERIE', 'MALATTIA', etc.
  hours={absenceHours}
  onDayTypeChange={handleDayTypeChange}
  onHoursChange={handleAbsenceHoursChange}
/>
```

#### B. Work Entries List
```jsx
{rows.map((row, idx) => (
  <EntryListItem
    key={idx}
    entry={row}
    commesse={commesse}
    onEdit={(updated) => handleRowEdit(idx, updated)}
    onDelete={() => handleRowDelete(idx)}
  />
))}
```

#### C. Add Entry Button
```jsx
<Button
  startIcon={<AddIcon />}
  onClick={handleAddRow}
  disabled={!canAddMore}
>
  Aggiungi Commessa
</Button>
```

#### D. Action Buttons
```jsx
<Button onClick={handleCancel}>
  Annulla
</Button>

<Button
  onClick={handleSave}
  variant="contained"
  disabled={!hasChanges || hasErrors}
>
  {autoStage ? 'Salva in Bozza' : 'Salva'}
</Button>
```

**Validation**:
```jsx
// Max hours per day
const maxHoursPerDay = 8;
const totalHours = absenceHours + rows.reduce((sum, r) => sum + r.ore, 0);
const isOverLimit = totalHours > maxHoursPerDay;

// Required fields
const hasEmptyCommessa = rows.some(r => !r.commessa);
const hasZeroHours = rows.some(r => r.ore <= 0);

// Error states
const hasErrors = isOverLimit || hasEmptyCommessa || hasZeroHours;
```

**Entry Format**:
```typescript
{
  commessa: string;           // Sottocommessa ID (e.g., "VS-25-01-DL")
  ore: number;                // Hours worked (1-8)
  descrizione: string;        // Optional description
}
```

---

## Hooks & State Management

### Context Hooks

#### 1. useTimesheetContext()
```jsx
const ctx = useTimesheetContext();
// Returns: { dataMap, month, year, loading, error, ... }
```

**Purpose**: Access global timesheet state

**Data Structure**:
```typescript
{
  dataMap: {
    [employeeId]: {
      [dateKey]: [
        { commessa, ore, descrizione },
        ...
      ],
      [dateKey_segnalazione]: string
    }
  },
  month: number,
  year: number,
  loading: boolean,
  error: Error | null
}
```

#### 2. useTimesheetStaging()
```jsx
const staging = useTimesheetStaging();
```

**Methods**:
```typescript
{
  stageChange: (employeeId, dateKey, entries) => void;
  getStagedEntry: (employeeId, dateKey) => entries | undefined;
  commitChanges: () => Promise<void>;
  discardChanges: (employeeId?, dateKey?) => void;
  hasStagedChanges: () => boolean;
  getStagedCount: () => number;
}
```

**Purpose**: Manage uncommitted changes (draft state)

#### 3. useDayEditor()
```jsx
const dayEditor = useDayEditor();
```

**State**:
```typescript
{
  isOpen: boolean;
  employeeId: string | null;
  date: string | null;
  openEditor: (employeeId, date) => void;
  closeEditor: () => void;
}
```

**Purpose**: Control DayEntryDialog visibility

### Data Loading Hooks

#### 4. useEmployeeTimesheetLoader(employeeId)
```jsx
useEmployeeTimesheetLoader(employeeId);
// Side effect: Loads data into context
```

**What it does**:
1. Fetches timesheet data for employee
2. Stores in context.dataMap
3. Handles loading/error states
4. Re-fetches on employeeId change

#### 5. useReferenceData(options)
```jsx
const { commesse, loading } = useReferenceData({
  commesse: true,
  personale: false,
  pmGroups: false,
  employeeId
});
```

**Returns**:
```typescript
{
  commesse: string[];          // Assigned sottocommesse IDs
  personale: Employee[];
  pmGroups: Group[];
  loading: boolean;
  error: Error | null;
}
```

### Computation Hooks

#### 6. useStableMergedDataMap(options)
```jsx
const { mergedData } = useStableMergedDataMap({
  dataMap: ctx?.dataMap || {},
  staging,
  employeeId,
  mode: 'single'
});
```

**Purpose**: Merge persisted data with staged changes

**Algorithm**:
```
for each date in persisted data:
  if staged has changes for this date:
    use staged data
  else:
    use persisted data

for each date in staged only:
  add to merged data
```

**Returns**:
```typescript
{
  mergedData: {
    [dateKey]: [entries],
    [dateKey_segnalazione]: string
  }
}
```

#### 7. useStagedMetaMap(staging)
```jsx
const stagedMetaAll = useStagedMetaMap(staging);
const stagedMeta = stagedMetaAll[employeeId] || {};
```

**Purpose**: Compute staged status for each date

**Returns**:
```typescript
{
  [employeeId]: {
    [dateKey]: 'create' | 'update' | 'delete'
  }
}
```

**Logic**:
```javascript
if (no persisted data && staged has data): 'create'
if (persisted data && staged has data): 'update'
if (persisted data && staged is empty): 'delete'
```

#### 8. useBadgeData(employeeId, isBadgiatoToday)
```jsx
const badgeData = useBadgeData(employeeId, isBadgiatoToday);
```

**Returns**:
```typescript
{
  type: 'oro' | 'argento' | 'bronzo' | 'base';
  label: string;
  description: string;
  streak: number;           // Consecutive days
  lastUpdate: string;
}
```

**Badge Logic**:
```javascript
if (streak >= 30 && completion >= 95%): 'oro'
if (streak >= 15 && completion >= 90%): 'argento'
if (streak >= 7 && completion >= 85%): 'bronzo'
else: 'base'
```

---

## Features

### 1. Period Switching
**Locations**: Week | Month | Year

**Implementation**:
```jsx
const [period, setPeriod] = useState('month');

<ButtonGroup>
  <Button 
    variant={period === 'week' ? 'contained' : 'outlined'}
    onClick={() => setPeriod('week')}
  >
    Sett
  </Button>
  <Button 
    variant={period === 'month' ? 'contained' : 'outlined'}
    onClick={() => setPeriod('month')}
  >
    Mese
  </Button>
  <Button 
    variant={period === 'year' ? 'contained' : 'outlined'}
    onClick={() => setPeriod('year')}
  >
    Anno
  </Button>
</ButtonGroup>
```

**Effects**:
- Dashboard recalculates statistics for new range
- PieChart updates
- Absence stats recalculate
- Commesse list updates

### 2. Staging System
**Purpose**: Allow users to draft changes before committing

**Flow**:
```
User edits day
     ↓
Changes saved to staging
     ↓
Calendar shows indicator (blue dot)
     ↓
StagedChangesCompact shows count
     ↓
User chooses:
  ├─ Commit → Save to backend
  └─ Discard → Remove from staging
```

**Visual Indicators**:
- Calendar tile: Blue corner indicator
- Compact bar: "3 modifiche in bozza"
- Different colors for create/update/delete

### 3. Color-Coded Sottocommesse
**Algorithm**: Hash-based with work type optimization

**Process**:
```
Input: "VS-25-01-DL"
       └─────┬─────┘
             Split on last hyphen
       ┌─────┴─────┐
    Prefix      Suffix
  "VS-25-01"     "DL"
       │           │
       │           └─ Heavy hash (80% weight)
       │                  ↓
       │              Determines color family
       │
       └─ Light hash (20% weight)
                ↓
            Adds variation
```

**Result**:
- All "DL" sottocommesse → Blue family
- All "INST" sottocommesse → Green family
- All "PROG" sottocommesse → Purple family
- Different projects → Different shades

**Benefits**:
- Visual grouping by work type
- Easy to spot patterns
- Consistent across application
- Semantic meaning (blue = DL work)

### 4. Absence Tracking
**Types**: FERIE | MALATTIA | PERMESSO | ROL

**Display**:
```jsx
<Box card backgroundColor={color}>
  <Icon fontSize={24} />
  <Typography>Type</Typography>
  <Typography>{days}g • {hours}h</Typography>
</Box>
```

**Colors** (matching legend):
- FERIE: #D8315B (pink)
- MALATTIA: #34C759 (green)
- PERMESSO: #0288d1 (blue)
- ROL: #0288d1 (blue)

**Aggregation**:
- Counts unique days (avoids double-counting)
- Sums total hours
- Updates per period change

### 5. Badge System
**Types**: 🥇 Oro | 🥈 Argento | 🥉 Bronzo | Base

**Criteria**:
```javascript
Oro:      30+ consecutive days, 95%+ completion
Argento:  15+ consecutive days, 90%+ completion
Bronzo:   7+ consecutive days, 85%+ completion
Base:     Default
```

**Display**:
```jsx
<BadgeCard
  type={badgeData.type}
  label={badgeData.label}
  description={badgeData.description}
  streak={badgeData.streak}
/>
```

**Update**: Real-time based on today's badge status

### 6. Responsive Design
**Breakpoints**:
- Mobile (`xs`): Stack dashboard over calendar
- Desktop (`md`+): Side-by-side bento layout

**Implementation**:
```jsx
<Box
  flexWrap={{ xs: 'wrap', md: 'nowrap' }}
>
  <Box width={{ xs: '100%', md: 600 }} />
  <Box width={{ xs: '100%', md: 420 }} />
</Box>
```

---

## User Interactions

### Navigation
| Action | Trigger | Result |
|--------|---------|--------|
| Click day | Mouse click on tile | Selects day (blue border) |
| Double-click day | Double click on tile | Opens DayEntryDialog |
| Previous month | Click `<` button | Calendar shows previous month |
| Next month | Click `>` button | Calendar shows next month |
| Date picker | Click calendar icon | Opens date picker popup |
| Period change | Click Sett/Mese/Anno | Dashboard updates for new range |

### Editing
| Action | Trigger | Result |
|--------|---------|--------|
| Add entry | Click "+ Aggiungi" | New row in entry list |
| Edit entry | Change fields in EntryListItem | Updates draft |
| Delete entry | Click delete icon | Removes entry from list |
| Save changes | Click "Salva in Bozza" | Stages changes |
| Cancel edits | Click "Annulla" or close dialog | Discards changes |

### Staging
| Action | Trigger | Result |
|--------|---------|--------|
| Stage changes | Save in DayEntryDialog | Adds to staging map |
| Commit staged | Click "Conferma" in StagedChangesCompact | Persists to backend |
| Discard staged | Click "Annulla" in StagedChangesCompact | Removes from staging |
| View staged count | Look at compact bar | Shows "X modifiche in bozza" |

---

## Styling & Theming

### Color Palette

**Primary Colors**:
- Primary Main: #1976d2 (Blue)
- Primary Dark: #115293
- Primary Light: #42a5f5

**Secondary Colors**:
- Secondary Main: #FF7700 (Orange)
- Secondary Dark: #E86800
- Secondary Light: #FF9933

**Custom Colors**:
- Custom Blue 1: #00A6FB
- Custom Blue 2: #006494
- Custom Blue 3: #003554
- Custom Pink: #D8315B
- Custom Green: #34C759

**Backgrounds**:
- Background Default: #fafafa (light) / #121212 (dark)
- Background Paper: #ffffff (light) / #1e1e1e (dark)
- Custom Background: #f5f5f5

### Typography

**Scale**:
```javascript
h5: 1.5rem (24px)      // Section headers
subtitle1: 1rem (16px) // Subsection headers
subtitle2: 0.9rem      // Compact headers
body1: 1rem            // Default body text
body2: 0.875rem        // Secondary text
caption: 0.75rem       // Labels, metadata
```

**Font Weights**:
- Regular: 400
- Medium: 500
- Semi-bold: 600
- Bold: 700

### Spacing System

**Material-UI Scale** (base: 8px):
```javascript
0.5 = 4px
0.75 = 6px
1 = 8px
1.5 = 12px
2 = 16px
3 = 24px
4 = 32px
```

**Layout Spacing**:
- Container padding: 32px (py: 4)
- Card padding: 16px (p: 2)
- Stack spacing: 12px (spacing: 1.5)
- Gap between columns: 24px (gap: 3)

### Shadows

**Elevation Levels**:
```css
Level 1: 0 1px 3px rgba(0,0,0,0.12)
Level 2: 0 2px 6px rgba(0,0,0,0.16)
Level 3: 0 4px 12px rgba(0,0,0,0.20)
Level 4: 0 6px 20px rgba(0,0,0,0.24)
```

**Custom Shadows**:
```css
/* Header gradient */
boxShadow: 0 4px 12px ${theme.palette.primary.main}25

/* Badge card */
boxShadow: 0 2px 8px rgba(0,0,0,0.1)

/* Calendar header */
boxShadow: 0 2px 8px rgba(0,0,0,0.15)
```

### Border Radius

**Standard Values**:
```javascript
Small: 4px (borderRadius: 0.5)
Default: 8px (borderRadius: 1)
Medium: 12px (borderRadius: 1.5)
Large: 16px (borderRadius: 2)
```

### Transitions

**Standard Timing**:
```css
Quick: 0.15s
Default: 0.2s
Smooth: 0.3s
```

**Easing Functions**:
```css
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
ease-out: cubic-bezier(0.0, 0, 0.2, 1)
ease-in: cubic-bezier(0.4, 0, 1, 1)
```

**Common Transitions**:
```css
all 0.2s ease-in-out
transform 0.2s ease-out
background-color 0.15s ease-in-out
```

---

## Technical Decisions

### 1. **Why Container-Presenter Pattern?**

**Decision**: Separate smart (InnerDipendente) from presentational (TimesheetMainLayout) components

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Easier testing (presenter is pure)
- ✅ Reusable presentation logic
- ✅ Better performance (fewer re-renders)

**Alternative Considered**: Single mega-component
- ❌ Harder to test
- ❌ Difficult to maintain
- ❌ Re-renders entire tree on any state change

### 2. **Why Context + Staging?**

**Decision**: Use TimesheetProvider context with separate staging layer

**Benefits**:
- ✅ Draft changes without backend calls
- ✅ Can review before committing
- ✅ Easy rollback (discard)
- ✅ Supports offline editing

**Alternative Considered**: Direct API calls on every edit
- ❌ Too many network requests
- ❌ No undo/redo capability
- ❌ Poor UX (slow feedback)

### 3. **Why useMemo for Data Computations?**

**Decision**: Memoize expensive aggregations (listStats, chartData, riepilogo)

**Benefits**:
- ✅ Prevents unnecessary recalculations
- ✅ Improves performance (large datasets)
- ✅ Stable references (prevents re-renders)

**Example**:
```jsx
const listStats = useMemo(() => {
  // Expensive: iterate all dates, aggregate hours
  return Array.from(map.values());
}, [assignedCommesse, data, range, commesseFilter]);
```

**Without useMemo**: Recalculates on every render (even unrelated state changes)

### 4. **Why Hash-Based Colors for Sottocommesse?**

**Decision**: Generate colors from sottocommessa ID using enhanced DJB2 hash

**Benefits**:
- ✅ Deterministic (same ID = same color always)
- ✅ Semantic grouping (DL = blues, INST = greens)
- ✅ Visually distinct work types
- ✅ No manual color assignment needed
- ✅ Scales to unlimited sottocommesse

**Alternative Considered**: Random colors
- ❌ Inconsistent across sessions
- ❌ No semantic meaning
- ❌ Potential collisions

**Alternative Considered**: Manual color map
- ❌ Doesn't scale
- ❌ Requires maintenance
- ❌ Limited color palette

### 5. **Why Bento Layout (Side-by-Side)?**

**Decision**: Dashboard and calendar at equal heights (850px) side-by-side

**Benefits**:
- ✅ Visual harmony (aligned tops/bottoms)
- ✅ No scrolling needed
- ✅ See both views simultaneously
- ✅ Modern aesthetic

**Alternative Considered**: Stacked layout
- ❌ Requires scrolling
- ❌ Can't compare dashboard and calendar
- ❌ Less efficient use of screen space

### 6. **Why 850px Fixed Height?**

**Decision**: Both dashboard and calendar at 850px (increased from 700px)

**Rationale**:
- Accommodates more commesse in list
- Shows full month calendar without scrolling
- Fits standard laptop screens (1080p+)
- Provides breathing room for content

**Responsive**: Falls back to 'auto' height on mobile

### 7. **Why Separate Dialog for Day Editing?**

**Decision**: Modal dialog instead of inline editing

**Benefits**:
- ✅ Focus mode (no distractions)
- ✅ More space for complex edits
- ✅ Clear save/cancel actions
- ✅ Prevents accidental edits

**Alternative Considered**: Inline editing in calendar tiles
- ❌ Limited space (tiles are small)
- ❌ Cluttered UI
- ❌ Hard to show validation errors

### 8. **Why PieChart Instead of Bar Chart?**

**Decision**: Use PieChart for commessa hours distribution

**Benefits**:
- ✅ Shows proportions at a glance
- ✅ Visually appealing
- ✅ Compact (fits in riepilogo box)
- ✅ Industry standard for distributions

**Alternative Considered**: Bar chart
- ❌ Takes more vertical space
- ❌ Harder to compare proportions
- ❌ Less visually engaging

### 9. **Why useMemo for stagedMeta?**

**Decision**: Memoize stagedMeta per employee

**Code**:
```jsx
const stagedMetaAll = useStagedMetaMap(staging);
const stagedMeta = useMemo(
  () => stagedMetaAll[employeeId] || {},
  [stagedMetaAll, employeeId]
);
```

**Benefits**:
- ✅ Stable reference (prevents WorkCalendar re-render)
- ✅ Only recalculates when staging changes
- ✅ Avoids prop drilling entire map

### 10. **Why Material-UI v7?**

**Decision**: Use MUI v7 (formerly v6-alpha with new branding)

**Benefits**:
- ✅ Modern component library
- ✅ Built-in theming
- ✅ Accessibility baked in
- ✅ TypeScript support
- ✅ Active community
- ✅ MUI X Charts included

**Components Used**:
- Box, Stack, Typography (layout)
- Paper, Card (surfaces)
- Button, IconButton (actions)
- Dialog, Chip (feedback)
- PieChart (visualization)

---

## Performance Optimizations

### 1. Selective Context Consumption
```jsx
const mergedData = useTimesheetSelector(
  ctx => ctx?.dataMap?.[employeeId] || {},
  [employeeId]
);
```

**Why**: Only re-render when employee's data changes (not all employees)

### 2. Virtualization in Calendar
```jsx
const visibleDateKeys = days
  .filter(day => day && day.dateStr)
  .map(day => day.dateStr);

const stagedStatusMap = useVisibleStagedStatusMap({
  visibleDateKeys  // Only compute for visible dates
});
```

**Why**: Don't process 365 days when only 42 are visible

### 3. Stable Callback References
```jsx
const handleDayDoubleClick = useCallback((day) => {
  setSelectedDay(day);
  dayEditor.openEditor(employeeId, day);
}, [dayEditor, employeeId]);
```

**Why**: Prevents child component re-renders from new function references

### 4. Memoized Computed Values
```jsx
const isBadgiatoToday = useMemo(
  () => Boolean(mergedData?.[todayKey]?.length),
  [mergedData, todayKey]
);
```

**Why**: Cache expensive boolean checks

### 5. React.memo on Pure Components
```jsx
export default React.memo(WorkCalendar);
export default React.memo(CalendarHeader);
export default React.memo(DayEntryTile);
```

**Why**: Skip re-render if props haven't changed

---

## File Structure

```
src/
├── domains/
│   └── timesheet/
│       ├── components/
│       │   ├── calendar/
│       │   │   ├── WorkCalendar.jsx
│       │   │   ├── WorkCalendarContainer.jsx
│       │   │   ├── WorkCalendarView.jsx
│       │   │   ├── CalendarHeader.jsx
│       │   │   ├── DayEntryTile.jsx
│       │   │   ├── DayEntryDialog.jsx
│       │   │   └── formatDayTooltip.jsx
│       │   ├── panels/
│       │   │   ├── DayEntryPanel.jsx
│       │   │   └── PersonalAbsenceEditor.jsx
│       │   ├── staging/
│       │   │   └── StagedChangesCompact.jsx
│       │   ├── TimesheetMainLayout.jsx
│       │   └── TimesheetPageHeader.jsx
│       ├── hooks/
│       │   ├── index.js
│       │   ├── TimesheetProvider.jsx
│       │   ├── useTimesheetContext.js
│       │   ├── useTimesheetStaging.js
│       │   ├── useDayEditor.js
│       │   ├── useEmployeeTimesheetLoader.js
│       │   ├── useStableMergedDataMap.js
│       │   ├── useStagedMetaMap.js
│       │   ├── useReferenceData.js
│       │   ├── useBadgeData.js
│       │   └── useCalendarMonthYear.js
│       └── pages/
│           ├── DipendenteTimesheet.jsx  ← Main page
│           ├── CoordinatoreTimesheet.jsx
│           └── TimesheetRouter.jsx
│
└── shared/
    ├── components/
    │   ├── DipendenteHomePage/
    │   │   └── CommesseDashboard.jsx
    │   ├── Calendar/
    │   │   └── TileLegend.jsx
    │   ├── Entries/
    │   │   └── EntryListItem.jsx
    │   └── BadgeCard/
    │       └── Badge.jsx
    └── utils/
        ├── commessaColors.js
        └── dateRangeUtils.js
```

---

## Data Models

### Timesheet Entry
```typescript
{
  commessa: string;           // Sottocommessa ID: "VS-25-01-DL"
  ore: number;                // Hours: 1-8
  descrizione?: string;       // Optional description
}
```

### Day Data
```typescript
{
  [dateKey]: TimesheetEntry[];  // Array of entries for that day
  [dateKey_segnalazione]?: string;  // Flag/note for the day
}
```

### Staged Change
```typescript
{
  employeeId: string;
  dateKey: string;
  entries: TimesheetEntry[];
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
}
```

### Badge Data
```typescript
{
  type: 'oro' | 'argento' | 'bronzo' | 'base';
  label: string;              // Display name
  description: string;        // Achievement description
  streak: number;             // Consecutive days
  lastUpdate: string;         // ISO date string
}
```

### Commessa Stats
```typescript
{
  commessa: string;           // Sottocommessa ID
  total: number;              // Total hours in period
  days: number;               // Number of days worked
  lastDate: Date | null;      // Most recent work date
}
```

### Absence Stats
```typescript
{
  ferie: { days: number; hours: number };
  malattia: { days: number; hours: number };
  permesso: { days: number; hours: number };
  rol: { days: number; hours: number };
}
```

---

## API Integration Points

### Current State: Mock Data

```jsx
// Mock imports
import { findUserById } from '@mocks/UsersMock';
import { getActiveCommesseForEmployee } from '@mocks/EmployeeCommesseMock';
import { getTimesheetMonthData } from '@mocks/ProjectMock';
```

### Future: Real API

**Replace with**:
```jsx
import { timesheetAPI } from '@domains/timesheet/services/api';

// Load employee data
const data = await timesheetAPI.getEmployeeMonth(employeeId, year, month);

// Load commesse
const commesse = await timesheetAPI.getEmployeeCommesse(employeeId);

// Save changes
await timesheetAPI.saveDayEntries(employeeId, dateKey, entries);

// Commit staged changes
await timesheetAPI.commitStagedChanges(employeeId, changes);
```

**Endpoints** (to implement):
```
GET    /api/timesheet/employee/:id/month/:year/:month
GET    /api/timesheet/employee/:id/commesse
POST   /api/timesheet/employee/:id/day/:date
PUT    /api/timesheet/employee/:id/day/:date
DELETE /api/timesheet/employee/:id/day/:date
POST   /api/timesheet/staging/commit
DELETE /api/timesheet/staging/discard
```

---

## Testing Strategy

### Unit Tests

**Components**:
```javascript
describe('CommesseDashboard', () => {
  it('calculates listStats correctly', () => {
    // Test with mock data
    // Verify aggregation logic
  });
  
  it('filters active/closed commesse', () => {
    // Test filter toggle
  });
  
  it('generates correct pie chart data', () => {
    // Verify color assignment
    // Check data transformation
  });
});

describe('WorkCalendar', () => {
  it('displays 42 tiles (6 weeks)', () => {
    // Verify grid structure
  });
  
  it('highlights selected day', () => {
    // Test selection state
  });
  
  it('shows staged indicators', () => {
    // Verify visual feedback
  });
});
```

### Integration Tests

```javascript
describe('Day Editing Flow', () => {
  it('saves changes to staging', async () => {
    // 1. Double-click day
    // 2. Edit entries
    // 3. Save
    // 4. Verify staged indicator appears
  });
  
  it('commits staged changes', async () => {
    // 1. Stage multiple days
    // 2. Click commit
    // 3. Verify backend call
    // 4. Verify indicators disappear
  });
});

describe('Period Switching', () => {
  it('recalculates stats on period change', () => {
    // 1. Switch to week
    // 2. Verify dashboard updates
    // 3. Switch to year
    // 4. Verify different aggregation
  });
});
```

### E2E Tests

```javascript
describe('Employee Timesheet Journey', () => {
  it('completes full workflow', () => {
    // 1. Login as employee
    // 2. Navigate to timesheet
    // 3. View calendar
    // 4. Edit multiple days
    // 5. Stage changes
    // 6. Review dashboard stats
    // 7. Commit changes
    // 8. Verify persistence
  });
});
```

---

## Future Enhancements

### Planned Features

1. **Export Functionality**
   - Export timesheet to Excel
   - Generate PDF reports
   - Email reports to manager

2. **Advanced Filtering**
   - Filter by commessa type
   - Search by description
   - Date range picker

3. **Bulk Operations**
   - Copy week to next week
   - Fill pattern (Monday → Friday)
   - Bulk edit multiple days

4. **Notifications**
   - Missing timesheet warnings
   - Approval status updates
   - Deadline reminders

5. **Mobile App**
   - Native iOS/Android
   - Offline support
   - Push notifications

6. **Analytics Dashboard**
   - Work patterns visualization
   - Productivity insights
   - Commessa time trends

7. **Approval Workflow**
   - Submit for approval
   - Manager review interface
   - Revision requests

8. **Integration**
   - Sync with calendar apps
   - Export to accounting software
   - API for third-party tools

---

## Troubleshooting

### Common Issues

#### 1. "Calendar not updating after staging"
**Solution**: Check that `stagedMeta` is properly memoized
```jsx
const stagedMeta = useMemo(
  () => stagedMetaAll[employeeId] || {},
  [stagedMetaAll, employeeId]
);
```

#### 2. "Dashboard shows wrong period totals"
**Solution**: Verify `refDate` and `period` props are correct
```jsx
<CommesseDashboard
  period={period}        // 'week' | 'month' | 'year'
  refDate={refDate}      // Date object
  onPeriodChange={setPeriod}
/>
```

#### 3. "Colors not appearing for sottocommesse"
**Solution**: Ensure sottocommessa IDs follow naming convention
```javascript
// Correct: VS-25-01-DL (has work type suffix)
// Incorrect: VS-25-01-S1 (generic suffix)
```

#### 4. "Day editor dialog won't open"
**Solution**: Check `dayEditor` hook is properly initialized
```jsx
const dayEditor = useDayEditor();
// Must be called within TimesheetProvider
```

#### 5. "Badge not updating"
**Solution**: Verify `isBadgiatoToday` dependency
```jsx
const isBadgiatoToday = useMemo(
  () => Boolean(mergedData?.[todayKey]?.length),
  [mergedData, todayKey]  // Don't forget dependencies!
);
```

---

## Conclusion

The **Dipendente Timesheet Page** is a comprehensive, well-architected solution for employee time tracking. It demonstrates:

✅ **Modern React Patterns**: Hooks, Context, Container-Presenter  
✅ **Performance Optimization**: Memoization, selective re-renders, virtualization  
✅ **User Experience**: Intuitive UI, visual feedback, staging system  
✅ **Maintainability**: Clear separation of concerns, modular architecture  
✅ **Scalability**: Supports unlimited sottocommesse, extensible design  
✅ **Aesthetics**: Bento layout, gradient headers, semantic colors  

The implementation balances functionality, performance, and code quality, making it an excellent foundation for future enhancements.

---

**Documentation Version**: 1.0  
**Last Updated**: October 11, 2025  
**Author**: Development Team  
**Status**: ✅ Production Ready
