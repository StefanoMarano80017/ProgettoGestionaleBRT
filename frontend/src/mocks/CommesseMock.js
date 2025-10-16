// Mock per il Registro Commesse Centralizzato
// Fornisce un catalogo di commesse con sottocommesse e gestione stati
import { EMPLOYEE_COMMESSE } from './ProjectMock.js';

// Registry centralizzato delle commesse
const COMMESSE_REGISTRY = [
  {
    id: 'VS-25-01',
    codice: 'VS-25-01',
    nome: 'Progetto Infrastrutture Viabilità',
    stato: 'ATTIVA',
    tipo: ['ENGINEERING', 'NETWORK'],
    dataInizio: '2025-01-15',
    dataFine: '2025-12-31',
    createdAt: '2025-01-10',
    updatedAt: '2025-09-15',
    lastActivityAt: '2025-09-18',
    tags: ['Priorità A', 'Viabilità'],
    cliente: 'Comune di Milano',
    descrizione: 'Progetto di ammodernamento infrastrutture viabilità urbana',
    sottocommesse: [
      {
        id: 'VS-25-01-DL',
        nome: 'DL+Collaudo',
        descrizione: 'Direzione lavori e collaudo finale',
        servizi: ['DL', 'COLLAUDO'],
        responsabile: 'Mario Rossi',
        budgetOre: 480
      },
      {
        id: 'VS-25-01-INST',
        nome: 'Installazione',
        descrizione: 'Installazione impianti elettrici e sistemi SCADA',
        servizi: ['INST_ELE', 'SCADA'],
        responsabile: 'Luigi Verdi',
        budgetOre: 320
      }
    ]
  },
  {
    id: 'VS-25-02',
    codice: 'VS-25-02',
    nome: 'Manutenzione Impianti Industriali',
    stato: 'CHIUSA',
    tipo: ['NETWORK'],
    dataInizio: '2025-03-01',
    dataFine: '2025-08-31',
    dataChiusura: '2025-09-01',
    createdAt: '2025-02-20',
    updatedAt: '2025-09-01',
    lastActivityAt: '2025-09-01',
    tags: ['Manutenzione'],
    cliente: 'Azienda Manifatturiera SpA',
    descrizione: 'Servizi di manutenzione ordinaria e straordinaria',
    sottocommesse: [
      {
        id: 'VS-25-02-MANUT',
        nome: 'Manutenzione Generale',
        descrizione: 'Manutenzione preventiva e correttiva',
        servizi: ['MANUT'],
        responsabile: 'Giuseppe Bianchi',
        budgetOre: 200
      }
    ]
  },
  {
    id: 'VS-25-03',
    codice: 'VS-25-03',
    nome: 'Centro Commerciale Green Plaza',
    stato: 'ATTIVA',
    tipo: ['ENGINEERING'],
    dataInizio: '2025-02-01',
    dataFine: '2026-03-31',
    createdAt: '2025-01-20',
    updatedAt: '2025-09-12',
    lastActivityAt: '2025-09-12',
    tags: ['Retail', 'Green'],
    cliente: 'Green Plaza Development',
    descrizione: 'Progettazione esecutiva e sistemi antincendio per nuovo centro commerciale',
    sottocommesse: [
      {
        id: 'VS-25-03-PROG',
        nome: 'Progettazione Completa',
        descrizione: 'Progettazione esecutiva, BIM e sistemi antincendio',
        servizi: ['PROG_ESEC', 'BIM', 'ANTINC'],
        responsabile: 'Anna Neri',
        budgetOre: 600
      }
    ]
  },
  {
    id: 'VS-24-04',
    codice: 'VS-24-04',
    nome: 'Rilievi Topografici Zona Industriale',
    stato: 'CHIUSA',
    tipo: ['ENGINEERING'],
    dataInizio: '2024-11-01',
    dataFine: '2025-04-30',
    dataChiusura: '2025-05-15',
    createdAt: '2024-10-20',
    updatedAt: '2025-05-15',
    lastActivityAt: '2025-05-15',
    tags: ['Rilievi'],
    cliente: 'Consorzio Industriale Nord',
    descrizione: 'Rilievi topografici per espansione zona industriale',
    sottocommesse: [
      {
        id: 'VS-24-04-RILIEVI',
        nome: 'Rilievi e Tarature',
        descrizione: 'Rilievi topografici e taratura strumentazione',
        servizi: ['RILIEVI', 'TARATURE'],
        responsabile: 'Marco Gialli',
        budgetOre: 150
      }
    ]
  },
  {
    id: 'EN-25-04',
    codice: 'EN-25-04',
    nome: 'Impianto Energetico Campus Universitario',
    stato: 'ATTIVA',
    tipo: ['ENGINEERING'],
    dataInizio: '2025-05-01',
    dataFine: '2026-01-31',
    createdAt: '2025-04-22',
    updatedAt: '2025-09-05',
    lastActivityAt: '2025-09-20',
    tags: ['Energia', 'Sostenibilità'],
    cliente: 'Università Regionale',
    descrizione: 'Progettazione impianti energetici ad alta efficienza per un nuovo campus universitario',
    sottocommesse: [
      {
        id: 'EN-25-04-STR',
        nome: 'Strutturale e Fondazioni',
        descrizione: 'Analisi strutturale e progettazione fondazioni',
        servizi: ['STRUTTURALE', 'GEOTECNICA'],
        responsabile: 'Laura Sarti',
        budgetOre: 420
      },
      {
        id: 'EN-25-04-MEP',
        nome: 'Impianti MEP',
        descrizione: 'Progettazione impianti meccanici ed elettrici',
        servizi: ['MEP', 'HVAC'],
        responsabile: 'Giovanni Lodi',
        budgetOre: 380
      }
    ]
  },
  {
    id: 'EN-25-05',
    codice: 'EN-25-05',
    nome: 'Polo Logistico Automatizzato',
    stato: 'ATTIVA',
    tipo: ['ENGINEERING'],
    dataInizio: '2025-07-10',
    dataFine: '2026-05-30',
    createdAt: '2025-06-28',
    updatedAt: '2025-09-22',
    lastActivityAt: '2025-09-24',
    tags: ['Logistica', 'Automazione'],
    cliente: 'Global Logistics SA',
    descrizione: 'Progettazione integrata impianti di automazione per hub logistico',
    sottocommesse: [
      {
        id: 'EN-25-05-PROG',
        nome: 'Progettazione impianti',
        descrizione: 'Coordinamento progettazione impianti automatici e layout',
        servizi: ['PROG_ESEC', 'BIM'],
        responsabile: 'Marta Orsi',
        budgetOre: 520
      },
      {
        id: 'EN-25-05-FIRE',
        nome: 'Prevenzione incendi',
        descrizione: 'Analisi rischio incendio e progettazione sistemi di sicurezza',
        servizi: ['ANTINC', 'SICUREZZA'],
        responsabile: 'Mattia Ferrero',
        budgetOre: 260
      }
    ]
  },
  {
    id: 'NW-25-04',
    codice: 'NW-25-04',
    nome: 'Espansione Rete Fibra Metropolitana',
    stato: 'ATTIVA',
    tipo: ['NETWORK'],
    dataInizio: '2025-04-05',
    dataFine: '2025-11-30',
    createdAt: '2025-03-18',
    updatedAt: '2025-09-08',
    lastActivityAt: '2025-09-21',
    tags: ['Fibra', 'Metropolitana'],
    cliente: 'Città Metropolitana',
    descrizione: 'Realizzazione dorsali in fibra ottica per il potenziamento della connettività urbana',
    sottocommesse: [
      {
        id: 'NW-25-04-DEP',
        nome: 'Deployment dorsali',
        descrizione: 'Posa cavi primari e giunzione dorsali',
        servizi: ['POSA_FIBRA', 'GIUNZIONE'],
        responsabile: 'Federico Serra',
        budgetOre: 300
      },
      {
        id: 'NW-25-04-POP',
        nome: 'Installazione POP',
        descrizione: 'Installazione punti di presenza e apparati attivi',
        servizi: ['INSTALL_POP', 'CONFIG_RETE'],
        responsabile: 'Giusy Perri',
        budgetOre: 240
      }
    ]
  },
  {
    id: 'NW-25-05',
    codice: 'NW-25-05',
    nome: 'Upgrade Rete Wireless Portuale',
    stato: 'ATTIVA',
    tipo: ['NETWORK'],
    dataInizio: '2025-06-01',
    dataFine: '2025-12-15',
    createdAt: '2025-05-18',
    updatedAt: '2025-09-19',
    lastActivityAt: '2025-09-26',
    tags: ['Wireless', 'Portuale'],
    cliente: 'Autorità Portuale',
    descrizione: 'Aggiornamento infrastruttura wireless per aree operative portuali',
    sottocommesse: [
      {
        id: 'NW-25-05-SURV',
        nome: 'Survey radio',
        descrizione: 'Rilievi radio e pianificazione coperture',
        servizi: ['SURVEY_RADIO', 'RF_PLANNING'],
        responsabile: 'Chiara Bassi',
        budgetOre: 180
      },
      {
        id: 'NW-25-05-UPG',
        nome: 'Upgrade apparati wireless',
        descrizione: 'Installazione e configurazione apparati Wi-Fi 6E e ponti radio',
        servizi: ['INSTALL_WIFI', 'CONFIG_RADIO'],
        responsabile: 'Stefano Rizzo',
        budgetOre: 260
      }
    ]
  }
];

