import React from "react";
import { Box, Container, Stack, Typography, TextField, Button, Chip, Alert, Divider, Autocomplete, List, ListItem, ListItemText, IconButton, MenuItem, Tabs, Tab, InputAdornment, } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmDialog from "../../components/ConfirmDialog";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PageHeader from "../../Components/PageHeader";
import WorkCalendar from "../../Components/Calendar/WorkCalendar";
import DayEntryPanel from "../../Components/Calendar/DayEntryPanel";
import EmployeeMonthGrid from "../../Components/Calendar/EmployeeMonthGrid";
import OperaioEditor from "../../Components/Timesheet/OperaioEditor";
import EntryListItem from "../../components/Entries/EntryListItem";
import TileLegend from "../../Components/Calendar/TileLegend";
import {
  getOperaiByAzienda,
  createPmGroup,
  listPmGroups,
  updatePmGroup,
  deletePmGroup,
  assignHoursToGroup,
  getActiveCommesseForEmployee,
  getOperaioPersonalMap,
} from "../../mocks/ProjectMock";

// Pagina Timesheet per PM da campo: gestione gruppi e assegnazione ore
export default function PMCampoTimesheet() {
  const [azienda, setAzienda] = React.useState("BRT");
  const [allOperai, setAllOperai] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newGroupMembers, setNewGroupMembers] = React.useState([]);

  // Assegnazione ore
  const [selectedGroupId, setSelectedGroupId] = React.useState(null);
  // Edit gruppo selezionato
  const [editGroupName, setEditGroupName] = React.useState("");
  const [editGroupMembers, setEditGroupMembers] = React.useState([]);
  const [dateKey, setDateKey] = React.useState(new Date().toISOString().slice(0, 10));
  const [commesse, setCommesse] = React.useState([]);
  const [commessa, setCommessa] = React.useState("");
  const [oreTot, setOreTot] = React.useState(8);
  const [msg, setMsg] = React.useState("");
  const [msgType, setMsgType] = React.useState("info");
  const selectedGroup = React.useMemo(() => groups.find((g) => g.id === selectedGroupId) || null, [groups, selectedGroupId]);
  const [selectedDay, setSelectedDay] = React.useState(new Date().toISOString().slice(0, 10));
  // Mantieni allineata la data di assegnazione al giorno selezionato sul calendario
  React.useEffect(() => {
    setDateKey(selectedDay);
  }, [selectedDay]);

  // Sezione 2: gestione timesheet operai singoli (derivata dalle assegnazioni dei gruppi)
  const today = React.useMemo(() => new Date(), []);
  const [opYear, setOpYear] = React.useState(today.getFullYear());
  const [opMonth, setOpMonth] = React.useState(today.getMonth()); // 0-based
  const [selOpRow, setSelOpRow] = React.useState(null); // { id, dipendente, azienda }
  const [selOpDate, setSelOpDate] = React.useState(null); // 'YYYY-MM-DD'
  // UI: switch macro-sections and filters (like admin)
  const [activeTab, setActiveTab] = React.useState(0); // 0=Squadre, 1=Operai
  // Filters state (must be declared before effects that reference them)
  const [filterCompany, setFilterCompany] = React.useState("ALL");
  const [searchOperaio, setSearchOperaio] = React.useState("");
  const [searchCommessa, setSearchCommessa] = React.useState("");
  // Query string persistence for tab/filters
  React.useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const tabQ = Number(sp.get("tab"));
      if (!Number.isNaN(tabQ)) setActiveTab(Math.max(0, Math.min(1, tabQ)));
      const fc = sp.get("fc"); if (fc) setFilterCompany(fc);
      const so = sp.get("so"); if (so) setSearchOperaio(so);
      const sc = sp.get("sc"); if (sc) setSearchCommessa(sc);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set("tab", String(activeTab));
      sp.set("fc", filterCompany);
      sp.set("so", searchOperaio);
      sp.set("sc", searchCommessa);
      const url = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, "", url);
    } catch {}
  }, [activeTab, filterCompany, searchOperaio, searchCommessa]);

  // Deriva una mappa data->records simulati a partire dalle assegnazioni dei gruppi
  // Ogni record: { commessa, ore, descrizione } aggregato per giorno e gruppo come riga separata
  const calendarData = React.useMemo(() => {
    const map = {};
    for (const g of groups) {
      const ts = g.timesheet || {};
      for (const [date, entries] of Object.entries(ts)) {
        if (!map[date]) map[date] = [];
        // Somma ore totali del gruppo su quella data (per tutte le commesse di quella data)
        const totForDate = entries.reduce((s, e) => s + (Number(e.oreTot) || 0), 0);
        if (totForDate > 0) {
          map[date].push({ commessa: `GRP:${g.name}`, ore: totForDate, descrizione: `Ore totali gruppo ${g.name}` });
        }
      }
    }
    return map;
  }, [groups]);

  // Tooltip renderer per giorno: mostra elenco gruppi e ore totali su quella data
  const renderDayTooltip = React.useCallback((dateKey) => {
    const lines = [];
    for (const g of groups) {
      const entries = g.timesheet?.[dateKey] || [];
      if (!entries.length) continue;
      const tot = entries.reduce((s, e) => s + (Number(e.oreTot) || 0), 0);
      lines.push(`${g.name}: ${tot}h`);
    }
    if (!lines.length) return "";
    return (
      <Box>
        {lines.map((l, i) => (
          <Typography key={i} variant="caption" sx={{ display: "block" }}>{l}</Typography>
        ))}
      </Box>
    );
  }, [groups]);

  // Costruisci una vista “flat” per DayEntryPanel in sola lettura aggregando le voci dei gruppi
  const readonlyPanelData = React.useMemo(() => {
    const map = {};
    const entries = [];
    for (const g of groups) {
      const dayEntries = g.timesheet?.[selectedDay] || [];
      for (const e of dayEntries) {
        entries.push({ dipendente: g.name, commessa: e.commessa, ore: Number(e.oreTot) || 0, descrizione: `Gruppo ${g.name}` });
      }
    }
    if (entries.length) map[selectedDay] = entries;
    return map;
  }, [groups, selectedDay]);

  // Data per DayEntryPanel del gruppo selezionato (editabile solo per visualizzazione coesa)
  const selectedGroupPanelData = React.useMemo(() => {
    const map = {};
    const g = selectedGroup;
    const entries = [];
    if (g) {
      const dayEntries = g.timesheet?.[selectedDay] || [];
      for (const e of dayEntries) {
        entries.push({ dipendente: g.name, commessa: e.commessa, ore: Number(e.oreTot) || 0, descrizione: `Gruppo ${g.name}` });
      }
    }
    if (entries.length) map[selectedDay] = entries;
    return map;
  }, [selectedGroup, selectedDay]);

  // Stato editor per squadra selezionata: lista entries [{ commessa, oreTot }]
  const [editEntries, setEditEntries] = React.useState([]);
  React.useEffect(() => {
    const g = selectedGroup;
    const dayEntries = g?.timesheet?.[selectedDay] || [];
    setEditEntries(dayEntries.map((e) => ({ commessa: e.commessa, oreTot: Number(e.oreTot) || 0 })));
  }, [selectedGroup, selectedDay]);

  const totalEditHours = React.useMemo(() => editEntries.reduce((s, e) => s + (Number(e.oreTot) || 0), 0), [editEntries]);

  const addEditRow = () => setEditEntries((arr) => [...arr, { commessa: commesse[0] || "", oreTot: 1 }]);
  const removeEditRow = (idx) => setEditEntries((arr) => arr.filter((_, i) => i !== idx));
  const updateEditRow = (idx, patch) => setEditEntries((arr) => arr.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  const [saveMsg, setSaveMsg] = React.useState("");
  const [saveType, setSaveType] = React.useState("info");
  const handleSaveGroupDay = async () => {
    setSaveMsg("");
    setSaveType("info");
    if (!selectedGroupId) {
      setSaveType("error");
      return setSaveMsg("Seleziona una squadra.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDay)) {
      setSaveType("error");
      return setSaveMsg("Data non valida.");
    }
    const sanitized = editEntries.filter((e) => e.commessa && Number(e.oreTot) > 0);
    // Pre-check: stima riparto e verifica max 8h per operaio includendo voci personali note in mappa
    try {
      const g = selectedGroup;
      if (g && g.members?.length) {
        const perHeadTotals = {};
        const tot = sanitized.reduce((s, e) => s + (Number(e.oreTot) || 0), 0);
        const perHead = Math.floor((Number(tot) || 0) / g.members.length);
        const remainder = (Number(tot) || 0) % g.members.length;
        g.members.forEach((opId, idx) => {
          perHeadTotals[opId] = perHead + (idx < remainder ? 1 : 0);
        });
        // Somma ore già presenti da altri gruppi nella stessa data
        const sumByOp = {};
        groups.forEach((gg) => {
          if (gg.id === g.id) return;
          const list = gg.timesheet?.[selectedDay] || [];
          list.forEach((entry) => {
            Object.entries(entry.assegnazione || {}).forEach(([opId, ore]) => {
              sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
            });
          });
        });
        // Somma voci personali
        g.members.forEach((opId) => {
          const personal = opPersonal?.[opId]?.[selectedDay] || [];
          personal.forEach((p) => {
            sumByOp[opId] = (sumByOp[opId] || 0) + (Number(p.ore) || 0);
          });
        });
        // Aggiungi proposta corrente
        Object.entries(perHeadTotals).forEach(([opId, ore]) => {
          sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
        });
        const viol = Object.entries(sumByOp).find(([_, h]) => Number(h) > 8);
        if (viol) throw new Error("Questa modifica supera le 8h per alcuni operai (considerando voci personali). Riduci il totale.");
      }
    } catch (e) {
      setSaveType("error");
      return setSaveMsg(e.message || "Supero ore 8h");
    }
    try {
      const { updateGroupDayEntries } = await import("../../mocks/ProjectMock");
      await updateGroupDayEntries({ groupId: selectedGroupId, dateKey: selectedDay, entries: sanitized });
      setSaveType("success");
      setSaveMsg("Salvato. Distribuzione aggiornata tra i membri.");
      refreshGroups();
    } catch (e) {
      setSaveType("error");
      setSaveMsg(e.message || "Errore salvataggio");
    }
  };

  // Carica operai e gruppi per azienda
  React.useEffect(() => {
    let mounted = true;
    getOperaiByAzienda(azienda).then((ops) => mounted && setAllOperai(ops));
    listPmGroups(azienda).then((gs) => mounted && setGroups(gs));
    // Per commesse uso lista default di un dipendente fittizio (emp-001) come base
    getActiveCommesseForEmployee("emp-001").then((list) => mounted && setCommesse(list));
    return () => {
      mounted = false;
    };
  }, [azienda]);

  const refreshGroups = React.useCallback(() => {
    listPmGroups(azienda).then(setGroups);
  }, [azienda]);

  // Mappa voci personali per operaio
  const [opPersonal, setOpPersonal] = React.useState({});
  const refreshPersonal = React.useCallback(() => {
    getOperaioPersonalMap().then(setOpPersonal);
  }, []);
  // Carica personali all'avvio e quando cambia azienda (per coerenza ricarico sempre)
  React.useEffect(() => { refreshPersonal(); }, [refreshPersonal, azienda]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || newGroupMembers.length === 0) return;
    await createPmGroup({ name: newGroupName.trim(), members: newGroupMembers.map((o) => o.id), azienda });
    setNewGroupName("");
    setNewGroupMembers([]);
    refreshGroups();
  };

  const handleDeleteGroup = async (groupId) => {
    // open confirm dialog
    setDeleteGroupId(groupId);
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteGroupId, setDeleteGroupId] = React.useState(null);

  const doConfirmDeleteGroup = async () => {
    if (!deleteGroupId) return;
    await deletePmGroup(deleteGroupId);
    if (selectedGroupId === deleteGroupId) setSelectedGroupId(null);
    setDeleteGroupId(null);
    setConfirmOpen(false);
    refreshGroups();
  };

  // Sync stato di edit quando cambia selezione o elenco gruppi
  React.useEffect(() => {
    const g = groups.find((x) => x.id === selectedGroupId);
    if (g) {
      setEditGroupName(g.name || "");
      const membersObjs = (g.members || []).map((id) => allOperai.find((o) => o.id === id)).filter(Boolean);
      setEditGroupMembers(membersObjs);
    } else {
      setEditGroupName("");
      setEditGroupMembers([]);
    }
  }, [selectedGroupId, groups, allOperai]);

  const handleUpdateGroup = async () => {
    if (!selectedGroupId) return;
    await updatePmGroup(selectedGroupId, {
      name: editGroupName,
      members: editGroupMembers.map((o) => o.id),
    });
    refreshGroups();
  };

  const handleAssign = async () => {
    setMsg("");
    setMsgType("info");
    if (!selectedGroupId) {
      setMsgType("error");
      return setMsg("Seleziona un gruppo.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setMsgType("error");
      return setMsg("Data non valida (YYYY-MM-DD).");
    }
    if (!commessa) {
      setMsgType("error");
      return setMsg("Seleziona una commessa.");
    }
    if (!oreTot || oreTot <= 0) {
      setMsgType("error");
      return setMsg("Ore totali non valide.");
    }
    // Pre-check: verifica riparto con voci personali
    try {
      const g = groups.find((x) => x.id === selectedGroupId);
      if (g && g.members?.length) {
        const tot = Number(oreTot) || 0;
        const perHead = Math.floor(tot / g.members.length);
        const remainder = tot % g.members.length;
        const sumByOp = {};
        // Ore da tutti i gruppi in quella data
        groups.forEach((gg) => {
          const list = gg.timesheet?.[dateKey] || [];
          list.forEach((entry) => {
            Object.entries(entry.assegnazione || {}).forEach(([opId, ore]) => {
              sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
            });
          });
        });
        // Voci personali
        g.members.forEach((opId) => {
          const personal = opPersonal?.[opId]?.[dateKey] || [];
          personal.forEach((p) => {
            sumByOp[opId] = (sumByOp[opId] || 0) + (Number(p.ore) || 0);
          });
        });
        // Proposta corrente
        g.members.forEach((opId, idx) => {
          const add = perHead + (idx < remainder ? 1 : 0);
          sumByOp[opId] = (sumByOp[opId] || 0) + add;
        });
        const viol = Object.entries(sumByOp).find(([_, h]) => Number(h) > 8);
        if (viol) throw new Error("Supero il limite di 8h per alcuni operai (considerando voci personali). Ridurre le ore.");
      }
    } catch (e) {
      setMsgType("error");
      return setMsg(e.message || "Supero ore 8h");
    }

    try {
      await assignHoursToGroup({ groupId: selectedGroupId, dateKey, commessa, oreTot: Number(oreTot) });
      setMsgType("success");
      setMsg("Ore assegnate correttamente al gruppo.");
      refreshGroups();
    } catch (e) {
      setMsgType("error");
      setMsg(e.message || "Errore nell'assegnazione.");
    }
  };

  // === Operai: righe e timesheet derivato dalle squadre correnti dell'azienda ===
  const operaiRows = React.useMemo(
    () => (allOperai || [])
      .filter((o) => (filterCompany === "ALL" ? true : o.azienda === filterCompany))
      .filter((o) => (searchOperaio.trim() ? o.name.toLowerCase().includes(searchOperaio.trim().toLowerCase()) : true))
      .map((o) => ({ id: o.id, dipendente: o.name, azienda: o.azienda })),
    [allOperai, filterCompany, searchOperaio]
  );

  const operaiTsMap = React.useMemo(() => {
    const map = {};
    const nameById = new Map((allOperai || []).map((o) => [o.id, o.name]));
    for (const g of groups || []) {
      if (azienda && g.azienda !== azienda) continue;
      const ts = g.timesheet || {};
      for (const [dateKey, entries] of Object.entries(ts)) {
        for (const e of entries) {
          const assegnazione = e.assegnazione || {};
          for (const [opId, ore] of Object.entries(assegnazione)) {
            const oreNum = Number(ore) || 0;
            if (oreNum <= 0) continue;
            if (!map[opId]) map[opId] = {};
            if (!map[opId][dateKey]) map[opId][dateKey] = [];
            map[opId][dateKey].push({
              dipendente: nameById.get(opId) || opId,
              commessa: e.commessa,
              ore: oreNum,
              descrizione: `Da gruppo ${g.name}`,
            });
          }
        }
      }
    }
    // Merge voci personali (FERIE/MALATTIA/PERMESSO)
    Object.entries(opPersonal || {}).forEach(([opId, days]) => {
      Object.entries(days || {}).forEach(([dateKey, arr]) => {
        if (!map[opId]) map[opId] = {};
        if (!map[opId][dateKey]) map[opId][dateKey] = [];
        (arr || []).forEach((e) => {
          map[opId][dateKey].push({
            dipendente: nameById.get(opId) || opId,
            commessa: e.commessa,
            ore: Number(e.ore) || 0,
            descrizione: "Personale",
          });
        });
      });
    });
    return map;
  }, [groups, allOperai, azienda, opPersonal]);

  const opMonthName = React.useMemo(
    () => ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][opMonth],
    [opMonth]
  );

  const handlePrevMonth = () => {
    if (opMonth === 0) {
      setOpMonth(11);
      setOpYear((y) => y - 1);
    } else setOpMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (opMonth === 11) {
      setOpMonth(0);
      setOpYear((y) => y + 1);
    } else setOpMonth((m) => m + 1);
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", overflow: "auto" }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <PageHeader title="Timesheet PM Campo" description="Gestione gruppi operai e assegnazione ore su commesse" icon={<AccessTimeIcon />} />
        </Box>

        {/* Selector: Squadre / Operai */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Squadre" />
            <Tab label="Operai" />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          {/* Pulsanti rapidi */}
          <Button size="small" variant="outlined" onClick={() => {
            // Oggi: porta i contesti alle date di oggi
            const todayStr = new Date().toISOString().slice(0,10);
            setSelectedDay(todayStr);
            setDateKey(todayStr);
            const t = new Date(); setOpYear(t.getFullYear()); setOpMonth(t.getMonth());
          }}>Oggi</Button>
          <Button size="small" onClick={() => { setFilterCompany('ALL'); setSearchOperaio(''); setSearchCommessa(''); }}>Reset filtri</Button>
        </Box>

  {/* Sezione 1: Gestione Squadre (visibile solo tab=0) */}
  {activeTab === 0 && (
  <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main", p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
            {/* Colonna sinistra: gestione gruppi */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Nuovo gruppo</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField label="Nome gruppo" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} size="small" sx={{ minWidth: 220 }} />
                <Autocomplete
                  multiple
                  size="small"
                  options={allOperai}
                  getOptionLabel={(o) => o.name}
                  value={newGroupMembers}
                  onChange={(_, v) => setNewGroupMembers(v)}
                  renderInput={(params) => <TextField {...params} label="Operai" />}
                  sx={{ minWidth: 300 }}
                />
                <Button variant="contained" onClick={handleCreateGroup}>Crea</Button>
              </Stack>

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Gruppi esistenti ({azienda})</Typography>
              {!groups.length ? (
                <Typography variant="body2">Nessun gruppo creato.</Typography>
              ) : (
                <List dense>
                  {groups.map((g) => (
                    <ListItem
                      key={g.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleDeleteGroup(g.id)} aria-label="delete">
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{ borderRadius: 1, mb: 1, bgcolor: "background.default", boxShadow: 1 }}
                    >
                      <ListItemText
                        primary={<Stack direction="row" spacing={1} alignItems="center"><Typography fontWeight={600}>{g.name}</Typography><Chip size="small" label={`${g.members.length} operai`} /></Stack>}
                        secondary={g.members.map((id) => allOperai.find((o) => o.id === id)?.name || id).join(", ")}
                        onClick={() => setSelectedGroupId(g.id)}
                        sx={{ cursor: "pointer" }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Edit gruppo selezionato */}
              {selectedGroupId && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1, boxShadow: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Modifica gruppo selezionato</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <TextField size="small" label="Nome" value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} sx={{ minWidth: 220 }} />
                    <Autocomplete
                      multiple
                      size="small"
                      options={allOperai}
                      getOptionLabel={(o) => o.name}
                      value={editGroupMembers}
                      onChange={(_, v) => setEditGroupMembers(v)}
                      renderInput={(params) => <TextField {...params} label="Operai" />}
                      sx={{ minWidth: 300 }}
                    />
                    <Button variant="outlined" onClick={handleUpdateGroup}>Salva modifiche</Button>
                  </Stack>
                </Box>
              )}
              <ConfirmDialog
                open={confirmOpen}
                title="Elimina gruppo"
                message="Eliminare questo gruppo?"
                onClose={() => { setConfirmOpen(false); setDeleteGroupId(null); }}
                onConfirm={doConfirmDeleteGroup}
              />
            </Box>

            {/* Colonna destra: assegnazione ore */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Assegna ore a gruppo</Typography>
              <Stack spacing={2}>
                <TextField select label="Azienda" value={azienda} onChange={(e) => setAzienda(e.target.value)} size="small" sx={{ maxWidth: 220 }}>
                  {[
                    { value: "BRT", label: "BRT" },
                    { value: "INWAVE", label: "INWAVE" },
                    { value: "STEP", label: "STEP" },
                  ].map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
                <Autocomplete
                  size="small"
                  options={groups}
                  getOptionLabel={(g) => g?.name || ""}
                  value={groups.find((g) => g.id === selectedGroupId) || null}
                  onChange={(_, g) => setSelectedGroupId(g?.id || null)}
                  renderInput={(p) => <TextField {...p} label="Gruppo" />}
                />
                <TextField label="Data (YYYY-MM-DD)" value={dateKey} onChange={(e) => setDateKey(e.target.value)} size="small" />
                <Autocomplete
                  size="small"
                  options={commesse}
                  value={commessa || null}
                  onChange={(_, v) => setCommessa(v || "")}
                  renderInput={(p) => <TextField {...p} label="Commessa" />}
                />
                <TextField label="Ore totali gruppo" type="number" value={oreTot} onChange={(e) => setOreTot(e.target.value)} size="small" />
                <Button variant="contained" onClick={handleAssign}>Assegna ore</Button>
                {msg && <Alert severity={msgType}>{msg}</Alert>}

                {/* Riepilogo assegnazioni per data */}
                {selectedGroup && (
                  <Box sx={{ mt: 1, p: 2, bgcolor: "background.default", borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Riepilogo {dateKey}</Typography>
                    {selectedGroup.timesheet && selectedGroup.timesheet[dateKey]?.length ? (
                      <Stack spacing={1}>
                        {selectedGroup.timesheet[dateKey].map((entry, idx) => (
                          <Box key={idx} sx={{ p: 1.5 }}>
                            {/* Use EntryListItem to render the commessa + oreTot and assignments as chips in the description */}
                            <EntryListItem
                              item={{ commessa: entry.commessa, descrizione: `${entry.oreTot}h totali`, ore: undefined }}
                              actions={(
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {Object.entries(entry.assegnazione || {}).map(([opId, ore]) => {
                                    const name = allOperai.find((o) => o.id === opId)?.name || opId;
                                    return <Chip key={opId} size="small" label={`${name}: ${ore}h`} />;
                                  })}
                                </Stack>
                              )}
                            />
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2">Nessuna assegnazione trovata per questa data.</Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
  </Box>
  )}

  {/* Sezione 1b: Calendario gruppi e editor giornaliero (tab=0) */}
  {activeTab === 0 && (
  <Box sx={{ mt: 3, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main", p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Calendario e riepiloghi</Typography>
          <WorkCalendar
            data={calendarData}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            renderDayTooltip={renderDayTooltip}
            fixedDayWidth
            gap={0}
            distributeGaps
            variant="wide"
            selectorVariant="full"
            selectorLabels="full"
          />

          <Box sx={{ mt: 1.5 }}>
            <TileLegend />
          </Box>

          {/* Due pannelli: layout fluido a tutta larghezza con wrap */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2, alignItems: "stretch", width: "100%" }}>
            <Box sx={{ flex: 1, minWidth: 0, p: 2, bgcolor: "background.default", borderRadius: 1, boxShadow: 1, display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Tutte le squadre — {selectedDay}</Typography>
              <DayEntryPanel
                selectedDay={selectedDay}
                data={readonlyPanelData}
                onAddRecord={() => {}}
                commesse={commesse}
                readOnly
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, p: 2, bgcolor: "background.default", borderRadius: 1, boxShadow: 1, display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Squadra selezionata — {selectedGroup?.name || "N/D"}</Typography>
              {/* Editor semplice per commesse/ore del giorno */}
              <Stack spacing={1}>
                {editEntries.length === 0 && (
                  <Typography variant="body2">Nessuna voce. Aggiungi una riga per questa squadra.</Typography>
                )}
                {editEntries.map((row, idx) => (
                  <Stack key={idx} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <Autocomplete
                      size="small"
                      options={commesse}
                      value={row.commessa || null}
                      onChange={(_, v) => updateEditRow(idx, { commessa: v || "" })}
                      renderInput={(p) => <TextField {...p} label="Commessa" />}
                      sx={{ minWidth: 160 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Ore"
                      value={row.oreTot}
                      onChange={(e) => updateEditRow(idx, { oreTot: Math.max(0, Number(e.target.value)) })}
                      sx={{ width: 100 }}
                    />
                    <IconButton color="error" onClick={() => removeEditRow(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={addEditRow}>Aggiungi riga di commessa</Button>
                  <Chip label={`Totale: ${totalEditHours}h`} size="small" />
                  <Box sx={{ flex: 1 }} />
                    <Button variant="contained" size="small" onClick={handleSaveGroupDay} disabled={!selectedGroupId}>Salva</Button>
                </Stack>
                {saveMsg && <Alert severity={saveType}>{saveMsg}</Alert>}
                {/* Avviso se il riparto superasse 8h per operaio */}
                {selectedGroup && selectedGroup.members?.length > 0 && (() => {
                  const perHead = Math.floor((Number(totalEditHours) || 0) / selectedGroup.members.length);
                  const remainder = (Number(totalEditHours) || 0) % selectedGroup.members.length;
                  const maxPerWorker = perHead + (remainder > 0 ? 1 : 0);
                  return maxPerWorker > 8 ? (
                    <Alert severity="warning">Attenzione: con il riparto attuale alcuni operai superano le 8h/giorno (≈ {maxPerWorker}h). Riduci il totale o il numero di righe.</Alert>
                  ) : null;
                })()}
              </Stack>
            </Box>
          </Stack>
        </Box>
        )}

        {/* Sezione 2: Timesheet Operai (tab=1) */}
        {activeTab === 1 && (
        <Box sx={{ mt: 3, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main", p: 2 }}>
          {/* Filtri come amministrazione */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
            <TextField
              select size="small" label="Azienda" value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)} sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">Tutte</MenuItem>
              <MenuItem value="BRT">BRT</MenuItem>
              <MenuItem value="INWAVE">INWAVE</MenuItem>
              <MenuItem value="STEP">STEP</MenuItem>
            </TextField>
            <TextField
              size="small" label="Operaio" value={searchOperaio}
              onChange={(e) => setSearchOperaio(e.target.value)} sx={{ minWidth: 200 }}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
            />
            <TextField
              size="small" label="Commessa" value={searchCommessa}
              onChange={(e) => setSearchCommessa(e.target.value)} sx={{ minWidth: 180 }}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
            />
            <Box sx={{ flex: 1 }} />
            {/* I selettori mese sono mostrati sotto nell'intestazione, rimosso duplicato qui */}
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ flex: 1 }}>Timesheet Operai — {azienda}</Typography>
            {/* Selettori mese */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton size="small" onClick={handlePrevMonth}><ArrowBackIosIcon fontSize="inherit" /></IconButton>
              <Typography variant="body2" sx={{ width: 140, textAlign: "center" }}>{opMonthName} {opYear}</Typography>
              <IconButton size="small" onClick={handleNextMonth}><ArrowForwardIosIcon fontSize="inherit" /></IconButton>
            </Stack>
          </Stack>

          <EmployeeMonthGrid
            year={opYear}
            month={opMonth}
            rows={operaiRows.filter((r) => !searchCommessa.trim() || Object.entries(operaiTsMap[r.id] || {}).some(([key, recs]) => key.startsWith(`${opYear}-${String(opMonth+1).padStart(2,'0')}`) && (recs || []).some((it) => String(it.commessa).toLowerCase().includes(searchCommessa.trim().toLowerCase()))))}
            tsMap={operaiTsMap}
            onDayClick={(row, dateKey) => { setSelOpRow(row); setSelOpDate(dateKey); }}
            height={420}
            dayWidth={52}
            dayHeight={28}
            dipWidth={240}
            azWidth={130}
          />

          <Box sx={{ mt: 2, p: 2, bgcolor: "background.default", borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Dettaglio operaio: {selOpRow?.dipendente || "—"} — {selOpDate || "seleziona un giorno"}
            </Typography>
            {selOpRow && selOpDate ? (
              <OperaioEditor
                opRow={selOpRow}
                dateKey={selOpDate}
                tsMap={operaiTsMap}
                commesse={commesse}
                onSaved={() => { /* refresh both groups and personal */ refreshGroups(); refreshPersonal(); }}
              />
            ) : (
              <Alert severity="info">Seleziona una cella nella griglia per vedere il dettaglio giornaliero.</Alert>
            )}
          </Box>
        </Box>
        )}
      </Container>
    </Box>
  );
}

// OperaioEditor estratto in componente riusabile
