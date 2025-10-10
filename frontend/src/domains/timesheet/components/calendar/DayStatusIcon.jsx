import React from "react";
import StatusIcon from "./statusIcons";

const DayStatusIcon = React.memo(({ status, size = 14 }) => {
  return <StatusIcon status={status} size={size} />;
});

export default DayStatusIcon;