const normalizeTipo = (value) => {
  if (!value) return ['ENGINEERING'];
  const rawList = Array.isArray(value) ? value : [value];
  const cleaned = rawList
    .map((item) => String(item || '').toUpperCase())
    .filter((item) => item.length > 0);
  return cleaned.length ? Array.from(new Set(cleaned)) : ['ENGINEERING'];
};

// Storage in memoria - clona i dati per preservare l'immutabilità
let commesseStorage = COMMESSE_REGISTRY.map(commessa => ({
  ...commessa,
  tipo: normalizeTipo(commessa.tipo),
  sottocommesse: commessa.sottocommesse.map(sotto => ({
    ...sotto,
    servizi: [...sotto.servizi]
  }))
}));

/**
 * Restituisce la lista delle commesse (esclude quelle chiuse di default)
 * @param {Object} options - Opzioni di filtro
 * @param {boolean} options.includeClosed - Include le commesse chiuse
 * @returns {Promise<Array>} Lista clonata delle commesse
 */
export const listCommesse = async ({ includeClosed = false } = {}) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  let filtered = commesseStorage;
  if (!includeClosed) {
    filtered = commesseStorage.filter(c => c.stato !== 'CHIUSA');
  }
  
  return filtered.map(commessa => ({
    ...commessa,
    tipo: [...commessa.tipo],
    sottocommesse: commessa.sottocommesse.map(sotto => ({
      ...sotto,
      servizi: [...sotto.servizi]
    }))
  }));
};

