// Mock asincrono: restituisce le commesse attive associate a un dipendente
const EMPLOYEE_COMMESSE = {
  "emp-001": ["VS-25-01", "VS-25-02", "VS-25-03"],
  "emp-002": ["VS-25-01", "VS-25-03"],
  default: ["VS-25-01", "VS-25-02", "VS-25-03"],
};

export function getActiveCommesseForEmployee(employeeId) {
  const result = EMPLOYEE_COMMESSE[employeeId] ?? EMPLOYEE_COMMESSE.default;
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), 200); // simulazione chiamata remota
  });
}