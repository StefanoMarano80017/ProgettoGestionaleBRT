import React, { useState } from "react";
import {
  Box,
  Container,
  Divider,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
// import CommesseList from "../Components/DipendenteHomePage/CommesseList";
import CommesseDashboard from "../Components/DipendenteHomePage/CommesseDashboard";
import PageHeader from "../Components/PageHeader";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import BadgeCard from "../Components/BadgeCard/Badge";
import WorkCalendar from "../Components/Calendar/WorkCalendar";
import DayEntryPanel from "../Components/Calendar/DayEntryPanel";
import { projectsMock } from "../mocks/ProjectMock";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import { getActiveCommesseForEmployee } from "../mocks/EmployeeCommesseMock";

export default function DipendenteHome() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [data, setData] = useState(projectsMock);

  // ID dipendente corrente (sostituisci con il tuo ID reale da auth/store)
  const currentEmployeeId = "emp-001";

  const [commesseList, setCommesseList] = useState([]);
  const [commesseLoading, setCommesseLoading] = useState(true);

  // Gestione inserimento/modifica/eliminazione record giornalieri
  const handleAddRecord = (day, recordOrRecords, replace = false) => {
    setData((prev) => {
      const prevDayRecords = prev[day] || [];
      const toArray = (x) => (Array.isArray(x) ? x : [x]);

      const newRecords = replace
        ? toArray(recordOrRecords)
        : [...prevDayRecords, ...toArray(recordOrRecords)];

      // Rimuovi la chiave del giorno se vuoto (es. dopo delete)
      if (!newRecords || newRecords.length === 0) {
        const { [day]: _omit, ...rest } = prev;
        return rest;
        }
      return { ...prev, [day]: newRecords };
    });
  };

  React.useEffect(() => {
    let mounted = true;
    getActiveCommesseForEmployee(currentEmployeeId)
      .then((list) => mounted && setCommesseList(list))
      .finally(() => mounted && setCommesseLoading(false));
    return () => { mounted = false; };
  }, [currentEmployeeId]);

  function IconTextCard({ icon = <InfoIcon />, legend, text }) {
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        {icon}
        <Stack>
          <Typography variant="caption" color="text.secondary">
            {legend}
          </Typography>
          <Typography variant="body1">{text}</Typography>
        </Stack>
      </Stack>
    );
  }

  function LegendItem({ icon, label, text, color }) {
    return (
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box sx={{ color }}>{icon}</Box>
        <Stack>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2">{text}</Typography>
        </Stack>
      </Stack>
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const isBadgiatoToday = Boolean(data?.[todayKey] && data[todayKey].length > 0);

  return (
    <Box sx={{ bgcolor: "background.default", height: "100vh", overflow: "auto" }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header + Badge on the same row */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: 'customBackground.main', p: 4, borderRadius: 2, boxShadow: 8 }}>
          <PageHeader
            title="Timesheet"
            description="Qui puoi visualizzare il riepilogo del timesheet:"
            icon={<AccessTimeIcon />}
          />
          <BadgeCard
            actionIcon={<InfoIcon />}
            companyId="BRT-12345"
            companyLogo="https://static.wixstatic.com/media/618259_08e4c20264204196a4839f310152b7e8~mv2.png/v1/fill/w_222,h_56,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/brt_logo_engineering_white.png"
            holderName="Mario Rossi"
            isBadgiato={isBadgiatoToday}
          />
        </Box>
        {/* Griglia principale */}
        <Box sx={{
          boxShadow: 8,
          borderRadius: 2,
          bgcolor: 'customBackground.main',
          py: 4,
          px: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          gap: 4,
        }}>
          {/* Sinistra: DayEntryPanel (2/3) + Legenda sotto */}
          <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Dettaglio giorno */}
            {selectedDay ? (
              <>
                {commesseLoading && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Caricamento commesse attive per il dipendente...
                  </Alert>
                )}
                <DayEntryPanel
                  selectedDay={selectedDay}
                  data={data}
                  onAddRecord={handleAddRecord}
                  commesse={commesseList}
                />
              </>
            ) : (
              <Alert
                severity="info"
                sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Seleziona un giorno per inserire o modificare i dati.
              </Alert>
            )}

            {/* Legenda compatta (sotto il dettaglio) */}
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, }}>
              <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" useFlexGap>
                <LegendItem
                  icon={<CheckCircleIcon fontSize="small" />}
                  label="Verde"
                  text="Giorno completo (8h)."
                  color="success.main"
                />
                <LegendItem
                  icon={<TimelapseIcon fontSize="small" />}
                  label="Giallo"
                  text="Giorno parziale (<8h)."
                  color="warning.main"
                />
                <LegendItem
                  icon={<WarningAmberIcon fontSize="small" />}
                  label="Rosso"
                  text="Segnalazione amministrazione."
                  color="error.main"
                />
                <LegendItem
                  icon={<BeachAccessIcon fontSize="small" />}
                  label="Ferie"
                  text="Giornata di ferie."
                  color="success.main"
                />
                <LegendItem
                  icon={<LocalHospitalIcon fontSize="small" />}
                  label="Malattia"
                  text="Assenza per malattia."
                  color="secondary.main"
                />
                <LegendItem
                  icon={<EventAvailableIcon fontSize="small" />}
                  label="Permesso"
                  text="Permesso parziale."
                  color="info.main"
                />
              </Stack>
            </Box>
          </Box>

          {/* Destra: Calendario (1/3) */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', my: 2, minWidth: 0 }}>
            
            <WorkCalendar
              data={data}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />
          </Box>
        </Box>

        {/* Sostituisce CommesseList */}
        <Box
        sx={{
          boxShadow: 8,
          borderRadius: 2,
          bgcolor: "customBackground.main",
          py: 3,
          px: 4,
          mb: 4,
        }}
      >
        <CommesseDashboard
          employeeId={currentEmployeeId}
          assignedCommesse={commesseList}
          data={data}
        />
      </Box>
      </Container>
    </Box>
  );
}
