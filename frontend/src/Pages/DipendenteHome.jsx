import React, { useState } from "react";
import { Box } from "@mui/material";
import ContatoreIngressi from "../Components/DipendenteHomePage/ContatoreIngressi";
import SetOreGiorno from "../Components/Calendar/SetOreGiorno";
import LayoutDashboardDipendenti from "../Components/DipendenteHomePage/LayoutDashboardDipendenti";
import BadgeCard from "../Components/BadgeCard/BadgeCard";
import UserCard from "../Components/Avatar/UserCard";
import MultiProgressCard from "../Components/ProgressBar/MultiProgressCard";
import TopBar from "../Components/DipendenteHomePage/TopBar";
import { mockDaysInfo } from "../Components/Calendar/MockDaysInfo";
import CommesseList from "../Components/DipendenteHomePage/CommesseList";

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
    <Box sx={{ width: "100%", minHeight: "100vh" }}>
      <LayoutDashboardDipendenti
        leftComponents={leftComponents}
        rightComponents={rightComponents}
      />
    </Box>
  );
}
