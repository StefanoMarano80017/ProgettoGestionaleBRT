import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack, Alert, Typography, InputAdornment, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

/** \n * EditEntryDialog - Dialog per creare o modificare una singola voce timesheet.\n *\n * RESPONSABILITA'\n * - Gestione form locale (commessa, ore, descrizione) senza toccare lo stato globale finché non si salva.\n * - Validazione di base: campi obbligatori, ore > 0, limite per voce (maxOre) e limite giornaliero cumulato (dailyLimit).\n * - Normalizzazione input ore (accetta anche virgola).\n *\n * NON si occupa di: eliminazione (gestita esternamente), ricalcolo aggregati, persistenza remota.\n *\n * PROPS PRINCIPALI\n * - open: boolean -> visibilità\n * - mode: 'add' | 'edit' -> per il titolo o logiche future\n * - item: oggetto esistente (in edit) { commessa, ore, descrizione }\n * - commesse: elenco selezionabile (aggiunge automaticamente FERIE/PERMESSO/MALATTIA se non presenti)\n * - maxOre: limite per la singola voce\n * - dailyLimit: limite complessivo giornaliero (default 8)\n * - dayUsed: ore già allocate ESCLUDENDO l'entry corrente\n * - onSave(entry) -> callback con dati validati \n */
export default function EditEntryDialog({
  open,
  mode = 'add',
  item = null,
  commesse = [],
  maxOre = 8,
  onClose,
  onSave,
  dailyLimit = 8,
  dayUsed = 0,
  step = 0.5, // nuovo: incremento/decremento default mezz'ora
}) {
  /* ----------------------------- Stato locale ----------------------------- */
  // Manteniamo le ore come string per supportare input parziali (es: "1.", "1,5") prima del parse.
  const [form, setForm] = React.useState({ commessa: '', oreInput: '1', descrizione: '' });
  const [error, setError] = React.useState('');
  const wasOpen = React.useRef(false);       // traccia transizione open
  const lastSignature = React.useRef('');    // evita reset non necessari durante l'editing

  /* ----------------------- Inizializzazione controllata ------------------- */
  React.useEffect(() => {
    const sig = item ? `${item.id||'_'}|${item.commessa}|${item.ore}|${item.descrizione}` : '__new__';
    // Reset solo quando:
    //  - dialog si apre per la prima volta
    //  - cambia l'oggetto item (signature differente)
    if (open && (!wasOpen.current || lastSignature.current !== sig)) {
      setForm({
        commessa: item?.commessa || commesse[0] || '',
        oreInput: item?.ore != null ? String(item.ore) : '1',
        descrizione: item?.descrizione || '',
      });
      setError('');
      lastSignature.current = sig;
    }
    wasOpen.current = open;
  }, [open, item, commesse]);

  /* ------------------------- Derivati & validazione ----------------------- */
  const oreNum = React.useMemo(() => {
    const n = parseFloat((form.oreInput || '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }, [form.oreInput]);

  const effectiveRemaining = React.useMemo(() => Math.max(0, dailyLimit - dayUsed), [dailyLimit, dayUsed]);
  const currentPlusOthers = oreNum + dayUsed;
  const overDaily = currentPlusOthers > dailyLimit;

  /* ------------------------------ Handlers -------------------------------- */
  const handleChangeCommessa = (e) => setForm(f => ({ ...f, commessa: e.target.value }));
  const handleChangeOre = (e) => {
    const val = e.target.value.trim();
    // Regex: numeri interi o decimali (2 decimali max) con . o , come separatore
    if (/^[0-9]*[\.,]?[0-9]{0,2}$/.test(val) || val === '') {
      setForm(f => ({ ...f, oreInput: val }));
    }
  };
  const clamp = (v) => Math.max(0, Math.min(maxOre, v));
  const format = (v) => (Number.isNaN(v) ? '' : (Number(v.toFixed(2)).toString().replace('.', '.')));
  const adjustHours = (delta) => {
    setForm(f => {
      const current = parseFloat((f.oreInput||'').replace(',', '.')) || 0;
      const next = clamp(current + delta);
      return { ...f, oreInput: format(next) };
    });
  };
  const handleChangeDescr = (e) => setForm(f => ({ ...f, descrizione: e.target.value }));

  const handleSave = () => {
    setError('');
    if (!form.commessa) return setError('Seleziona una commessa');
    if (oreNum <= 0) return setError('Le ore devono essere maggiori di 0');
    if (oreNum > maxOre) return setError(`Max consentito sulla singola voce: ${maxOre}h`);
    if (overDaily) return setError(`Supera il limite giornaliero (${dailyLimit}h)`);
    onSave?.({ ...item, commessa: form.commessa, ore: oreNum, descrizione: form.descrizione });
  };

  /* ------------------------------- Render --------------------------------- */
  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mode === 'add' ? 'Aggiungi voce' : 'Modifica voce'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Commessa */}
        <TextField
          select
          label="Commessa"
          value={form.commessa}
          onChange={handleChangeCommessa}
          size="small"
          sx={{ mt: 2 }}
        >
          {commesse.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          {/* Aggiunge voci personali se non già presenti nella lista */}
          {['FERIE','PERMESSO','MALATTIA'].filter(c => !commesse.includes(c)).map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>

        {/* Ore */}
        <TextField
          type="text"
          label={`Ore (max voce ${maxOre})`}
          value={form.oreInput}
          onChange={handleChangeOre}
          size="small"
          inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]{0,2}' }}
          error={overDaily}
          helperText={overDaily
            ? `Totale giornaliero (${currentPlusOthers}h) supera ${dailyLimit}h`
            : `Ore restanti oggi: ${effectiveRemaining}h`}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ gap: 0.5 }}>
                <Tooltip title={`- ${step}`} placement="top">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => adjustHours(-step)}
                      disabled={oreNum <= 0}
                      edge="end"
                    >
                      <RemoveIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={`+ ${step}`} placement="top">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => adjustHours(step)}
                      disabled={oreNum >= maxOre}
                      edge="end"
                    >
                      <AddIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        {/* Descrizione */}
        <TextField
          label="Descrizione"
          value={form.descrizione}
          onChange={handleChangeDescr}
          size="small"
          multiline
          minRows={2}
        />

        {/* Nota riepilogo */}
        <Typography variant="caption" color={overDaily ? 'error' : 'text.secondary'}>
          {overDaily
            ? 'Riduci le ore per rientrare nel limite giornaliero'
            : `Stai per registrare ${currentPlusOthers}h su ${dailyLimit}h`}
        </Typography>

        {/* Errori */}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: '100%', px: 1 }}>
          <Button onClick={onClose}>Annulla</Button>
          <Stack direction="row" sx={{ ml: 'auto' }} spacing={1}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={overDaily || !form.oreInput}
            >
              Salva
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