/**
 * Recupera una commessa specifica per ID
 * @param {string} id - ID della commessa da recuperare
 * @returns {Promise<Object|null>} Commessa trovata o null
 */
export const getCommessa = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 30));
  
  const commessa = commesseStorage.find(c => c.id === id);
  if (!commessa) return null;
  
  return {
    ...commessa,
    tipo: [...commessa.tipo],
    sottocommesse: commessa.sottocommesse.map(sotto => ({
      ...sotto,
      servizi: [...sotto.servizi]
    }))
  };
};

/**
 * Restituisce tutte le sottocommesse di una commessa
 * @param {string} commessaId - ID della commessa
 * @returns {Promise<Array>} Lista delle sottocommesse
 */
export const listSottocommesse = async (commessaId) => {
  await new Promise(resolve => setTimeout(resolve, 40));
  
  const commessa = commesseStorage.find(c => c.id === commessaId);
  if (!commessa) return [];
  
  return commessa.sottocommesse.map(sotto => ({
    ...sotto,
    tipo: [...commessa.tipo],
    servizi: [...sotto.servizi]
  }));
};

/**
 * Verifica se una sottocommessa ha servizi associati
 * @param {string} sottocommessaId - ID della sottocommessa
 * @returns {Promise<boolean>} True se ha servizi associati
 */
export const isSottocommessaServiceAware = async (sottocommessaId) => {
  await new Promise(resolve => setTimeout(resolve, 20));
  
  for (const commessa of commesseStorage) {
    const sottocommessa = commessa.sottocommesse.find(s => s.id === sottocommessaId);
    if (sottocommessa) {
      return Array.isArray(sottocommessa.servizi) && sottocommessa.servizi.length > 0;
    }
  }
  return false;
};

/**
 * Verifica se una commessa è chiusa alla data specificata
 * @param {string} commessaId - ID della commessa
 * @param {string} dateKey - Data da verificare (formato YYYY-MM-DD)
 * @returns {Promise<boolean>} True se la commessa è chiusa alla data
 */
