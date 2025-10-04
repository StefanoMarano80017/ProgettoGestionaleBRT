import { useState, useCallback } from "react";
import StatusFilter from "@components/DataGridDashboard/Filters/StatusFilter";
import { Chip } from "@mui/material";

export function useStatusFilter(statusOptions = []) {
  const [value, setValue] = useState([]);

  const filterFn = useCallback(
    (items) => {
      if (!value || value.length === 0) return items;
      return items.filter((item) => value.includes(item.tag));
    },
    [value]
  );

  const clear = () => setValue([]);

  const render = () => (
    <StatusFilter
      statusOptions={statusOptions}
      statusFilter={value}
      setStatusFilter={setValue}
    />
  );

  const renderChip = () => {
    if (!value || value.length === 0) return null;
    return <Chip label={`Stato: ${value.join(", ")}`} onDelete={clear} color="primary" />;
  };

  return { value, set: setValue, filterFn, render, renderChip, clear, label: "Stato" };
}
