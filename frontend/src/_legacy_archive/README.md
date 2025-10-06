# Legacy Archive

Questa cartella contiene file legacy (stub / proxy) spostati dal codice sorgente principale.
Obiettivo: rimozione definitiva dopo un periodo di stabilità (es. 1-2 sprint) o subito se confermato.

Contenuto:
- `app_layouts/` : vecchi context Auth/Theme re-export.
- `Hooks/` : vecchi hook proxy (useAuth, useThemeContext).
- (Manca ancora Components/ se decidi di archiviare anche quella struttura, attualmente già stubbata altrove.)

Procedure consigliate:
1. Eseguire grep per assicurarsi che nessun import punti più qui.
2. Aggiungere pattern al checker per bloccare nuovi import.
3. Eliminare intera cartella quando stabilità confermata.