export const isCommessaClosedOn = async (commessaId, dateKey) => {
  await new Promise(resolve => setTimeout(resolve, 20));
  
  const commessa = commesseStorage.find(c => c.id === commessaId);
  if (!commessa || !commessa.dataChiusura) return false;
  
  const dataChiusura = new Date(commessa.dataChiusura);
  const dataVerifica = new Date(dateKey);
  
  return dataVerifica >= dataChiusura;
};

/**
 * Helper per selezionare una sottocommessa casuale (utility per mock)
 * @param {string} commessaId - ID della commessa (opzionale)
 * @returns {Promise<Object|null>} Sottocommessa casuale
 */
export const pickRandomSottocommessa = async (commessaId = null) => {
  await new Promise(resolve => setTimeout(resolve, 30));
  
  let alleSottocommesse = [];
  
  if (commessaId) {
    const commessa = commesseStorage.find(c => c.id === commessaId);
    if (commessa) {
      alleSottocommesse = commessa.sottocommesse;
    }
  } else {
    // Tutte le sottocommesse di tutte le commesse attive
    alleSottocommesse = commesseStorage
      .filter(c => c.stato === 'ATTIVA')
      .flatMap(c => c.sottocommesse);
  }
  
  if (alleSottocommesse.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * alleSottocommesse.length);
  const selected = alleSottocommesse[randomIndex];
  
  return {
    ...selected,
    servizi: [...selected.servizi]
  };
};

/**
 * Helper per selezionare un servizio casuale da una sottocommessa
 * @param {string} sottocommessaId - ID della sottocommessa (opzionale)
 * @returns {Promise<string|null>} Servizio casuale
 */
export const pickRandomServizio = async (sottocommessaId = null) => {
  await new Promise(resolve => setTimeout(resolve, 30));
  
  let servizi = [];
  
  if (sottocommessaId) {
    for (const commessa of commesseStorage) {
      const sottocommessa = commessa.sottocommesse.find(s => s.id === sottocommessaId);
      if (sottocommessa) {
        servizi = sottocommessa.servizi;
        break;
      }
    }
  } else {
    // Tutti i servizi di tutte le commesse attive
    servizi = [
      ...new Set(
        commesseStorage
          .filter(c => c.stato === 'ATTIVA')
          .flatMap(c => c.sottocommesse)
          .flatMap(s => s.servizi)
      )
    ];
  }
  
  if (servizi.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * servizi.length);
  return servizi[randomIndex];
};

/**
 * Restituisce tutte le sottocommesse attive con i loro servizi
 * @returns {Promise<Array>} Lista di sottocommesse con servizi
 */
export const getSottocommesseAttive = async () => {
  await new Promise(resolve => setTimeout(resolve, 40));
  
  return commesseStorage
    .filter(c => c.stato === 'ATTIVA')
    .flatMap(c => 
      c.sottocommesse.map(s => ({
        ...s,
        tipo: [...c.tipo],
        commessaId: c.id,
        commessaNome: c.nome,
        servizi: [...s.servizi]
      }))
    );
};

/**
 * Restituisce tutte le sottocommesse (flat list) con info della commessa parent
 * @param {Object} options - Opzioni di filtro
 * @param {boolean} options.includeClosed - Include le sottocommesse di commesse chiuse
 * @returns {Promise<Array>} Lista piatta di sottocommesse
 */
export const listAllSottocommesse = async ({ includeClosed = false } = {}) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  let filtered = commesseStorage;
  if (!includeClosed) {
    filtered = commesseStorage.filter(c => c.stato !== 'CHIUSA');
  }
  
  return filtered.flatMap(commessa => 
    commessa.sottocommesse.map(sotto => ({
      id: sotto.id,
      nome: sotto.nome,
      descrizione: sotto.descrizione,
      servizi: [...sotto.servizi],
      responsabile: sotto.responsabile,
      budgetOre: sotto.budgetOre,
      // Info della commessa parent
      commessaId: commessa.id,
      commessaNome: commessa.nome,
      commessaStato: commessa.stato,
      commessaTipo: [...commessa.tipo],
      commessaCliente: commessa.cliente,
      commessaDataInizio: commessa.dataInizio,
      commessaDataFine: commessa.dataFine,
      commessaDataChiusura: commessa.dataChiusura
    }))
  );
};

