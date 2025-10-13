// Mock per il Registro Commesse Centralizzato
// Fornisce un catalogo di commesse con sottocommesse e gestione stati

// Registry centralizzato delle commesse
const COMMESSE_REGISTRY = [
  {
    id: 'VS-25-01',
    nome: 'Progetto Infrastrutture Viabilità',
    stato: 'ATTIVA',
    dataInizio: '2025-01-15',
    dataFine: '2025-12-31',
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
    nome: 'Manutenzione Impianti Industriali',
    stato: 'CHIUSA',
    dataInizio: '2025-03-01',
    dataFine: '2025-08-31',
    dataChiusura: '2025-09-01',
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
    nome: 'Centro Commerciale Green Plaza',
    stato: 'ATTIVA',
    dataInizio: '2025-02-01',
    dataFine: '2026-03-31',
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
    nome: 'Rilievi Topografici Zona Industriale',
    stato: 'CHIUSA',
    dataInizio: '2024-11-01',
    dataFine: '2025-04-30',
    dataChiusura: '2025-05-15',
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
  }
];

// Storage in memoria - clona i dati per preservare l'immutabilità
let commesseStorage = COMMESSE_REGISTRY.map(commessa => ({
  ...commessa,
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

// Export di default per compatibilità
export default {
  listCommesse,
  getCommessa,
  listSottocommesse,
  listAllSottocommesse,
  isSottocommessaServiceAware,
  isCommessaClosedOn,
  isSottocommessaClosedOn,
  pickRandomSottocommessa,
  pickRandomServizio,
  getSottocommesseAttive,
  getStatisticheCommesse,
  getServiziUtilizzati
};