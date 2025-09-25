import { useState } from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";

const employees = ["Mario", "Luigi", "Anna", "Giulia"];

export default function AssigneeSelector({ task, onAssign }) {
  const [value, setValue] = useState(task.assignees || []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    onAssign(task.id, newValue); // aggiorna la board
  };

  return (
    <Autocomplete
  multiple
  options={employees} // lista dei dipendenti
  getOptionLabel={(option) => option.name}
  value={assignees}
  onChange={(event, newValue) => {
    // Filtra eventuali valori vuoti
    const filtered = newValue.filter((v) => v && v.name);
    setAssignees(filtered);

    // Resetta input dopo selezione
    setInputValue("");
  }}
  inputValue={inputValue}
  onInputChange={(event, newInputValue) => {
    setInputValue(newInputValue);
  }}
  renderTags={(value, getTagProps) =>
    value.map((option, index) => (
      <Chip
        key={option.id}
        label={option.name}
        {...getTagProps({ index })}
      />
    ))
  }
  renderInput={(params) => (
    <TextField
      {...params}
      placeholder="Assegna dipendenti..."
      onKeyDown={(e) => {
        if (e.key === "Enter" && inputValue.trim()) {
          // Aggiungi nuovo dipendente se necessario
          const employee = employees.find(emp => emp.name === inputValue.trim());
          if (employee && !assignees.some(a => a.id === employee.id)) {
            setAssignees([...assignees, employee]);
          }
          setInputValue(""); // reset input dopo Invio
          e.preventDefault(); // evita submit form
        }
      }}
    />
  )}
/>

  );
}