/**
 * Verifica se una sottocommessa è chiusa (basato sulla commessa parent)
 * @param {string} sottocommessaId - ID della sottocommessa
 * @param {string} dateKey - Data da verificare (formato YYYY-MM-DD)
 * @returns {Promise<boolean>} True se la sottocommessa/commessa è chiusa alla data
 */
export const isSottocommessaClosedOn = async (sottocommessaId, dateKey) => {
  await new Promise(resolve => setTimeout(resolve, 20));
  
  // Trova la commessa parent di questa sottocommessa
  for (const commessa of commesseStorage) {
    const hasSottocommessa = commessa.sottocommesse.some(s => s.id === sottocommessaId);
    if (hasSottocommessa) {
      // Verifica se la commessa parent è chiusa
      if (!commessa.dataChiusura) return false;
      
      const dataChiusura = new Date(commessa.dataChiusura);
      const dataVerifica = new Date(dateKey);
      
      return dataVerifica >= dataChiusura;
    }
  }
  
  return false; // Sottocommessa non trovata
};

/**
 * Restituisce statistiche sulle commesse
 * @returns {Promise<Object>} Statistiche delle commesse
 */
export const getStatisticheCommesse = async () => {
  await new Promise(resolve => setTimeout(resolve, 30));
  
  const attive = commesseStorage.filter(c => c.stato === 'ATTIVA').length;
  const chiuse = commesseStorage.filter(c => c.stato === 'CHIUSA').length;
  const sospese = commesseStorage.filter(c => c.stato === 'SOSPESA').length;
  const totaleSottocommesse = commesseStorage.reduce((acc, c) => acc + c.sottocommesse.length, 0);
  
  return {
    totaleCommesse: commesseStorage.length,
    attive,
    chiuse,
    sospese,
    totaleSottocommesse
  };
};

/**
 * Restituisce tutti i servizi unici utilizzati nelle commesse
 * @returns {Promise<Array>} Lista dei servizi utilizzati
 */
export const getServiziUtilizzati = async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
  
  const servizi = new Set(
    commesseStorage
      .flatMap(c => c.sottocommesse)
      .flatMap(s => s.servizi)
  );
  
  return Array.from(servizi).sort();
};

const delay = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeState = (stato) => String(stato || '').toLowerCase();

const buildCommessaSummary = (commessa) => {
  const lastActivity = commessa.lastActivityAt || commessa.updatedAt || commessa.dataFine || commessa.dataChiusura || commessa.dataInizio;
  const dateObj = lastActivity ? new Date(lastActivity) : null;
  const year = dateObj?.getFullYear?.() ?? null;
  const month = dateObj ? dateObj.getMonth() + 1 : null;
  return {
    id: commessa.id,
    codice: commessa.codice || commessa.id,
    nome: commessa.nome || commessa.codice || commessa.id,
    stato: normalizeState(commessa.stato),
    tipo: [...commessa.tipo],
    createdAt: commessa.createdAt || commessa.dataInizio,
    updatedAt: commessa.updatedAt || commessa.dataFine || commessa.createdAt,
    lastActivityAt: commessa.lastActivityAt || commessa.updatedAt || commessa.dataFine || commessa.dataInizio,
    tags: Array.isArray(commessa.tags) ? [...commessa.tags] : [],
    parentId: commessa.parentId || null,
    cliente: commessa.cliente || null,
    descrizione: commessa.descrizione || '',
    dataInizio: commessa.dataInizio || null,
    dataFine: commessa.dataFine || null,
    dataChiusura: commessa.dataChiusura || null,
    displayLabel: commessa.nome || commessa.codice || commessa.id,
    year,
    month,
  };
};

export const listAllCommesse = async ({ includeClosed = true } = {}) => {
  await delay();
  const filtered = includeClosed ? commesseStorage : commesseStorage.filter(c => normalizeState(c.stato) !== 'chiusa');
  return filtered
    .map((commessa) => buildCommessaSummary(commessa))
    .sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));
};

const buildAssignedEmployees = (commessaId) => {
  if (!commessaId) return [];
  const prefix = `${commessaId}-`;
  return Object.entries(EMPLOYEE_COMMESSE)
    .filter(([employeeId]) => employeeId !== 'default')
    .filter(([, assignments]) => Array.isArray(assignments))
    .filter(([, assignments]) => assignments.some((code) => code === commessaId || code?.startsWith(prefix)))
    .map(([employeeId]) => employeeId);
};

