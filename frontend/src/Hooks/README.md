## Hooks Overview

Questo documento riassume i principali hook disponibili suddivisi per dominio.

### Struttura
```
Hooks/
  DataGrid/
    Filters/              # Filtri riutilizzabili (testo, stato, dipendente, data)
  Timesheet/              # Dominio timesheet (calendario, editing, aggregazioni)
```

### DataGrid Filters
| Hook | Scopo | Input principali | Output chiave |
|------|-------|------------------|---------------|
| `useTextFilter` | Filtro testuale generico | initialValue, placeholder | `{ value, setValue, filterFn, render, renderChip, clear }` |
| `useStatusFilter` | Filtro per stato enumerato | `statusOptions` | idem + `selectedStatuses` |
| `useEmployeeFilter` | Filtro per dipendente | `employeesList` | idem + `selectedEmployeeId` |
| `useDateFilter` | Filtro per Year/Mese/Settimana | `tasks` | `{ selectedYear, selectedMonth, selectedWeek, filterFn, render, renderChip, clear }` |

### Timesheet Hooks Principali (Nuova Architettura)
| Hook | Scopo | Note / Deprecazioni |
|------|-------|---------------------|
| `useTimesheetData` | Caricamento unificato timesheet (scope: all/list/single) | Sostituisce `useEmployeeTimesheets` + vari fetch manuali |
| `useTimesheetAggregates` | Aggregazioni mensili/globali/per-employee | Sostituisce `useMonthlySummary` + `useGlobalMonthAggregation` |
| `useTimesheetEntryEditor` | Editor generico di una giornata (righe lavoro + personali) | Base per wrapper specifici (es. Operaio) |
| `TimesheetProvider` / `useTimesheetContext` | Context condiviso (month/year, filters, selection, data) | Riduce prop drilling |
| `useReferenceData` | Dati di riferimento (commesse, personale, pmGroups) | Fonte unificata (commesse per employee, mappa personale, gruppi PM) |
| `useCalendarModel` | Modello calendario (linear / grid42) | Unifica `useCalendarDays` + parte di `useCalendarGridRows` |
| `useCalendarGridRows` | (Legacy) lista lineare giorni | Usare `useCalendarModel` con mode='linear' per nuova UI |
| `useEmployeeMonthGridRows` | Griglia multi-dipendente | Potrà in futuro usare internamente `useCalendarModel` |
| `useDayStatus / getDayStatus` | Deriva stato (ferie, malattia, ecc.) |  |
| `useDayEntryDerived` | Derivazioni per giorno selezionato | Rimane separato (funzione diversa) |
| (rimossi) vedi sezione finale |  |  |
| `useConfirmDelete` | Conferma eliminazione | Rimane util mirato |
| `useTimesheetApi` | Wrapper API (mock → real) | Fondamenta per layer fetch |

### Calendario (sotto-cartella `calendar/`)
| Hook | Scopo |
|------|-------|
| `useCalendarMonthYear` | Stato mese/anno + shift/setMonthYear |
| `useItalianHolidays` | Set festività italiane per anno |
| `useCalendarDays` | Costruisce le 42 celle (6 settimane) del mese |
| `useTileLegendItems` | Genera array legenda (status, label, icon, colore) |
| `useDayStatusColor` | Mappa status → colore tema |
| `useDayStatus` | Restituisce funzione per valutare stato di un giorno |
| `useCalendarGridRows` | Righe base calendario (una entry per giorno) |

### Helpers Condivisi
| Helper | Scopo | Usato da |
|--------|-------|----------|
| `aggregateAbsences` | Aggrega ferie/malattia/permessi (ore & giorni) | `useTimesheetAggregates`, legacy summary |
| `validateDayHours` | Calcola total/personal/grandTotal e valida limite | `useTimesheetEntryEditor`, legacy editors |

