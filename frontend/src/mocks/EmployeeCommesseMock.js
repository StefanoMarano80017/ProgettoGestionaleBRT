// Mock asincrono: restituisce le commesse attive associate a un dipendente
// Ora integrato con il nuovo COMMESSE_REGISTRY
// IMPORTANTE: I dipendenti sono assegnati alle SOTTOCOMMESSE, non alle commesse principali
import { listCommesse, isSottocommessaClosedOn } from './CommesseMock.js';
import { EMPLOYEE_COMMESSE } from './ProjectMock.js';

const readAssignments = (employeeId) => {
  const list = EMPLOYEE_COMMESSE[employeeId];
  if (Array.isArray(list)) return [...list];
  return Array.isArray(EMPLOYEE_COMMESSE.default) ? [...EMPLOYEE_COMMESSE.default] : [];
};

/**
 * Restituisce le sottocommesse attive per un dipendente
 * Esclude automaticamente le sottocommesse di commesse chiuse alla data odierna
 * @param {string} employeeId - ID del dipendente
 * @returns {Promise<string[]>} Array di ID sottocommesse attive
 */
export async function getActiveCommesseForEmployee(employeeId) {
  await new Promise(resolve => setTimeout(resolve, 200)); // simulazione chiamata remota
  
  // Ottieni gli ID delle sottocommesse assegnate al dipendente
  const assignedSottocommesseIds = readAssignments(employeeId);
  
  // Ottieni solo le commesse non chiuse dal registry
  const activeCommesse = await listCommesse({ includeClosed: false });
  
  // Estrai tutte le sottocommesse attive
  const activeSottocommesseIds = activeCommesse.flatMap(c => 
    c.sottocommesse.map(s => s.id)
  );
  
  // Filtra mantenendo solo quelle assegnate E attive
  return assignedSottocommesseIds.filter(id => activeSottocommesseIds.includes(id));
}

/**
 * Versione avanzata con controllo data personalizzata (NUOVO)
 * Lavora con sottocommesse invece che commesse principali
 * @param {string} employeeId - ID del dipendente
 * @param {Object} options - Opzioni di filtro
 * @param {string} options.onDate - Data di riferimento (YYYY-MM-DD), default oggi
 * @param {boolean} options.includeClosed - Include sottocommesse di commesse chiuse, default false
 * @returns {Promise<string[]>} Array di ID sottocommesse filtrate
 */
export async function getActiveCommesseForEmployeeV2(employeeId, { onDate = null, includeClosed = false } = {}) {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Usa data odierna se non specificata
  const dateKey = onDate || new Date().toISOString().slice(0, 10);
  
  // Ottieni gli ID delle sottocommesse assegnate al dipendente
  const assignedSottocommesseIds = readAssignments(employeeId);
  
  if (includeClosed) {
    // Se includeClosed=true, restituisce tutte le sottocommesse assegnate
    return assignedSottocommesseIds;
  }
  
  // Filtra per data: esclude quelle di commesse chiuse alla data specificata
  const filteredIds = [];
  for (const sottocommessaId of assignedSottocommesseIds) {
    const isClosed = await isSottocommessaClosedOn(sottocommessaId, dateKey);
    if (!isClosed) {
      filteredIds.push(sottocommessaId);
    }
  }
  
  return filteredIds;
}