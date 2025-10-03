import React from "react";
import { useAuth } from "../Layouts/AuthContext";
import { ROLES } from "../mocks/UsersMock";
import DipendenteHome from "./DipendenteHome";
import DashboardAmministrazioneTimesheet from "./DashboardAmministrazioneTimesheet";
import PMCampoTimesheet from "./PMCampoTimesheet";
import Coordinatore from "./Coordinatore";

export default function TimesheetRouter() {
  const { roles } = useAuth();

  if (roles.includes(ROLES.DIPENDENTE)) return <DipendenteHome />;
  if (
    roles.includes(ROLES.AMMINISTRATORE) ||
    roles.includes(ROLES.DIRETTORE_TECNICO) ||
    roles.includes(ROLES.DIRETTORE_GENERALE)
  ) {
    return <DashboardAmministrazioneTimesheet />;
  }
  if (roles.includes(ROLES.PM_CAMPO)) return <PMCampoTimesheet />;
  if (roles.includes(ROLES.COORDINATORE)) return <Coordinatore />;

  return <DipendenteHome />;
}