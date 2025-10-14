export const ROLES = {
  DIPENDENTE: "DIPENDENTE",
  AMMINISTRATORE: "AMMINISTRATORE",
  DIRETTORE_TECNICO: "DIRETTORE_TECNICO",
  DIRETTORE_GENERALE: "DIRETTORE_GENERALE",
  PM_CAMPO: "PM_CAMPO",
  COORDINATORE: "COORDINATORE",
  OPERAIO: "OPERAIO",
};

// Mock utenti (password in chiaro SOLO per mock)
const USERS = [
  {
    id: "emp-001",
    username: "mario.rossi",
    password: "password",
    nome: "Mario",
    cognome: "Rossi",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
    discipline: "MECH",
    canLogin: true,
  },
  {
    id: "emp-002",
    username: "luigi.bianchi",
    password: "password",
    nome: "Luigi",
    cognome: "Bianchi",
    roles: [ROLES.DIPENDENTE],
    azienda: "INWAVE",
    discipline: "ELEC",
    canLogin: true,
  },
  {
    id: "emp-003",
    username: "anna.verdi",
    password: "password",
    nome: "Anna",
    cognome: "Verdi",
    roles: [ROLES.DIPENDENTE],
    azienda: "STEP",
    discipline: "CIVIL",
    canLogin: true,
  },
  {
    id: "emp-004",
    username: "giulia.conti",
    password: "password",
    nome: "Giulia",
    cognome: "Conti",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
    discipline: "STRUCT",
    canLogin: true,
  },
  {
    id: "emp-005",
    username: "marco.neri",
    password: "password",
    nome: "Marco",
    cognome: "Neri",
    roles: [ROLES.DIPENDENTE],
    azienda: "INWAVE",
    discipline: "TELCO",
    canLogin: true,
  },
  {
    id: "emp-006",
    username: "elisa.ferri",
    password: "password",
    nome: "Elisa",
    cognome: "Ferri",
    roles: [ROLES.DIPENDENTE],
    azienda: "STEP",
    discipline: "SOFTWARE",
    canLogin: true,
  },
  {
    id: "emp-007",
    username: "paolo.mancini",
    password: "password",
    nome: "Paolo",
    cognome: "Mancini",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
    discipline: "PM",
    canLogin: true,
  },
  {
    id: "emp-008",
    username: "sara.galli",
    password: "password",
    nome: "Sara",
    cognome: "Galli",
    roles: [ROLES.DIPENDENTE],
    azienda: "INWAVE",
    discipline: "HSE",
    canLogin: true,
  },
  {
    id: "emp-009",
    username: "davide.moretti",
    password: "password",
    nome: "Davide",
    cognome: "Moretti",
    roles: [ROLES.DIPENDENTE],
    azienda: "STEP",
    discipline: "MECH",
    canLogin: true,
  },
  {
    id: "emp-010",
    username: "chiara.riva",
    password: "password",
    nome: "Chiara",
    cognome: "Riva",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
    discipline: "ELEC",
    canLogin: true,
  },

  {
    id: "admin-001",
    username: "admin",
    password: "admin",
    nome: "Ada",
    cognome: "Min",
    roles: [ROLES.AMMINISTRATORE],
    azienda: "BRT",
    canLogin: true,
  },
  {
    id: "dt-001",
    username: "dtec",
    password: "dtec",
    nome: "Teo",
    cognome: "Rico",
    roles: [ROLES.DIRETTORE_TECNICO],
    azienda: "INWAVE",
    canLogin: true,
  },
  {
    id: "dg-001",
    username: "dg",
    password: "dg",
    nome: "Gino",
    cognome: "Dire",
    roles: [ROLES.DIRETTORE_GENERALE],
    azienda: "STEP",
    canLogin: true,
  },
  {
    id: "pmc-001",
    username: "pmcampo",
    password: "pmcampo",
    nome: "Paolo",
    cognome: "Campo",
    roles: [ROLES.PM_CAMPO],
    azienda: "BRT",
    discipline: "PM",
    canLogin: true,
  },
  {
    id: "coord-001",
    username: "coordinatore",
    password: "coordinatore",
    nome: "Cora",
    cognome: "Dinatore",
    roles: [ROLES.COORDINATORE],
    azienda: "INWAVE",
    discipline: "PM",
    canLogin: true,
  },

  // Operai: utenti utilizzabili per timesheet di PM Campo, ma non abilitati al login
  { id: "op-001", username: "op1", password: "nopass", nome: "Luca", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "BRT", discipline: "MECH", canLogin: false },
  { id: "op-002", username: "op2", password: "nopass", nome: "Giorgio", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "BRT", discipline: "ELEC", canLogin: false },
  { id: "op-003", username: "op3", password: "nopass", nome: "Sandro", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "INWAVE", discipline: "MECH", canLogin: false },
  { id: "op-004", username: "op4", password: "nopass", nome: "Enrico", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "STEP", discipline: "CIVIL", canLogin: false },
  { id: "op-005", username: "op5", password: "nopass", nome: "Diego", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "STEP", discipline: "STRUCT", canLogin: false },
  { id: "op-006", username: "op6", password: "nopass", nome: "Paolo", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "BRT", discipline: "TELCO", canLogin: false },
  { id: "op-007", username: "op7", password: "nopass", nome: "Alessio", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "BRT", discipline: "MECH", canLogin: false },
  { id: "op-008", username: "op8", password: "nopass", nome: "Michele", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "INWAVE", discipline: "ELEC", canLogin: false },
  { id: "op-009", username: "op9", password: "nopass", nome: "Stefano", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "STEP", discipline: "TELCO", canLogin: false },
  { id: "op-010", username: "op10", password: "nopass", nome: "Franco", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "INWAVE", discipline: "STRUCT", canLogin: false },
  { id: "op-011", username: "op11", password: "nopass", nome: "Nicolò", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "BRT", discipline: "MECH", canLogin: false },
  { id: "op-012", username: "op12", password: "nopass", nome: "Matteo", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "BRT", discipline: "ELEC", canLogin: false },
  { id: "op-013", username: "op13", password: "nopass", nome: "Andrea", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "INWAVE", discipline: "SOFTWARE", canLogin: false },
  { id: "op-014", username: "op14", password: "nopass", nome: "Lorenzo", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "INWAVE", discipline: "TELCO", canLogin: false },
  { id: "op-015", username: "op15", password: "nopass", nome: "Gianni", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "STEP", discipline: "CIVIL", canLogin: false },
  { id: "op-016", username: "op16", password: "nopass", nome: "Fabio", cognome: "Operaio", roles: [ROLES.OPERAIO], azienda: "STEP", discipline: "STRUCT", canLogin: false },
];

export async function authenticate(username, password) {
  await new Promise((r) => setTimeout(r, 250));
  const found = USERS.find((u) => u.username === username && u.password === password);
  if (!found || found.canLogin === false) throw new Error("Credenziali non valide");
  const { password: _omit, ...safe } = found;
  return {
    user: safe,
    token: `mock-token-${safe.id}`,
  };
}

// Safe read-only accessors for other mocks (timesheet role enrichment)
export function listAllUsers() {
  return USERS.map(u => ({ ...u, password: undefined }));
}

export function findUserById(id) {
  const u = USERS.find(x => x.id === id);
  if (!u) return null;
  const { password: _pw, ...safe } = u; // rename unused var to satisfy lint
  return safe;
}