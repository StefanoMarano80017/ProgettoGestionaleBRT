import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { semanticHash, semanticEqual } from '@hooks/Timesheet/utils/semanticTimesheet';
import { Box, Container, Alert, Button, Typography } from '@mui/material';
// legend icons moved into StagedChangesPanel
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import PageHeader from '@components/PageHeader';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeCard from '@components/BadgeCard/Badge';
import StagedChangesPanel from '@components/Timesheet/StagedChangesPanel';
import WorkCalendar from '@components/Calendar/WorkCalendar';
import DayEntryPanel from '@components/Calendar/DayEntryPanel';
import { getTimesheetForEmployee, projectsMock } from '@mocks/ProjectMock';
import { TimesheetProvider, useTimesheetContext, useReferenceData } from '@/Hooks/Timesheet';
import useDayEditBuffer from '@/Hooks/Timesheet/useDayEditBuffer';
import useMonthCompleteness from '@/Hooks/Timesheet/useMonthCompleteness';
import CommesseDashboard from '@components/DipendenteHomePage/CommesseDashboard';

const EMP_ID = 'emp-001';

function InnerDipendente() {
  const ctx = useTimesheetContext();
  const [selectedDay, setSelectedDay] = useState(null);
  const [draftsByDay, setDraftsByDay] = useState({});
  const loadedRef = useRef(false);

  // Initial load
  // Load employee data only once (ctx.setEmployeeData is stable)
  useEffect(() => {
    let cancelled = false;
    if (loadedRef.current) return;
    (async () => {
      try {
        const ts = await getTimesheetForEmployee(EMP_ID);
        if (!cancelled) {
          ctx.setEmployeeData(EMP_ID, ts);
          loadedRef.current = true;
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [ctx.setEmployeeData]);

  const prev = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; }, []);
  const baseForCompleteness = ctx.dataMap?.[EMP_ID] || projectsMock || {};
  const { missingDates: missingPrev, missingSet: missingPrevSet } = useMonthCompleteness({ tsMap: { [EMP_ID]: baseForCompleteness }, id: EMP_ID, year: prev.getFullYear(), month: prev.getMonth() });
  const { commesse: commesseList, loading: commesseLoading } = useReferenceData({ commesse: true, personale: false, pmGroups: false, employeeId: EMP_ID });

  const mergedData = useMemo(() => {
    const out = {};
    const base = ctx.dataMap?.[EMP_ID] || {};
    const staged = ctx.stagedMap?.[EMP_ID] || {};
    Object.entries(base).forEach(([k, v]) => { out[k] = v; });
    Object.entries(staged).forEach(([k, v]) => { if (v === null) { delete out[k]; } else { out[k] = Array.isArray(v) ? v : []; } });
    Object.entries(draftsByDay).forEach(([k, v]) => { if (!staged[k]) out[k] = Array.isArray(v) ? v : []; });
    return out;
  }, [ctx.dataMap, ctx.stagedMap, draftsByDay]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isBadgiatoToday = useMemo(() => Boolean(mergedData?.[todayKey]?.length), [mergedData, todayKey]);

  const dayBuffer = useDayEditBuffer({ employeeId: EMP_ID, dayKey: selectedDay, dataMap: { [EMP_ID]: ctx.dataMap?.[EMP_ID] || {} }, stagedMap: ctx.stagedMap });

  useEffect(() => {
    if (!selectedDay) return;
    if (dayBuffer.dirty) {
      // signature to avoid unnecessary setState churn
      const draftArr = Array.isArray(dayBuffer.draft) ? dayBuffer.draft : [];
      const sig = draftArr.map(r => `${r.commessa||''}:${r.ore||0}:${r.descrizione||''}`).join('|');
      setDraftsByDay(prev => {
        const existing = prev[selectedDay];
        if (Array.isArray(existing) && existing.length === draftArr.length) {
          let same = true;
            for (let i=0;i<existing.length;i++) {
              const a=existing[i]||{}, b=draftArr[i]||{};
              if ((a.commessa||'')!== (b.commessa||'') || Number(a.ore||0)!==Number(b.ore||0) || (a.descrizione||'') !== (b.descrizione||'')) { same=false; break; }
            }
          if (same) return prev; // no change
        }
        return { ...prev, [selectedDay]: draftArr.slice() };
      });
    } else if (draftsByDay[selectedDay]) {
      setDraftsByDay(prev => { const next = { ...prev }; delete next[selectedDay]; return next; });
    }
  }, [dayBuffer.dirty, dayBuffer.draft, selectedDay]);

  const handleAddRecord = useCallback((day, nextRecords) => {
    if (day !== selectedDay) return;
    const arr = Array.isArray(nextRecords) ? nextRecords : [nextRecords];
    dayBuffer.setDraft(arr);
  }, [selectedDay, dayBuffer]);

  const stageDraft = useCallback(() => {
    if (!selectedDay) return;
    ctx.stageUpdate(EMP_ID, selectedDay, dayBuffer.draft);
  }, [selectedDay, dayBuffer.draft, ctx]);

  // removed explicit stageAllDrafts - staging happens automatically below

  const discardAllDrafts = useCallback(() => {
    // clear local drafts and staged changes for this employee
    setDraftsByDay({});
    if (selectedDay && dayBuffer.dirty) dayBuffer.resetDraft();
    try { if (ctx && typeof ctx.discardStaged === 'function') ctx.discardStaged({ employeeId: EMP_ID }); } catch (e) {}
  }, [selectedDay, dayBuffer, ctx]);

  // Snackbar (toast) state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('info');
  const showToast = useCallback((msg, severity = 'info') => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []);

  // Wrap discard with toast
  const discardAllDraftsWithToast = useCallback(() => {
    const count = Object.keys(draftsByDay).length;
    setDraftsByDay({});
    if (selectedDay && dayBuffer.dirty) dayBuffer.resetDraft();
    try { if (ctx && typeof ctx.discardStaged === 'function') ctx.discardStaged({ employeeId: EMP_ID }); } catch (e) {}
    showToast(`${count} bozze scartate`, count > 0 ? 'warning' : 'info');
  }, [draftsByDay, selectedDay, dayBuffer, showToast, ctx]);

  // Auto-stage current day's draft (debounced) whenever the buffer changes
  // Track last staged semantic signature to avoid re-staging identical content even if object refs change
  const lastSignatureRef = useRef(null);
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (!selectedDay) return;
    if (!dayBuffer.dirty) return; // nothing new to stage
    const draftArr = Array.isArray(dayBuffer.draft) ? dayBuffer.draft : [];
    const signature = semanticHash(draftArr);
    // Skip first run to avoid staging immediately on mount
    if (firstRunRef.current) {
      firstRunRef.current = false;
      lastSignatureRef.current = signature;
      try { console.debug('[ts:auto-stage] skip first run', { day: selectedDay, signature }); } catch(e) {}
      return;
    }
    if (lastSignatureRef.current === signature) return; // already staged (same semantic content)
    // Also guard if current staged value already equals draft (avoid dependency on entire stagedMap by reading once)
    const stagedDay = ctx.stagedMap?.[EMP_ID]?.[selectedDay];
    if (Array.isArray(stagedDay) && semanticEqual(stagedDay, draftArr)) {
      lastSignatureRef.current = signature; // align signature to prevent immediate retrigger
      try { console.debug('[ts:auto-stage] noop (already staged equal)', { day: selectedDay }); } catch(e) {}
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      try {
        ctx.stageUpdate(EMP_ID, selectedDay, draftArr);
        lastSignatureRef.current = signature;
        showToast(`Giornata ${selectedDay} messa in coda`, 'success');
        try { console.debug('[ts:auto-stage] staged', { day: selectedDay, len: draftArr.length, signature }); } catch(e) {}
      } catch(e) {}
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  // Intentionally exclude ctx.stagedMap and ctx.stageUpdate to avoid effect firing because of staging updates it itself triggers
  }, [selectedDay, dayBuffer.dirty, dayBuffer.draft, showToast, ctx.stagedMap]);

  return (
    <Box sx={{ bgcolor: 'background.default', height: '100vh', overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <PageHeader title="Timesheet" description="Riepilogo e inserimento ore" icon={<AccessTimeIcon />} />
          <BadgeCard isBadgiato={isBadgiatoToday} />
        </Box>
        <Box sx={{ mb: 3, boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', p: 2 }}>
          <StagedChangesPanel compact maxVisible={5} showLegend />
        </Box>
        {/* Legend moved into StagedChangesPanel */}
        {missingPrev.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>Attenzione: non hai completato il mese precedente ({missingPrev.length} giorni mancanti).</Alert>
        )}
        <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', py: 4, px: 8, mb: 4, display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedDay ? (
              <>
                {commesseLoading && <Alert severity="info" sx={{ mb: 1 }}>Caricamento commesse...</Alert>}
                <DayEntryPanel
                  selectedDay={selectedDay}
                  data={(() => { const synthetic = { ...mergedData }; if (selectedDay) synthetic[selectedDay] = dayBuffer.dirty ? dayBuffer.draft : (mergedData[selectedDay] || []); return synthetic; })()}
                  onAddRecord={handleAddRecord}
                  commesse={commesseList}
                />
                { /* per-day cancel button removed: drafts are auto-staged */ }
              </>
            ) : (
              <Alert severity="info" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Seleziona un giorno.</Alert>
            )}
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <WorkCalendar
              data={mergedData}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              variant="wide"
              highlightedDays={missingPrevSet}
              stagedDays={ctx.stagedMap?.[EMP_ID] ? new Set(Object.keys(ctx.stagedMap[EMP_ID])) : undefined}
            />
          </Box>
        </Box>
        <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', py: 3, px: 4, mb: 4 }}>
          <CommesseDashboard employeeId={EMP_ID} assignedCommesse={commesseList} data={mergedData} />
        </Box>
      </Container>

      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert onClose={() => setToastOpen(false)} severity={toastSeverity} elevation={6} variant="filled">{toastMsg}</MuiAlert>
      </Snackbar>

    </Box>
  );
}

export default function DipendenteTimesheet() {
  return (
    <TimesheetProvider scope="single" employeeIds={[EMP_ID]}>
      <InnerDipendente />
    </TimesheetProvider>
  );
}
