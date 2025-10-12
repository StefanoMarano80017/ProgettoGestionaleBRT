import React from "react";
import useAuth from "@/domains/auth/hooks/useAuth";
import { ROLES } from "@mocks/UsersMock";
import DipendenteTimesheet from "@domains/timesheet/pages/DipendenteTimesheet";
import Coordinatore from "@domains/timesheet/pages/CoordinatoreTimesheet";
import DashboardAmministrazioneTimesheet from "@domains/timesheet/pages/DashboardAmministrazioneTimesheet";
import PMCampoTimesheet from "@domains/timesheet/pages/PMCampoTimesheet";

export default function TimesheetRouter() {
  const { roles } = useAuth();

  // Priorità: Admin > Coordinatore > Dipendente
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
