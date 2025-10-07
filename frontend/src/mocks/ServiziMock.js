// Mock per il Catalogo Servizi
// Fornisce un catalogo riusabile di servizi con operazioni CRUD in memoria

// Dataset iniziale dei servizi
const SERVIZI_INIZIALI = [
  {
    id: 'DL',
    nome: 'Direzione Lavori',
    categoria: 'Gestionale',
    tags: ['costruzioni', 'direzione', 'cantiere'],
    attivo: true,
    descrizione: 'Servizi di direzione lavori per progetti di costruzione'
  },
  {
    id: 'COLLAUDO',
    nome: 'Collaudo',
    categoria: 'Controllo Qualità',
    tags: ['test', 'verifica', 'qualità'],
    attivo: true,
    descrizione: 'Servizi di collaudo e verifica conformità'
  },
  {
    id: 'INST_ELE',
    nome: 'Installazioni Elettriche',
    categoria: 'Elettrico',
    tags: ['elettrico', 'installazione', 'impianti'],
    attivo: true,
    descrizione: 'Progettazione e installazione impianti elettrici'
  },
  {
    id: 'SCADA',
    nome: 'Sistemi SCADA',
    categoria: 'Automazione',
    tags: ['automazione', 'controllo', 'monitoraggio'],
    attivo: true,
    descrizione: 'Sviluppo e implementazione sistemi SCADA'
  },
  {
    id: 'PROG_ESEC',
    nome: 'Progettazione Esecutiva',
    categoria: 'Progettazione',
    tags: ['progettazione', 'esecutivo', 'tecnico'],
    attivo: true,
    descrizione: 'Servizi di progettazione esecutiva dettagliata'
  },
  {
    id: 'MANUT',
    nome: 'Manutenzione',
    categoria: 'Assistenza',
    tags: ['manutenzione', 'assistenza', 'supporto'],
    attivo: true,
    descrizione: 'Servizi di manutenzione ordinaria e straordinaria'
  },
  {
    id: 'RILIEVI',
    nome: 'Rilievi',
    categoria: 'Topografia',
    tags: ['rilievo', 'topografia', 'misurazione'],
    attivo: true,
    descrizione: 'Servizi di rilievo topografico e architettonico'
  },
  {
    id: 'ANTINC',
    nome: 'Antincendio',
    categoria: 'Sicurezza',
    tags: ['antincendio', 'sicurezza', 'prevenzione'],
    attivo: true,
    descrizione: 'Progettazione e installazione sistemi antincendio'
  },
  {
    id: 'BIM',
    nome: 'Building Information Modeling',
    categoria: 'Modellazione',
    tags: ['BIM', 'modellazione', '3D', 'digitale'],
    attivo: true,
    descrizione: 'Servizi di modellazione BIM e gestione digitale progetti'
  },
  {
    id: 'TARATURE',
    nome: 'Tarature',
    categoria: 'Metrologia',
    tags: ['taratura', 'calibrazione', 'strumentazione'],
    attivo: true,
    descrizione: 'Servizi di taratura e calibrazione strumentazione'
  },
  {
    id: 'CSE_CSP',
    nome: 'Coordinamento Sicurezza',
    categoria: 'Sicurezza',
    tags: ['sicurezza', 'coordinamento', 'CSE', 'CSP'],
    attivo: true,
    descrizione: 'Coordinamento sicurezza in fase di esecuzione e progettazione'
  }
];

// Storage in memoria - clona i dati iniziali per preservare l'immutabilità
let serviziStorage = SERVIZI_INIZIALI.map(servizio => ({ ...servizio, tags: [...servizio.tags] }));

/**
 * Restituisce la lista completa dei servizi (clonata)
 * @returns {Promise<Array>} Lista clonata dei servizi
 */
export const listServizi = async () => {
  // Simula un delay asincrono
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Restituisce una copia profonda per evitare mutazioni accidentali
  return serviziStorage.map(servizio => ({
    ...servizio,
    tags: [...servizio.tags]
  }));
};

/**
 * Recupera un servizio specifico per ID
 * @param {string} id - ID del servizio da recuperare
 * @returns {Promise<Object|null>} Servizio trovato o null
 */
