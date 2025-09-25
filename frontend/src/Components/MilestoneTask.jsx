import { useState } from "react";
import TaskList from "./TaskManager/TaskList";

export default function MilestoneTask({ tasks, employees }) {
  const [dateRange, setDateRange] = useState([null, null]);
  const [searchText, setSearchText] = useState("");

  // Filtra i task in base a titolo e range di date
  const filteredTasks = tasks.filter((task) => {
    const matchesText = task.title.toLowerCase().includes(searchText.toLowerCase());
    let matchesDate = true;
    if (dateRange[0] && dateRange[1]) {
      const taskDate = task.deadline;
      matchesDate = taskDate >= dateRange[0] && taskDate <= dateRange[1];
    }
    return matchesText && matchesDate;
  });

  return (
    <div>
      {/* Filtri */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Cerca per titolo..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        
        {/*
        <DatePicker label="Basic date picker" value={dateRange} onChange={setDateRange}/>
        */}
      </div>

      {/* Lista dei task filtrati */}
      <TaskList tasks={filteredTasks} employees={employees} />
    </div>
  );
}
