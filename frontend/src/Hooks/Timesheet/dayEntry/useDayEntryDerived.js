import { useMemo } from 'react';
import BeachAccessIcon from "@mui/icons-material/BeachAccess";     // FERIE
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"; // MALATTIA
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // PERMESSO

/**
 * useDayEntryDerived
 * Calcola valori derivati e helper presentazionali per un giorno del timesheet.
 */
export function useDayEntryDerived(selectedDay, data = {}, maxHoursPerDay = 8) {
  const records = useMemo(() => (selectedDay ? (data[selectedDay] || []) : []), [selectedDay, data]);
  const segnalazione = useMemo(
    () => (selectedDay ? data[`${selectedDay}_segnalazione`] || null : null),
    [selectedDay, data]
  );

  const totalHours = useMemo(
    () => records.reduce((sum, r) => sum + Number(r.ore || 0), 0),
    [records]
  );

  const itDate = useMemo(() => {
    if (!selectedDay) return '';
    const [y, m, d] = selectedDay.split('-').map(Number);
    return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .format(new Date(y, m - 1, d));
  }, [selectedDay]);

  const getChipProps = (commessa) => {
    if (commessa === 'FERIE') return { color: 'success', icon: <BeachAccessIcon fontSize="small" /> };
    if (commessa === 'MALATTIA') return { color: 'secondary', icon: <LocalHospitalIcon fontSize="small" /> };
    if (commessa === 'PERMESSO') return { color: 'info', icon: <EventAvailableIcon fontSize="small" /> };
    return { color: 'default', icon: undefined };
  };

  const dayStatus = useMemo(() => {
    const has = (c) => records.some(r => r.commessa === c);
    if (segnalazione) return { label: 'Segnalazione', color: 'error' };
    if (has('FERIE')) return { label: 'Ferie', color: 'success' };
    if (has('MALATTIA')) return { label: 'Malattia', color: 'secondary' };
    if (has('PERMESSO')) return { label: 'Permesso parziale', color: 'info' };
    if (totalHours === maxHoursPerDay) return { label: 'Completo', color: 'success' };
    if (totalHours > 0 && totalHours < maxHoursPerDay) return { label: 'Parziale', color: 'warning' };
    return { label: 'Vuoto', color: 'default' };
  }, [records, segnalazione, totalHours, maxHoursPerDay]);

  return {
    records,
    segnalazione,
    totalHours,
    itDate,
    dayStatus,
    getChipProps,
  };
}
