import { useState, useCallback } from "react";
import StatusFilter from "../Filters/StatusFilter";
import { Chip, Box } from "@mui/material";

export function useStatusFilter(statusOptions = []) {
  const [value, setValue] = useState([]);

  // Restituisce l'array filtrato dei task
  const filterFn = useCallback(
    (items) => {
      if (!value || value.length === 0) return items; // nessun filtro: restituisci tutto
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
    return <Chip label={`Stato: ${value.join(", ")}`} onDelete={clear} color="primary"/>;
  };

  return { value, set: setValue, filterFn, render, renderChip, clear, label: "Stato" };
}
