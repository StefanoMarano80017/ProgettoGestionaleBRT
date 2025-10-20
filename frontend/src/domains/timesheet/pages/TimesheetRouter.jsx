import React from "react";
import { ROLES } from "@mocks/UsersMock";
import DipendenteTimesheet from "@domains/timesheet/pages/DipendenteTimesheet";
import DashboardAmministrazioneTimesheet from "@domains/timesheet/pages/DashboardAmministrazioneTimesheet";
import PMCampoTimesheet from "@domains/timesheet/pages/PMCampoTimesheet";
import { useUser } from "@/context/UserContext";

export default function TimesheetRouter() {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;
  const roles = user.rolesString;

  // Priorità: Admin > Coordinatore > Dipendente
  if (
    roles.includes(ROLES.AMMINISTRATORE) ||
    roles.includes(ROLES.DIRETTORE_TECNICO) ||
    roles.includes(ROLES.DIRETTORE_GENERALE)
  ) {
    return <DashboardAmministrazioneTimesheet />;
  }

  if (roles.includes(ROLES.PM_CAMPO)) return <PMCampoTimesheet />;

  if (roles.includes(ROLES.COORDINATORE)) return <DipendenteTimesheet />;
  if (roles.includes(ROLES.DIPENDENTE)) return <DipendenteTimesheet />;

  return <DipendenteTimesheet />;
}
