// Mock dati per un dipendente (ogni settimana del 2025, 52 settimane)
export const employeeTasksMock = [
  {
    taskId: "t1",
    taskTitle: "UI principale",
    projectTitle: "Progetto Alpha",
    dailyHours: Array.from({ length: 52 }, (_, i) => {
      const start = new Date(2025, 0, 1 + i * 7); // primo giorno della settimana
      const dateStr = start.toISOString().split("T")[0];
      return { date: dateStr, hours: Math.floor(Math.random() * 4) + 1 };
    }),
  },
  {
    taskId: "t2",
    taskTitle: "Bug fix modulo login",
    projectTitle: "Progetto Alpha",
    dailyHours: Array.from({ length: 52 }, (_, i) => {
      const start = new Date(2025, 0, 1 + i * 7);
      const dateStr = start.toISOString().split("T")[0];
      return { date: dateStr, hours: Math.floor(Math.random() * 3) + 1 };
    }),
  },
  {
    taskId: "t3",
    taskTitle: "Analisi requisiti",
    projectTitle: "Progetto Gamma",
    dailyHours: Array.from({ length: 52 }, (_, i) => {
      const start = new Date(2025, 0, 1 + i * 7);
      const dateStr = start.toISOString().split("T")[0];
      return { date: dateStr, hours: Math.floor(Math.random() * 5) + 1 };
    }),
  },
  {
    taskId: "t4",
    taskTitle: "Configurazione server",
    projectTitle: "Progetto Gamma",
    dailyHours: Array.from({ length: 52 }, (_, i) => {
      const start = new Date(2025, 0, 1 + i * 7);
      const dateStr = start.toISOString().split("T")[0];
      return { date: dateStr, hours: Math.floor(Math.random() * 3) + 1 };
    }),
  },
];
