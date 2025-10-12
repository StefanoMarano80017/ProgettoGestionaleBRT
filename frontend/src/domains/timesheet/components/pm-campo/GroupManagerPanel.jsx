import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import ConfirmDialog from '@shared/components/ConfirmDialog';

function sortByName(items) {
  return items.slice().sort((a, b) => `${a.cognome}${a.nome}`.localeCompare(`${b.cognome}${b.nome}`));
}

function MemberChips({ members = [], operaiMap }) {
  if (!members?.length) {
    return <Typography variant="caption" color="text.disabled">Nessun membro</Typography>;
  }
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {members.map((id) => {
        const member = operaiMap[id];
        return (
          <Chip
            key={id}
            size="small"
            label={member ? `${member.nome} ${member.cognome}` : id}
            sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}
          />
        );
      })}
    </Stack>
  );
}

MemberChips.propTypes = {
  members: PropTypes.arrayOf(PropTypes.string),
  operaiMap: PropTypes.object.isRequired,
};

function useOperaiMap(operai) {
  return useMemo(() => {
    const map = {};
    (operai || []).forEach((op) => {
      map[op.id] = op;
    });
    return map;
  }, [operai]);
}

const EMPTY_DIALOG = { open: false, mode: 'create', name: '', members: [], groupId: null };

