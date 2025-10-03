# PMCampo Timesheet Hooks

## usePmCampoEditing
Gestisce l'editing giornaliero delle commesse di una squadra.

### Input params
```ts
{
  selectedGroup,        // oggetto gruppo selezionato (o null)
  selectedDay,          // string YYYY-MM-DD
  commesse,             // array elenco commesse selezionabili
  groups,               // lista gruppi (per validazioni cross)
  opPersonal,           // mappa voci personali per operaio
  refreshGroups,        // funzione di reload gruppi
  refreshPersonal       // funzione di reload personale
}
```

### Stato esposto
- `editEntries`: Array di righe `{ commessa: string, oreTot: number }`.
- `totalEditHours`: Somma ore correnti.
- `saveMsg`, `saveType`: Messaggistica (success|error|info|warning).

### Azioni
- `addEditRow()` aggiunge una riga vuota.
- `removeEditRow(index)` rimuove riga.
- `updateEditRow(index, patch)` modifica parziale.
- `saveGroupDay({ selectedGroupId, selectedDay })` valida e persiste (limite 8h/operatore considerando personale + altre assegnazioni stesso giorno).

### Principi
- Nessuna mutazione diretta del gruppo: delega a funzioni di dominio (es. service/hook superiore) per persistenza.
- Validazione preventiva lato client per miglior UX; eventuali errori server mostrati in `saveMsg`.
- Struttura facilmente testabile: dato uno stato (gruppi, personale, righe) la funzione di validazione è pura.

## Flusso Salvataggio
1. Calcolo ore per operaio: somma (ore già assegnate gruppi + voci personali + nuova distribuzione proposta).
2. Se una quota supera 8h => errore.
3. Altrimenti invoca persistenza e refresh (`refreshGroups`, `refreshPersonal`).
