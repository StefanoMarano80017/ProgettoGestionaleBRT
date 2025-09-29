import React, { useState } from "react";
import { Box, Container, Grid } from "@mui/material";
import ContatoreIngressi from "../Components/DipendenteHomePage/ContatoreIngressi";
import SetOreGiorno from "../Components/Calendar/SetOreGiorno";
import LayoutDashboardDipendenti from "../Components/DipendenteHomePage/LayoutDashboardDipendenti";
import BadgeCard from "../Components/BadgeCard/BadgeCard";
import UserCard from "../Components/Avatar/UserCard";
import MultiProgressCard from "../Components/ProgressBar/MultiProgressCard";
import DualButton from "../Components/DipendenteHomePage/DualButton";
import { mockDaysInfo } from "../Components/Calendar/MockDaysInfo";
import CommesseList from "../Components/DipendenteHomePage/CommesseList";
import PageHeader from "../Components/PageHeader";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Stack, Chip } from "@mui/material";
import { Alert } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import { Avatar, Typography } from "@mui/material";
import AdjustIcon from '@mui/icons-material/Adjust';


export default function DipendenteHome() {
  const [selectedTab, setSelectedTab] = useState("tab1");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const progresses = [
    { label: "Inserite", value: 70 },
    { label: "Ferie", value: 50 },
    { label: "Permessi", value: 30 },
  ];

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


  const rightComponentsContent = {
    tab1: 
      <ContatoreIngressi
        key="contatore"
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        daysInfo={mockDaysInfo}
      />
    ,
    tab2: <CommesseList />,
  };

  const rightComponents = [
    <DualButton
      key="topbar"
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
    />,
    rightComponentsContent[selectedTab] || <Box key="empty" />,
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Grid container direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Grid item sx={{ width: 1000 }}>
       <PageHeader title="Timesheet" description="Qui puoi visualizzare il riepilogo dei dati inseriti del timesheet:" icon={<AccessTimeIcon />}
      extraContent={
        <Stack direction="row" spacing={4}>
          <IconTextCard icon = {<AdjustIcon sx={{ color: "customGreen.main" }} />} legend="Verde" text="In Verde i giorni inseriti correttamente." />
          <IconTextCard icon = {<AdjustIcon sx={{ color: "customYellow.main" }} />} legend="Giallo" text="In Giallo i giorni non inseriti o incompleti." />
          <IconTextCard icon = {<AdjustIcon sx={{ color: "customRed.main" }} />} legend="Rosso" text="In Rosso i giorni segnalati da amministrazione." />
        </Stack>
      }
    />
    </Grid>
      <Grid item sx={{ width: 450 }}>
              <BadgeCard key="badge" editable={false} name="prova prova" initialId="34"/>
      </Grid>
    </Grid>
    <ContatoreIngressi
        key="contatore"
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        daysInfo={mockDaysInfo}
        progresses={progresses}
      />
    </Container>
  );
}
