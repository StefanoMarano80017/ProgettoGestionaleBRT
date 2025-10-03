# Timesheet Hooks Architecture

Questo documento descrive l'architettura dei nuovi hook Timesheet e le convenzioni adottate.

## Obiettivi
- Separare la logica di dominio (gruppi, operai, personale, calendario) dalla UI.
- Ridurre duplicazione tra pagine (PM Campo, Dipendente, eventuale Admin).
- Standardizzare i pattern di editing giornaliero e pannelli di riepilogo.

## Convenzioni Cartelle
```
Hooks/Timesheet/
  usePmGroups.js              # Stato e operazioni su gruppi (CRUD, assegnazione ore, calendario)
  useOpPersonal.js            # Mappa voci personali per operaio (FERIE/MALATTIA/PERMESSO)
  useOperaiTimesheet.js       # Derivazione aggregata timesheet per tab "Operai"
  useMonthNavigation.js       # Navigazione mese/year riutilizzabile
  PMCampoTimesheet/
    usePmCampoEditing.js      # Stato di editing righe commesse/ore per gruppo+giorno
  DipendenteTimesheet/
    useDipendenteTimesheetData.js # Mappa locale day->records per vista dipendente
```

## Hook Core
### usePmGroups(azienda)
Responsabilità:
- Carica / mantiene lista gruppi, commesse attive, operai.
- CRUD gruppi (createGroup, updateGroup, deleteGroup).
- Assegna ore rapide (assignHours) con riparto automatico.
- Costruisce dati per `WorkCalendar` (calendarData, renderDayTooltip).
- Costruisce pannello readonly per un giorno (buildReadonlyPanel).

Ritorna (principali):
- `groups, allOperai, commesse`
- `selectedGroupId, setSelectedGroupId, selectedGroup`
- azioni: `createGroup, updateGroup, deleteGroup, assignHours, refreshGroups`
- calendario: `calendarData, renderDayTooltip, buildReadonlyPanel`

### useOpPersonal()
- Fornisce `opPersonal` mappa: `{ opId: { YYYY-MM-DD: [ { commessa, ore } ] } }`.
- `refreshPersonal()` per ricaricare.

### useOperaiTimesheet({ groups, allOperai, azienda, opPersonal })
- Deriva righe tab Operai: `operaiRows`.
- Costruisce `operaiTsMap` unificato (gruppi + personale).

### useMonthNavigation()
- Gestione semplice stato mese/anno. Ritorna: `{ year, month, nextMonth, prevMonth, setToday }`.

## Hook Page-Specifici
### usePmCampoEditing({ selectedGroup, selectedDay, commesse, groups, opPersonal, refreshGroups, refreshPersonal })
- Stato locale array `editEntries` (righe: { commessa, oreTot }).
- Azioni: `addEditRow(), removeEditRow(idx), updateEditRow(idx, patch)`.
- Derivazioni: `totalEditHours`.
- Salvataggio validato: `saveGroupDay({ selectedGroupId, selectedDay })` (controllo limite 8h includendo personale e altre commesse del gruppo).
- Messaggistica: `saveMsg, saveType`.

### useDipendenteTimesheetData(dipendenteId)
- Normalizza records per data per il pannello dipendente.
- Deriva flag (oggi, day status, ecc.).

## Component Pattern
- `DayEntryPanel` ora supporta prop `mode="readonly"` come shorthand; rimuove necessità di passare `readOnly` + noop handlers.
- Editor gruppo giornaliero mantiene forma ultra-semplice (lista righe + salva). Validazioni cross-operaio nel hook.

## Come Aggiungere Nuovo Hook Page-Specifico
1. Creare cartella `Hooks/Timesheet/<PageName>/`.
2. Nome file: `use<PageName><Feature>.js` (e.g. `useAdminApproval.js`).
3. Esportare funzione che accetta solo i dati minimi (no import circolari). Passare dal componente i riferimenti già disponibili.
4. Restituire oggetti/azioni atomiche, evitare ritorni monolitici indiscriminati.

## Principi di Design
- Idempotenza: ogni hook ricalcola solo dal suo input; niente side-effect nascosti tranne caricamenti espliciti.
- Nessuna dipendenza UI → hook testabili isolatamente.
- Minimizzare shape leakage: ogni hook espone una shape ridotta invece di forwardare oggetti voluminosi interi.

## Roadmap Potenziale
- Estrarre validazioni comuni ore in helper condiviso.
- Aggiungere test unitari sui hook di calcolo (operaiTsMap, buildReadonlyPanel). 
- Ottimizzare memorizzazioni con `useMemo` granulari in caso di dataset grandi.

## Esempio Rapido Uso (PM Campo)
```jsx
const { groups, selectedGroupId, setSelectedGroupId, buildReadonlyPanel } = usePmGroups(azienda);
const { editEntries, addEditRow, saveGroupDay } = usePmCampoEditing({ selectedGroup, selectedDay, commesse, groups, opPersonal, refreshGroups, refreshPersonal });
const readonlyPanelData = useMemo(() => buildReadonlyPanel(selectedDay), [buildReadonlyPanel, selectedDay]);
```

## Aggiornamento DayEntryPanel
Sostituire pattern legacy:
```jsx
<DayEntryPanel readOnly onAddRecord={() => {}} ... />
```
con:
```jsx
<DayEntryPanel mode="readonly" ... />
```

---
Ultimo aggiornamento: auto-generato.
