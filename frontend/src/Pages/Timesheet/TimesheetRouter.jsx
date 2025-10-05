import React from "react";
import useAuth from "@hooks/useAuth";
import { ROLES } from "@mocks/UsersMock";
import DipendenteTimesheet from "@pages/Timesheet/DipendenteTimesheet";
import PMCampoTimesheet from "@pages/Timesheet/PMCampoTimesheet";
import Coordinatore from "@pages/Timesheet/CoordinatoreTimesheet";

export default function TimesheetRouter() {
  const { roles } = useAuth();

  // Priorità: PM Campo > Coordinatore > Dipendente (admin surface removed)
  if (roles.includes(ROLES.PM_CAMPO)) return <PMCampoTimesheet />;
  if (roles.includes(ROLES.COORDINATORE)) return <Coordinatore />;
  if (roles.includes(ROLES.DIPENDENTE)) return <DipendenteTimesheet />;

  return <DipendenteTimesheet />;
}
