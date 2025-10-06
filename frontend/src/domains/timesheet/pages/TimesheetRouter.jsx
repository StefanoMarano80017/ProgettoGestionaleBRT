import React from "react";
import useAuth from "@/domains/auth/hooks/useAuth";
import { ROLES } from "@mocks/UsersMock";
import DipendenteTimesheet from "@domains/timesheet/pages/DipendenteTimesheet";
import Coordinatore from "@domains/timesheet/pages/CoordinatoreTimesheet";

export default function TimesheetRouter() {
  const { roles } = useAuth();

  // Priorità: Coordinatore > Dipendente (PM Campo archived)
  if (roles.includes(ROLES.COORDINATORE)) return <Coordinatore />;
  if (roles.includes(ROLES.DIPENDENTE)) return <DipendenteTimesheet />;

  return <DipendenteTimesheet />;
}