Note deprecazioni / rimozioni:
- `useMonthNavigation` rimosso → usare `useCalendarMonthYear`.
- RIMOSSI: `useMonthlySummary`, `useGlobalMonthAggregation`, `useEmployeeTimesheets`, `useEntryEditing`, `useDayEntryEditing`, `useOperaioEditor` (sostituiti da `useTimesheetData`, `useTimesheetAggregates`, `useTimesheetEntryEditor`).
- Unificati: `useTimesheetData`, `useTimesheetAggregates`, `useTimesheetEntryEditor`, `TimesheetProvider`, `useReferenceData`, `useCalendarModel`.

## Modelli Calendario

Per chiarezza architetturale esistono ora tre livelli/facce del "modello calendario":

1. Navigazione mese/anno (`useCalendarMonthYear`)
  - Sorgente verità per coppia (month, year)
  - Espone: `currentMonth`, `currentYear`, `shift(deltaMesi)`, `setMonthYear(m,y)`
  - Responsabilità: sola transizione di stato temporale, nessuna struttura di giorni

2. Grid lineare di giorni del mese (`useCalendarGridRows`)
  - Costruisce l'array ordinato dei giorni del mese corrente (solo quelli del mese, niente celle fuori mese)
  - Usa (month, year) dalla navigazione
  - Valore: semplifica calcoli di indice e mapping vs precedente implementazione con celle pad

3. Griglia employee x giorno (`useEmployeeMonthGridRows`)
  - Proietta per ciascun dipendente la linea temporale mensile
  - Ritorna struttura 2D: `rows: [{ employee, days: [ { date, entries, status... } ]}]`
  - Dipende da: dati timesheet caricati + array giorni base (livello 2) + logica stato (`useDayStatus`)

Layer complementari:
- `useDayStatus`: calcola stato derivato (ferie, malattia, incompleto, ecc.) per una singola cella giorno.
- `aggregateAbsences`: riduce collezione entries in counters mensili (input per riepilogo).

Benefici della separazione:
- Ogni hook ha singola responsabilità, facilita test e memoizzazione.
- Riduce ricalcoli: cambi di navigazione non ricostruiscono strutture employee se non necessario.
- Consente future ottimizzazioni (es. virtualizzazione righe) intervenendo solo al livello 3.

Quando usare cosa:
- Hai bisogno solo di pulsanti Prev/Next/TODAY: usa `useCalendarMonthYear`.
- Devi iterare i giorni del mese in un componente puro (header, legenda): usa `useCalendarGridRows`.
- Devi renderizzare una tabella per dipendente: usa `useEmployeeMonthGridRows` (che incapsula stato e entries).

### Nomenclatura & Convenzioni
1. Prefisso `use` per ogni hook export principale.
2. Un hook per responsabilità; evitare ritorni sovraccarichi.
3. Nessun side-effect nascosto eccetto caricamenti dati espliciti.
4. Dove possibile, ritornare funzioni già memorizzate (`useCallback`) solo se passate a discendenti sensibili a referenza.

### Pattern Render Inline
I filtri DataGrid espongono spesso metodi `render()` e `renderChip()` per incapsulare UI standard senza obbligare wrapper esterni.

### Esempio Composizione (Dipendente Timesheet)
```jsx
const { data, handleAddRecord, isBadgiatoToday } = useDipendenteTimesheetData(projectsMock);
const { commesse, loading } = useReferenceData({ commesse: true, personale: false, pmGroups: false, employeeId });
const editor = useTimesheetEntryEditor({ entries: records, commesse, onSave: (next) => onAddRecord(selectedDay, next, true) });
// You can obtain the current day's used hours (rows + personal) excluding a specific entry being edited:
// const dayUsed = editor.getDayUsed(currentEntry, mode, editIndex);
```

### Aree di Miglioramento Future
- Test unitari per `useCalendarDays`, `usePmGroups`, `useTimesheetEntryEditor`.
- Estrazione validazioni ore in helper condiviso (`validateHoursAllocation`).
- Suspense-ready API layer (`useTimesheetApi` -> swr/react-query integrazione futura).

Aggiornare questo file quando si aggiungono nuovi hook pubblici.
