import React from "react";
import { useAuth } from "../../Layouts/AuthContext";
import { ROLES } from "../../mocks/UsersMock";
import DipendenteTimesheet from "./DipendenteTimesheet";
import DashboardAmministrazioneTimesheet from "./DashboardAmministrazioneTimesheet";
import PMCampoTimesheet from "./PMCampoTimesheet";
import Coordinatore from "./CoordinatoreTimesheet";

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
