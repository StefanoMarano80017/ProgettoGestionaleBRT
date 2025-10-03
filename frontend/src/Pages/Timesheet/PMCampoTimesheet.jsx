import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Divider,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  IconButton,
  MenuItem,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteIcon from "@mui/icons-material/Delete";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PageHeader from "../../Components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import WorkCalendar from "../../Components/Calendar/WorkCalendar";
import DayEntryPanel from "../../Components/Calendar/DayEntryPanel";
import TileLegend from "../../Components/Calendar/TileLegend";
import EntryListItem from "../../components/Entries/EntryListItem";
import EmployeeMonthGrid from "../../Components/Calendar/EmployeeMonthGrid";
import OperaioEditor from "../../Components/Timesheet/OperaioEditor";
import { usePmGroups } from "../../Hooks/Timesheet/usePmGroups";
import { useOpPersonal } from "../../Hooks/Timesheet/useOpPersonal";
import { useOperaiTimesheet } from "../../Hooks/Timesheet/useOperaiTimesheet";
import { useMonthNavigation } from "../../Hooks/Timesheet/useMonthNavigation";
import { usePmCampoEditing } from "../../Hooks/Timesheet/PMCampoTimesheet/usePmCampoEditing";

export default function PMCampoTimesheet() {
  const [azienda, setAzienda] = useState("BRT");
  const {
    groups,
    allOperai,
    commesse,
    selectedGroupId,
    setSelectedGroupId,
    selectedGroup,
    createGroup,
    updateGroup,
    deleteGroup: deleteGroupHook,
    assignHours,
    calendarData,
    renderDayTooltip,
    buildReadonlyPanel,
    refreshGroups,
  } = usePmGroups(azienda);
  const { opPersonal, refreshPersonal } = useOpPersonal();
  const { year: opYear, month: opMonth, prevMonth: handlePrevMonth, nextMonth: handleNextMonth, setToday: setOperaiToday } = useMonthNavigation();

  // Day / form state
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [dateKey, setDateKey] = useState(selectedDay);
  useEffect(() => setDateKey(selectedDay), [selectedDay]);
  const [commessa, setCommessa] = useState("");
  const [oreTot, setOreTot] = useState(8);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  // Group create/edit
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState([]);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupMembers, setEditGroupMembers] = useState([]);

  // Tabs / filters
  const [activeTab, setActiveTab] = useState(0); // 0=Squadre 1=Operai
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [searchOperaio, setSearchOperaio] = useState("");
  const [searchCommessa, setSearchCommessa] = useState("");

  // Selected worker (tab operai)
  const [selOpRow, setSelOpRow] = useState(null);
  const [selOpDate, setSelOpDate] = useState(null);

  // URL persistence
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const tabQ = Number(sp.get("tab"));
      if (!Number.isNaN(tabQ)) setActiveTab(Math.max(0, Math.min(1, tabQ)));
      const fc = sp.get("fc"); if (fc) setFilterCompany(fc);
      const so = sp.get("so"); if (so) setSearchOperaio(so);
      const sc = sp.get("sc"); if (sc) setSearchCommessa(sc);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set("tab", String(activeTab));
      sp.set("fc", filterCompany);
      sp.set("so", searchOperaio);
      sp.set("sc", searchCommessa);
      window.history.replaceState({}, "", `${window.location.pathname}?${sp.toString()}`);
    } catch {}
  }, [activeTab, filterCompany, searchOperaio, searchCommessa]);

  // Readonly panel data (aggiornato al giorno selezionato)
  const readonlyPanelData = useMemo(() => buildReadonlyPanel(selectedDay), [buildReadonlyPanel, selectedDay]);

  // Editing hook (gestione righe commesse/ore per gruppo nel giorno)
  const { editEntries, addEditRow, removeEditRow, updateEditRow, totalEditHours, saveGroupDay, saveMsg, saveType } = usePmCampoEditing({
    selectedGroup,
    selectedDay,
    commesse,
    groups,
    opPersonal,
    refreshGroups,
    refreshPersonal,
  });
  const handleSaveGroupDay = () => saveGroupDay({ selectedGroupId, selectedDay });

  // Conferma eliminazione gruppo
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState(null);
  const handleDeleteGroup = (id) => { setDeleteGroupId(id); setConfirmOpen(true); };
  const doConfirmDeleteGroup = async () => { if (!deleteGroupId) return; await deleteGroupHook(deleteGroupId); setDeleteGroupId(null); setConfirmOpen(false); };

  // Sync form di edit gruppo
  useEffect(() => {
    const g = groups.find(g => g.id === selectedGroupId);
    if (!g) { setEditGroupName(""); setEditGroupMembers([]); return; }
    setEditGroupName(g.name || "");
    const membersObjs = (g.members || []).map(id => allOperai.find(o => o.id === id)).filter(Boolean);
    setEditGroupMembers(membersObjs);
  }, [selectedGroupId, groups, allOperai]);

  // Azioni gruppi
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || newGroupMembers.length === 0) return;
    await createGroup({ name: newGroupName.trim(), members: newGroupMembers.map(o => o.id) });
    setNewGroupName(""); setNewGroupMembers([]);
  };
  const handleUpdateGroup = async () => { if (!selectedGroupId) return; await updateGroup(selectedGroupId, { name: editGroupName, members: editGroupMembers.map(o => o.id) }); };

  // Assegnazione ore (fast assign)
  const handleAssign = async () => {
    setMsg(""); setMsgType("info");
    if (!selectedGroupId) return setMsgType("error"), setMsg("Seleziona un gruppo.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return setMsgType("error"), setMsg("Data non valida (YYYY-MM-DD).");
    if (!commessa) return setMsgType("error"), setMsg("Seleziona una commessa.");
    if (!oreTot || oreTot <= 0) return setMsgType("error"), setMsg("Ore totali non valide.");
    try {
      const g = groups.find(x => x.id === selectedGroupId);
      if (g && g.members?.length) {
        const tot = Number(oreTot) || 0;
        const perHead = Math.floor(tot / g.members.length);
        const remainder = tot % g.members.length; const sumByOp = {};
        groups.forEach(gg => { (gg.timesheet?.[dateKey] || []).forEach(entry => { Object.entries(entry.assegnazione || {}).forEach(([opId, h]) => { sumByOp[opId] = (sumByOp[opId] || 0) + (Number(h) || 0); }); }); });
        g.members.forEach(opId => { (opPersonal?.[opId]?.[dateKey] || []).forEach(p => { sumByOp[opId] = (sumByOp[opId] || 0) + (Number(p.ore) || 0); }); });
        g.members.forEach((opId, idx) => { const add = perHead + (idx < remainder ? 1 : 0); sumByOp[opId] = (sumByOp[opId] || 0) + add; });
        if (Object.values(sumByOp).some(h => Number(h) > 8)) throw new Error("Supero il limite di 8h per alcuni operai (considerando voci personali). Ridurre le ore.");
      }
    } catch (e) { setMsgType("error"); return setMsg(e.message || "Supero ore 8h"); }
    try { await assignHours({ groupId: selectedGroupId, dateKey, commessa, oreTot: Number(oreTot) }); setMsgType("success"); setMsg("Ore assegnate correttamente al gruppo."); refreshPersonal(); } catch (e) { setMsgType("error"); setMsg(e.message || "Errore nell'assegnazione."); }
  };

  // Tab Operai: aggregazione timesheet per visualizzazione
  const { operaiRows: baseOperaiRows, operaiTsMap } = useOperaiTimesheet({ groups, allOperai, azienda, opPersonal });
  const operaiRows = useMemo(() => baseOperaiRows
    .filter(r => (filterCompany === 'ALL' ? true : r.azienda === filterCompany))
    .filter(r => (searchOperaio.trim() ? r.dipendente.toLowerCase().includes(searchOperaio.trim().toLowerCase()) : true)), [baseOperaiRows, filterCompany, searchOperaio]);
  const opMonthName = useMemo(() => ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][opMonth], [opMonth]);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <PageHeader title="Timesheet PM Campo" description="Gestione gruppi operai e assegnazione ore su commesse" icon={<AccessTimeIcon />} />
        </Box>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}><Tab label="Squadre" /><Tab label="Operai" /></Tabs>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" onClick={() => { const t = new Date().toISOString().slice(0,10); setSelectedDay(t); setDateKey(t); setOperaiToday(); }}>Oggi</Button>
          <Button size="small" onClick={() => { setFilterCompany('ALL'); setSearchOperaio(''); setSearchCommessa(''); }}>Reset filtri</Button>
        </Box>

        {/* TAB 0: Squadre */}
        {activeTab === 0 && (
          <>
            <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                {/* Left: groups */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Nuovo gruppo</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <TextField size="small" label="Nome gruppo" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} sx={{ minWidth: 220 }} />
                    <Autocomplete multiple size="small" options={allOperai} getOptionLabel={o => o.name} value={newGroupMembers} onChange={(_, v) => setNewGroupMembers(v)} renderInput={p => <TextField {...p} label="Operai" />} sx={{ minWidth: 300 }} />
                    <Button variant="contained" onClick={handleCreateGroup}>Crea</Button>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Gruppi esistenti ({azienda})</Typography>
                  {!groups.length ? <Typography variant="body2">Nessun gruppo creato.</Typography> : (
                    <List dense>
                      {groups.map(g => (
                        <ListItem key={g.id} secondaryAction={<IconButton edge="end" onClick={() => handleDeleteGroup(g.id)} aria-label="delete"><DeleteIcon /></IconButton>} sx={{ borderRadius: 1, mb: 1, bgcolor: 'background.default', boxShadow: 1 }}>
                          <ListItemText primary={<Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={600}>{g.name}</Typography><Chip size="small" label={`${g.members.length} operai`} /></Stack>} secondary={g.members.map(id => allOperai.find(o => o.id === id)?.name || id).join(', ')} onClick={() => setSelectedGroupId(g.id)} sx={{ cursor: 'pointer' }} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  {selectedGroupId && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Modifica gruppo selezionato</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <TextField size="small" label="Nome" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} sx={{ minWidth: 220 }} />
                        <Autocomplete multiple size="small" options={allOperai} getOptionLabel={o => o.name} value={editGroupMembers} onChange={(_, v) => setEditGroupMembers(v)} renderInput={p => <TextField {...p} label="Operai" />} sx={{ minWidth: 300 }} />
                        <Button variant="outlined" onClick={handleUpdateGroup}>Salva modifiche</Button>
                      </Stack>
                    </Box>
                  )}
                  <ConfirmDialog open={confirmOpen} title="Elimina gruppo" message="Eliminare questo gruppo?" onClose={() => { setConfirmOpen(false); setDeleteGroupId(null); }} onConfirm={doConfirmDeleteGroup} />
                </Box>

                {/* Right: assign hours */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Assegna ore a gruppo</Typography>
                  <Stack spacing={2}>
                    <TextField select size="small" label="Azienda" value={azienda} onChange={e => { setAzienda(e.target.value); setSelectedGroupId(null); }} sx={{ maxWidth: 220 }}>{['BRT','INWAVE','STEP'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
                    <Autocomplete size="small" options={groups} getOptionLabel={g => g?.name || ''} value={groups.find(g => g.id === selectedGroupId) || null} onChange={(_, g) => setSelectedGroupId(g?.id || null)} renderInput={p => <TextField {...p} label="Gruppo" />} />
                    <TextField size="small" label="Data (YYYY-MM-DD)" value={dateKey} onChange={e => setDateKey(e.target.value)} />
                    <Autocomplete size="small" options={commesse} value={commessa || null} onChange={(_, v) => setCommessa(v || '')} renderInput={p => <TextField {...p} label="Commessa" />} />
                    <TextField size="small" type="number" label="Ore totali gruppo" value={oreTot} onChange={e => setOreTot(e.target.value)} />
                    <Button variant="contained" onClick={handleAssign}>Assegna ore</Button>
                    {msg && <Alert severity={msgType}>{msg}</Alert>}
                    {selectedGroup && (
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Riepilogo {dateKey}</Typography>
                        {selectedGroup.timesheet?.[dateKey]?.length ? (
                          <Stack spacing={1}>
                            {selectedGroup.timesheet[dateKey].map((entry, idx) => (
                              <Box key={idx} sx={{ p: 1.5 }}>
                                <EntryListItem item={{ commessa: entry.commessa, descrizione: `${entry.oreTot}h totali`, ore: undefined }} actions={<Stack direction="row" spacing={1} alignItems="center">{Object.entries(entry.assegnazione || {}).map(([opId, h]) => { const name = allOperai.find(o => o.id === opId)?.name || opId; return <Chip key={opId} size="small" label={`${name}: ${h}h`} />; })}</Stack>} />
                              </Box>
                            ))}
                          </Stack>
                        ) : <Typography variant="body2">Nessuna assegnazione trovata per questa data.</Typography>}
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ mt: 3, boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Calendario e riepiloghi</Typography>
              <WorkCalendar data={calendarData} selectedDay={selectedDay} onDaySelect={setSelectedDay} renderDayTooltip={renderDayTooltip} fixedDayWidth gap={0} distributeGaps variant="wide" selectorVariant="full" selectorLabels="full" />
              <Box sx={{ mt: 1.5 }}><TileLegend /></Box>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2, alignItems: 'stretch' }}>
                <Box sx={{ flex: 1, p: 2, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Tutte le squadre — {selectedDay}</Typography>
                  <DayEntryPanel selectedDay={selectedDay} data={readonlyPanelData} commesse={commesse} mode="readonly" />
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Squadra selezionata — {selectedGroup?.name || 'N/D'}</Typography>
                  <Stack spacing={1}>
                    {editEntries.length === 0 && <Typography variant="body2">Nessuna voce. Aggiungi una riga per questa squadra.</Typography>}
                    {editEntries.map((row, idx) => (
                      <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                        <Autocomplete size="small" options={commesse} value={row.commessa || null} onChange={(_, v) => updateEditRow(idx, { commessa: v || '' })} renderInput={p => <TextField {...p} label="Commessa" />} sx={{ minWidth: 160 }} />
                        <TextField size="small" type="number" label="Ore" value={row.oreTot} onChange={e => updateEditRow(idx, { oreTot: Math.max(0, Number(e.target.value)) })} sx={{ width: 100 }} />
                        <IconButton color="error" onClick={() => removeEditRow(idx)}><DeleteIcon /></IconButton>
                      </Stack>
                    ))}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Button variant="outlined" size="small" onClick={addEditRow}>Aggiungi riga di commessa</Button>
                      <Chip label={`Totale: ${totalEditHours}h`} size="small" />
                      <Box sx={{ flex: 1 }} />
                      <Button variant="contained" size="small" onClick={handleSaveGroupDay} disabled={!selectedGroupId}>Salva</Button>
                    </Stack>
                    {saveMsg && <Alert severity={saveType}>{saveMsg}</Alert>}
                    {selectedGroup && selectedGroup.members?.length > 0 && (() => { const perHead = Math.floor((Number(totalEditHours) || 0) / selectedGroup.members.length); const remainder = (Number(totalEditHours) || 0) % selectedGroup.members.length; const maxPerWorker = perHead + (remainder > 0 ? 1 : 0); return maxPerWorker > 8 ? <Alert severity="warning">Attenzione: con il riparto attuale alcuni operai superano le 8h/giorno (≈ {maxPerWorker}h).</Alert> : null; })()}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </>
        )}

        {/* TAB 1: Operai */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3, boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
              <TextField select size="small" label="Azienda" value={filterCompany} onChange={e => setFilterCompany(e.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="ALL">Tutte</MenuItem>
                <MenuItem value="BRT">BRT</MenuItem>
                <MenuItem value="INWAVE">INWAVE</MenuItem>
                <MenuItem value="STEP">STEP</MenuItem>
              </TextField>
              <TextField size="small" label="Operaio" value={searchOperaio} onChange={e => setSearchOperaio(e.target.value)} sx={{ minWidth: 200 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }} />
              <TextField size="small" label="Commessa" value={searchCommessa} onChange={e => setSearchCommessa(e.target.value)} sx={{ minWidth: 180 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }} />
              <Box sx={{ flex: 1 }} />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>Timesheet Operai — {azienda}</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={handlePrevMonth}><ArrowBackIosIcon fontSize="inherit" /></IconButton>
                <Typography variant="body2" sx={{ width: 140, textAlign: 'center' }}>{opMonthName} {opYear}</Typography>
                <IconButton size="small" onClick={handleNextMonth}><ArrowForwardIosIcon fontSize="inherit" /></IconButton>
              </Stack>
            </Stack>
            <EmployeeMonthGrid year={opYear} month={opMonth} rows={operaiRows.filter(r => !searchCommessa.trim() || Object.entries(operaiTsMap[r.id] || {}).some(([key, recs]) => key.startsWith(`${opYear}-${String(opMonth + 1).padStart(2,'0')}`) && (recs || []).some(it => String(it.commessa).toLowerCase().includes(searchCommessa.trim().toLowerCase()))))} tsMap={operaiTsMap} onDayClick={(row, dateKey) => { setSelOpRow(row); setSelOpDate(dateKey); }} height={420} dayWidth={52} dayHeight={28} dipWidth={240} azWidth={130} />
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, boxShadow: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Dettaglio operaio: {selOpRow?.dipendente || '—'} — {selOpDate || 'seleziona un giorno'}</Typography>
              {selOpRow && selOpDate ? <OperaioEditor opRow={selOpRow} dateKey={selOpDate} tsMap={operaiTsMap} commesse={commesse} onSaved={() => { refreshGroups(); refreshPersonal(); }} /> : <Alert severity="info">Seleziona una cella nella griglia per vedere il dettaglio giornaliero.</Alert>}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