export const getServizio = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 30));
  
  const servizio = serviziStorage.find(s => s.id === id);
  return servizio ? {
    ...servizio,
    tags: [...servizio.tags]
  } : null;
};

/**
 * Inserisce un nuovo servizio o aggiorna uno esistente
 * @param {Object} dto - Dati del servizio (deve contenere almeno id, nome, categoria)
 * @returns {Promise<Object>} Servizio inserito/aggiornato
 */
export const upsertServizio = async (dto) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Validazione base
  if (!dto.id || !dto.nome || !dto.categoria) {
    throw new Error('Campi obbligatori mancanti: id, nome, categoria');
  }
  
  // Normalizza i dati
  const servizioNormalizzato = {
    id: dto.id,
    nome: dto.nome,
    categoria: dto.categoria,
    tags: Array.isArray(dto.tags) ? [...dto.tags] : [],
    attivo: dto.attivo !== undefined ? dto.attivo : true,
    ...(dto.descrizione && { descrizione: dto.descrizione })
  };
  
  // Trova se esiste già
  const indiceEsistente = serviziStorage.findIndex(s => s.id === dto.id);
  
  if (indiceEsistente >= 0) {
    // Aggiorna esistente
    serviziStorage[indiceEsistente] = servizioNormalizzato;
  } else {
    // Inserisce nuovo
    serviziStorage.push(servizioNormalizzato);
  }
  
  return { ...servizioNormalizzato, tags: [...servizioNormalizzato.tags] };
};

/**
 * Attiva/disattiva un servizio
 * @param {string} id - ID del servizio
 * @param {boolean} attivo - Nuovo stato attivo/disattivo
 * @returns {Promise<Object|null>} Servizio aggiornato o null se non trovato
 */
export const toggleServizio = async (id, attivo) => {
  await new Promise(resolve => setTimeout(resolve, 80));
  
  const servizio = serviziStorage.find(s => s.id === id);
  if (!servizio) {
    return null;
  }
  
  servizio.attivo = attivo;
  
  return {
    ...servizio,
    tags: [...servizio.tags]
  };
};

/**
 * Filtra servizi per categoria
 * @param {string} categoria - Categoria da filtrare
 * @returns {Promise<Array>} Lista servizi della categoria specificata
 */
export const getServiziPerCategoria = async (categoria) => {
  await new Promise(resolve => setTimeout(resolve, 40));
  
  return serviziStorage
    .filter(s => s.categoria === categoria)
    .map(servizio => ({
      ...servizio,
      tags: [...servizio.tags]
    }));
};

/**
 * Cerca servizi per tag
 * @param {string} tag - Tag da cercare
 * @returns {Promise<Array>} Lista servizi che contengono il tag
 */
export const getServiziPerTag = async (tag) => {
  await new Promise(resolve => setTimeout(resolve, 40));
  
  return serviziStorage
    .filter(s => s.tags.includes(tag))
    .map(servizio => ({
      ...servizio,
      tags: [...servizio.tags]
    }));
};

/**
 * Restituisce tutte le categorie uniche
 * @returns {Promise<Array>} Lista delle categorie disponibili
 */
export const getCategorie = async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
  
  const categorie = [...new Set(serviziStorage.map(s => s.categoria))];
  return categorie.sort();
};

/**
 * Restituisce tutti i tag unici
 * @returns {Promise<Array>} Lista dei tag disponibili
 */
export const getTags = async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
  
  const tags = [...new Set(serviziStorage.flatMap(s => s.tags))];
  return tags.sort();
};

/**
 * Reset del catalogo ai dati iniziali (utile per test)
 * @returns {Promise<void>}
 */
export const resetCatalogo = async () => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  serviziStorage = SERVIZI_INIZIALI.map(servizio => ({ 
    ...servizio, 
    tags: [...servizio.tags] 
  }));
};

// Export di default per compatibilità
export default {
  listServizi,
  getServizio,
  upsertServizio,
  toggleServizio,
  getServiziPerCategoria,
  getServiziPerTag,
  getCategorie,
  getTags,
  resetCatalogo
};