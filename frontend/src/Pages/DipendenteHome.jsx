import React, { useState } from "react";
import {
  Box,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import CommesseList from "../Components/DipendenteHomePage/CommesseList";
import PageHeader from "../Components/PageHeader";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import AdjustIcon from "@mui/icons-material/Adjust";
import BadgeCard from "../Components/BadgeCard/Badge";
import WorkCalendar from "../Components/Calendar/WorkCalendar";
import DayEntryPanel from "../Components/Calendar/DayEntryPanel";
import { projectsMock } from "../mocks/ProjectMock";

export default function DipendenteHome() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [data, setData] = useState(projectsMock);

  const commesseList = [
    "VS-25-01",
    "VS-25-02",
    "VS-25-03",
    "FERIE",
    "PERMESSO",
    "MALATTIA",
  ];

  // Aggiorna i dati del giorno (aggiungi/modifica/rimuovi)
  const handleAddRecord = (day, recordOrRecords, replace = false) => {
    setData((prev) => {
      const prevDayRecords = prev[day] || [];
      const newRecords = replace
        ? recordOrRecords
        : [...prevDayRecords, recordOrRecords];
      return { ...prev, [day]: newRecords };
    });
  };

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

  return (
    <Box sx={{ bgcolor: "background.default", height: "100vh", overflow: "auto" }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header */}
        <PageHeader
          title="Timesheet"
          description="Qui puoi visualizzare il riepilogo del timesheet:"
          icon={<AccessTimeIcon />}
          extraContent={
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <IconTextCard
                icon={<AdjustIcon sx={{ color: "customGreen.main" }} />}
                legend="Verde"
                text="Giorni inseriti correttamente."
              />
              <IconTextCard
                icon={<AdjustIcon sx={{ color: "customYellow.main" }} />}
                legend="Giallo"
                text="Giorni incompleti o parziali."
              />
              <IconTextCard
                icon={<AdjustIcon sx={{ color: "customRed.main" }} />}
                legend="Rosso"
                text="Giorni segnalati dall'amministrazione."
              />
            </Stack>
          }
        />
        <Divider sx={{ my: 2 }} />

        {/* Grid principale */}
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
        }}>
          {/* Colonna sinistra: pannello giorno */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', }}>
            {selectedDay ? (
              <DayEntryPanel
                selectedDay={selectedDay}
                data={data}
                onAddRecord={handleAddRecord}
                commesse={commesseList}
              />
            ) : (
              <Alert severity="info" sx={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Seleziona un giorno per inserire o modificare i dati.</Alert>
            )}
          </Box>
          {/* Colonna Destra: Badge + Calendario */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 8 }}>
            <Box sx={{ mb: 2 }}>
              <BadgeCard
                avatarSrc="MR"
                title="Employee Badge"
                actionIcon={<InfoIcon />}
                companyId="BRT-12345"
                companyLogo="https://static.wixstatic.com/media/618259_08e4c20264204196a4839f310152b7e8~mv2.png/v1/fill/w_222,h_56,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/brt_logo_engineering_white.png"
                holderName="Mario Rossi"
              />
            </Box>
            <WorkCalendar
              data={data}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />
          </Box>
        </Box>
        <Divider sx={{ my: 4 }} />
        <CommesseList />
      </Container>
    </Box>
  );
}