export default function GroupManagerPanel({
  groups = [],
  operai = [],
  personalMap = {},
  disabled = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const operaiMap = useOperaiMap(operai);
  const orderedGroups = useMemo(
    () => (groups || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [groups]
  );
  const availableOperai = useMemo(() => sortByName(operai || []), [operai]);

  const [dialog, setDialog] = useState(EMPTY_DIALOG);
  const [dialogError, setDialogError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, groupId: null });
  const [removalWarning, setRemovalWarning] = useState({ open: false, members: [], payload: null });
  const [panelMessage, setPanelMessage] = useState(null);

  const openCreate = () => {
    setDialog({ open: true, mode: 'create', name: '', members: [], groupId: null });
    setDialogError('');
    setPanelMessage(null);
  };

  const openEdit = (group) => {
    setDialog({ open: true, mode: 'edit', name: group.name || '', members: group.members || [], groupId: group.id });
    setDialogError('');
    setPanelMessage(null);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialog(EMPTY_DIALOG);
    setDialogError('');
  };

  const handleDialogSubmit = async () => {
    const name = dialog.name.trim();
    const members = dialog.members || [];
    if (!name) {
      setDialogError('Inserire un nome per la squadra.');
      return;
    }
    if (!members.length) {
      setDialogError('Selezionare almeno un operaio.');
      return;
    }

    const payload = { name, members };

    if (dialog.mode === 'edit') {
      const group = groups.find((g) => g.id === dialog.groupId);
      const originalMembers = group?.members || [];
      const removedMembers = originalMembers.filter((id) => !members.includes(id));
      const blocked = removedMembers.filter((id) => {
        const personal = personalMap?.[id];
        if (!personal) return false;
        return Object.values(personal).some((rows) => Array.isArray(rows) && rows.length > 0);
      });
      if (blocked.length && !removalWarning.open) {
        setRemovalWarning({ open: true, members: blocked, payload });
        return;
      }
      await submitPayload(payload);
    } else {
      await submitPayload(payload);
    }
  };

  const submitPayload = async (payload) => {
    setSubmitting(true);
    try {
      const mode = dialog.mode;
      if (dialog.mode === 'create') {
        await onCreate?.(payload);
      } else if (dialog.mode === 'edit' && dialog.groupId) {
        await onUpdate?.(dialog.groupId, payload);
      }
      setDialog(EMPTY_DIALOG);
      setPanelMessage({
        type: 'success',
        text: mode === 'create' ? 'Squadra creata con successo.' : 'Squadra aggiornata.',
      });
    } catch (error) {
      setDialogError(error?.message || 'Errore durante il salvataggio.');
      setPanelMessage({ type: 'error', text: error?.message || 'Errore durante il salvataggio.' });
    } finally {
      setSubmitting(false);
      setRemovalWarning({ open: false, members: [], payload: null });
    }
  };

  const confirmRemoval = async () => {
    if (!removalWarning.payload) {
      setRemovalWarning({ open: false, members: [], payload: null });
      return;
    }
    await submitPayload(removalWarning.payload);
  };

  const handleDelete = async () => {
    if (!confirm.groupId) return;
    setSubmitting(true);
    try {
      await onDelete?.(confirm.groupId);
      setConfirm({ open: false, groupId: null });
      setPanelMessage({ type: 'success', text: 'Squadra eliminata.' });
    } catch (error) {
      setConfirm({ open: false, groupId: null });
      setPanelMessage({ type: 'error', text: error?.message || 'Errore eliminazione.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 1.5, 
        borderRadius: 1.5, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Squadre
        </Typography>
        <Tooltip title={disabled ? 'Permessi insufficienti' : 'Crea nuova squadra'}>
          <span>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} disabled={disabled} sx={{ fontSize: '0.7rem', py: 0.5 }}>
              Nuova
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {panelMessage && (
        <Alert severity={panelMessage.type} onClose={() => setPanelMessage(null)}>
          {panelMessage.text}
        </Alert>
      )}

      {!orderedGroups.length && (
        <Alert severity="info" variant="outlined">
          Nessuna squadra registrata. Crea una squadra per iniziare a pianificare le ore.
        </Alert>
      )}

      {!!orderedGroups.length && (
        <List dense sx={{ width: '100%', maxHeight: 280, overflowY: 'auto' }}>
          {orderedGroups.map((group) => (
            <ListItem key={group.id} alignItems="flex-start" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 0.5, py: 0.5 }}>
              <ListItemText
                primary={
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {group.name}
                    </Typography>
                    <Chip size="small" label={`${group.members?.length || 0}`} sx={{ height: 18, fontSize: '0.65rem' }} />
                  </Stack>
                }
                secondary={<MemberChips members={group.members} operaiMap={operaiMap} />}
                secondaryTypographyProps={{ component: 'div' }}
              />
              <ListItemSecondaryAction>
                <Tooltip title={disabled ? 'Permessi insufficienti' : 'Modifica squadra'}>
                  <span>
                    <IconButton edge="end" onClick={() => openEdit(group)} disabled={disabled}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={disabled ? 'Permessi insufficienti' : 'Elimina squadra'}>
                  <span>
                    <IconButton edge="end" onClick={() => setConfirm({ open: true, groupId: group.id })} disabled={disabled}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pr: 5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          {dialog.mode === 'create' ? 'Crea nuova squadra' : 'Modifica squadra'}
          <IconButton size="small" onClick={closeDialog} sx={{ position: 'absolute', top: 8, right: 8, color: 'inherit' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Crea squadre per assegnare rapidamente ore su commesse ai gruppi di operai.
          </Typography>
          <TextField
            label="Nome squadra"
            value={dialog.name}
            onChange={(event) => setDialog((prev) => ({ ...prev, name: event.target.value }))}
            autoFocus
            fullWidth
            placeholder="Es: Squadra A, Team cantiere..."
            helperText="Scegli un nome descrittivo per identificare la squadra"
          />
          <Autocomplete
            multiple
            options={availableOperai}
            getOptionLabel={(option) => `${option.cognome} ${option.nome}`}
            value={availableOperai.filter((op) => dialog.members.includes(op.id))}
            onChange={(_, value) => setDialog((prev) => ({ ...prev, members: value.map((op) => op.id) }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Membri squadra"
                placeholder="Cerca e seleziona operai..."
                helperText={`${dialog.members.length} operai selezionati`}
              />
            )}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: selected ? 'primary.main' : 'transparent',
                      border: '2px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                    }}
                  />
                  <Typography variant="body2">{option.cognome} {option.nome}</Typography>
                </Box>
              </li>
            )}
            disableCloseOnSelect
            ChipProps={{ size: 'small' }}
          />
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
          {dialog.members.length > 0 && (
            <>
              <Divider sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Anteprima membri</Typography>
              </Divider>
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <MemberChips members={dialog.members} operaiMap={operaiMap} />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog} disabled={submitting} color="inherit">
            Annulla
          </Button>
          <Button onClick={handleDialogSubmit} disabled={submitting} variant="contained" size="large">
            {dialog.mode === 'create' ? 'Crea squadra' : 'Salva modifiche'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title="Elimina squadra"
        message="Sei sicuro di voler eliminare definitivamente questa squadra?"
        onClose={() => setConfirm({ open: false, groupId: null })}
        onConfirm={handleDelete}
        confirmText="Elimina"
        confirmColor="error"
      />

      <ConfirmDialog
        open={removalWarning.open}
        title="Rimozione membri con assenze"
        message={
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Alcuni operai selezionati hanno voci personali (FERIE/MALATTIA/PERMESSO/ROL). Confermi la rimozione?
            </Typography>
            <MemberChips members={removalWarning.members} operaiMap={operaiMap} />
          </Box>
        }
        onClose={() => setRemovalWarning({ open: false, members: [], payload: null })}
        onConfirm={confirmRemoval}
        confirmText="Conferma"
      />

      {disabled && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Non hai i permessi per creare o modificare squadre. Visualizzazione sola lettura.
        </Alert>
      )}
    </Paper>
  );
}

GroupManagerPanel.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.string),
  })),
  operai: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
  })),
  personalMap: PropTypes.object,
  disabled: PropTypes.bool,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
};
