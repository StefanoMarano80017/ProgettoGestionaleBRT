# Dipendente Timesheet Hooks

## useDipendenteTimesheetData
Fornisce i dati normalizzati per il pannello giornaliero del dipendente e alcune derivazioni utili.

### Input
`projectsMock` (o futura sorgente real API) contenente la lista record.

### Output Principale
- `data`: struttura consumata da `WorkCalendar` e `DayEntryPanel`.
- `handleAddRecord(record)`: aggiunge un nuovo record per il giorno corrente (logica placeholder dimostrativa).
- `todayKey`: stringa YYYY-MM-DD di oggi.
- `isBadgiatoToday`: boolean derivato (true se esiste almeno un record oggi).

### Possibili Estensioni
- Metodo `handleUpdateRecord` / `handleDeleteRecord` per CRUD completa.
- Integrazione con React Query per persistenza remota.

## Linee Guida
- Il mapping day->records resta locale alla pagina per evitare over-fetch se cambiano rapidamente i giorni.
- Minimizzare shape: solo ciò che serve ai componenti di presentazione.
