import React, { useState } from "react";
import { Box, Chip, TextField, Autocomplete, Typography } from "@mui/material";

const employees = [
  { id: 1, name: "Mario Rossi" },
  { id: 2, name: "Luigi Bianchi" },
  { id: 3, name: "Anna Verdi" },
  { id: 4, name: "Elena Neri" },
];

export default function TaskCard({ task }) {
  const [assignees, setAssignees] = useState(task.assignees || []);
  const [inputValue, setInputValue] = useState("");

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        width: 300,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography variant="subtitle1">{task.title}</Typography>

      {/* Chip dei dipendenti */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {assignees.map((emp) => (
          <Chip
            key={emp.id}
            label={emp.name}
            onDelete={() =>
              setAssignees((prev) => prev.filter((a) => a.id !== emp.id))
            }
          />
        ))}
      </Box>

      {/* Autocomplete per aggiungere dipendenti */}
      <Autocomplete
        options={employees.filter(
          (emp) => !assignees.some((a) => a.id === emp.id)
        )}
        getOptionLabel={(option) => option.name}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
        onChange={(event, newValue) => {
          if (newValue && newValue.name) {
            setAssignees((prev) => [...prev, newValue]);
            setInputValue(""); // reset input dopo selezione
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            placeholder="Aggiungi dipendenti"
          />
        )}
      />
    </Box>
  );
}