export const getCommessaDetails = async (commessaId) => {
  await delay();
  const commessa = commesseStorage.find((c) => c.id === commessaId);
  if (!commessa) return null;
  return {
    id: commessa.id,
    codice: commessa.codice || commessa.id,
    stato: normalizeState(commessa.stato),
    tipo: [...commessa.tipo],
    sottocommesse: commessa.sottocommesse.map((s) => s.id),
    assignedEmployeeIds: buildAssignedEmployees(commessa.id),
    lastActivityAt: commessa.lastActivityAt || commessa.updatedAt,
    tags: Array.isArray(commessa.tags) ? [...commessa.tags] : [],
  };
};

const ensureEmployeeAssignments = (employeeId) => {
  if (!employeeId) return [];
  const existing = EMPLOYEE_COMMESSE[employeeId];
  if (Array.isArray(existing)) {
    return existing;
  }
  const base = Array.isArray(EMPLOYEE_COMMESSE.default) ? [...EMPLOYEE_COMMESSE.default] : [];
  EMPLOYEE_COMMESSE[employeeId] = base;
  return base;
};

const touchCommessaMetadata = (commessa) => {
  if (!commessa) return;
  const now = new Date().toISOString();
  commessa.updatedAt = now;
  commessa.lastActivityAt = now;
};

const getCommessaById = (commessaId) => commesseStorage.find((c) => c.id === commessaId) || null;

export const addEmployeeCommessa = async (employeeId, commessaId) => {
  await delay(120);
  const commessa = getCommessaById(commessaId);
  if (!commessa) {
    throw new Error('Commessa non trovata');
  }
  if (normalizeState(commessa.stato) === 'chiusa') {
    throw new Error('La commessa è chiusa');
  }

  const current = ensureEmployeeAssignments(employeeId);
  const next = new Set(current);
  const subIds = commessa.sottocommesse.map((s) => s.id);
  if (subIds.length === 0) {
    next.add(commessa.id);
  } else {
    subIds.forEach((id) => next.add(id));
  }
  const updated = Array.from(next);
  EMPLOYEE_COMMESSE[employeeId] = updated;
  touchCommessaMetadata(commessa);
  return { ok: true, assigned: [...updated] };
};

export const removeEmployeeCommessa = async (employeeId, commessaId) => {
  await delay(120);
  const commessa = getCommessaById(commessaId);
  if (!commessa) {
    throw new Error('Commessa non trovata');
  }

  const current = ensureEmployeeAssignments(employeeId);
  const prefix = `${commessa.id}-`;
  const updated = current.filter((code) => !(code === commessa.id || (typeof code === 'string' && code.startsWith(prefix))));
  EMPLOYEE_COMMESSE[employeeId] = updated;
  touchCommessaMetadata(commessa);
  return { ok: true, assigned: [...updated] };
};

export const setEmployeeCommesse = async (employeeId, commesse) => {
  await delay(120);
  if (!employeeId) {
    throw new Error('employeeId richiesto');
  }
  const safeList = Array.isArray(commesse) ? commesse.filter(Boolean) : [];
  EMPLOYEE_COMMESSE[employeeId] = Array.from(new Set(safeList));
  // Heuristically touch all commesse to keep explorer updated
  safeList
    .map((code) => (typeof code === 'string' ? code.split('-')[0] : null))
    .filter(Boolean)
    .forEach((commessaId) => {
      const commessa = getCommessaById(commessaId);
      if (commessa) touchCommessaMetadata(commessa);
    });
  return { ok: true, assigned: [...EMPLOYEE_COMMESSE[employeeId]] };
};

// Export di default per compatibilità
export default {
  listCommesse,
  listAllCommesse,
  getCommessa,
  getCommessaDetails,
  listSottocommesse,
  listAllSottocommesse,
  isSottocommessaServiceAware,
  isCommessaClosedOn,
  isSottocommessaClosedOn,
  pickRandomSottocommessa,
  pickRandomServizio,
  getSottocommesseAttive,
  getStatisticheCommesse,
  getServiziUtilizzati,
  addEmployeeCommessa,
  removeEmployeeCommessa,
  setEmployeeCommesse,
};