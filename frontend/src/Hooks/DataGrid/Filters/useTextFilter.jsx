import React, { useState } from "react";
import TextFilter from "@/Components/DataGridDashboard/Filters/TextFilter";
import { Chip } from "@mui/material";

export function useTextFilter(initialValue = "", placeholder) {
  const [value, setValue] = useState(initialValue);

  const filterFn = React.useCallback(
    (items) => {
      if (!value) return items;
      return items.filter((t) =>
        t.title.toLowerCase().includes(value.toLowerCase())
      );
    },
    [value]
  );

  const clear = () => setValue("");

  const render = () => (
    <TextFilter
      textFilter={value}
      setTextFilter={setValue}
      placeholder={placeholder}
    />
  );

  const renderChip = () => {
    if (!value) return null;
    return <Chip label={`Testo: ${value}`} onDelete={clear} />;
  };

  return { value, set: setValue, filterFn, render, renderChip, clear, label: "Testo" };
}
