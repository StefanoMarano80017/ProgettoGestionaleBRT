// Mock asincrono: restituisce le commesse attive associate a un dipendente
// Ora integrato con il nuovo COMMESSE_REGISTRY
import { listCommesse, isCommessaClosedOn } from './CommesseMock.js';

// Mapping dipendenti -> commesse (solo IDs)
const EMPLOYEE_COMMESSE_MAPPING = {
  "emp-001": ["VS-25-01", "VS-25-02", "VS-25-03"],
  "emp-002": ["VS-25-01", "VS-25-03"],
  default: ["VS-25-01", "VS-25-02", "VS-25-03"],
};

/**
 * Restituisce le commesse attive per un dipendente (LEGACY - mantiene compatibilità)
 * Esclude automaticamente le commesse chiuse alla data odierna
 * @param {string} employeeId - ID del dipendente
 * @returns {Promise<string[]>} Array di ID commesse attive
 */
export async function getActiveCommesseForEmployee(employeeId) {
  await new Promise(resolve => setTimeout(resolve, 200)); // simulazione chiamata remota
  
  // Ottieni gli ID delle commesse assegnate al dipendente
  const assignedCommesseIds = EMPLOYEE_COMMESSE_MAPPING[employeeId] ?? EMPLOYEE_COMMESSE_MAPPING.default;
  
  // Ottieni solo le commesse non chiuse dal registry
  const activeCommesse = await listCommesse({ includeClosed: false });
  const activeCommesseIds = activeCommesse.map(c => c.id);
  
  // Filtra mantenendo solo quelle assegnate E attive
  return assignedCommesseIds.filter(id => activeCommesseIds.includes(id));
}

/**
 * Versione avanzata con controllo data personalizzata (NUOVO)
 * @param {string} employeeId - ID del dipendente
 * @param {Object} options - Opzioni di filtro
 * @param {string} options.onDate - Data di riferimento (YYYY-MM-DD), default oggi
 * @param {boolean} options.includeClosed - Include commesse chiuse, default false
 * @returns {Promise<string[]>} Array di ID commesse filtrate
 */
export async function getActiveCommesseForEmployeeV2(employeeId, { onDate = null, includeClosed = false } = {}) {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Usa data odierna se non specificata
  const dateKey = onDate || new Date().toISOString().slice(0, 10);
  
  // Ottieni gli ID delle commesse assegnate al dipendente
  const assignedCommesseIds = EMPLOYEE_COMMESSE_MAPPING[employeeId] ?? EMPLOYEE_COMMESSE_MAPPING.default;
  
  if (includeClosed) {
    // Se includeClosed=true, restituisce tutte le commesse assegnate
    return assignedCommesseIds;
  }
  
  // Filtra per data: esclude quelle chiuse alla data specificata
  const filteredIds = [];
  for (const commessaId of assignedCommesseIds) {
    const isClosed = await isCommessaClosedOn(commessaId, dateKey);
    if (!isClosed) {
      filteredIds.push(commessaId);
    }
  }
  
  return filteredIds;
}