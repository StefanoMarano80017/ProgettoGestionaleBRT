import React from "react";
import useAuth from "@hooks/useAuth";
import { ROLES } from "@mocks/UsersMock";
import DipendenteTimesheet from "@pages/Timesheet/DipendenteTimesheet";
import Coordinatore from "@pages/Timesheet/CoordinatoreTimesheet";

export default function TimesheetRouter() {
  const { roles } = useAuth();

  // Priorità: Coordinatore > Dipendente (PM Campo archived)
  if (roles.includes(ROLES.COORDINATORE)) return <Coordinatore />;
  if (roles.includes(ROLES.DIPENDENTE)) return <DipendenteTimesheet />;

  return <DipendenteTimesheet />;
}
