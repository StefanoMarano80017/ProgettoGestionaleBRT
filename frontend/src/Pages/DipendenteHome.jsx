import React, { useState } from "react";
import { Box, Container } from "@mui/material";
import ContatoreIngressi from "../Components/DipendenteHomePage/ContatoreIngressi";
import SetOreGiorno from "../Components/Calendar/SetOreGiorno";
import LayoutDashboardDipendenti from "../Components/DipendenteHomePage/LayoutDashboardDipendenti";
import BadgeCard from "../Components/BadgeCard/BadgeCard";
import UserCard from "../Components/Avatar/UserCard";
import MultiProgressCard from "../Components/ProgressBar/MultiProgressCard";
import TopBar from "../Components/DipendenteHomePage/TopBar";
import { mockDaysInfo } from "../Components/Calendar/MockDaysInfo";
import CommesseList from "../Components/DipendenteHomePage/CommesseList";
import PageHeader from "../Components/PageHeader";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Stack, Chip } from "@mui/material";
import { Alert } from "@mui/material";

export default function DipendenteHome() {
  const [selectedTab, setSelectedTab] = useState("tab1");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const progresses = [
    { label: "Inserite", value: 70 },
    { label: "Ferie", value: 50 },
    { label: "Permessi", value: 30 },
  ];

  const leftComponents = [
    <BadgeCard key="badge" editable={false} name="prova prova" initialId="34"/>,
    <MultiProgressCard progresses={progresses} key="progress" />,
  ];

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
    <TopBar
      key="topbar"
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
    />,
    rightComponentsContent[selectedTab] || <Box key="empty" />,
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <PageHeader
      title="Timesheet"
      description="Qui puoi visualizzare il riepilogo dei dati inseriti del timesheet:"
      icon={<AccessTimeIcon />}
      extraContent={
        <Stack direction="row" spacing={4}>
          <Alert severity="success" variant="filled" > In verde i giorni inseriti correttamente.</Alert>
          <Alert severity="warning" variant="filled"> In giallo i giorni con problemi di inserimento.</Alert>
          <Alert severity="error" variant="filled"> In rosso i giorni non inseriti.</Alert>
        </Stack>
      }
    />
      <LayoutDashboardDipendenti
        leftComponents={leftComponents}
        rightComponents={rightComponents}
      />
    </Container>
  );
}
