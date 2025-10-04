import React from "react";
import { useAuth } from "@layouts/AuthContext";
import { ROLES } from "@mocks/UsersMock";
import DipendenteTimesheet from "@pages/Timesheet/DipendenteTimesheet";
import DashboardAmministrazioneTimesheet from "@pages/Timesheet/DashboardAmministrazioneTimesheet";
import PMCampoTimesheet from "@pages/Timesheet/PMCampoTimesheet";
import Coordinatore from "@pages/Timesheet/CoordinatoreTimesheet";

export default function TimesheetRouter() {
  const { roles } = useAuth();

  // Priorità: Amministrazione > PM Campo > Coordinatore > Dipendente
  if (
    roles.includes(ROLES.AMMINISTRATORE) ||
    roles.includes(ROLES.DIRETTORE_TECNICO) ||
    roles.includes(ROLES.DIRETTORE_GENERALE)
  ) {
    return <DashboardAmministrazioneTimesheet />;
  }
  if (roles.includes(ROLES.PM_CAMPO)) return <PMCampoTimesheet />;
  if (roles.includes(ROLES.COORDINATORE)) return <Coordinatore />;
  if (roles.includes(ROLES.DIPENDENTE)) return <DipendenteTimesheet />;

  return <DipendenteTimesheet />;
}
