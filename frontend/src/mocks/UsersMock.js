export const ROLES = {
  DIPENDENTE: "DIPENDENTE",
  AMMINISTRATORE: "AMMINISTRATORE",
  DIRETTORE_TECNICO: "DIRETTORE_TECNICO",
  DIRETTORE_GENERALE: "DIRETTORE_GENERALE",
  PM_CAMPO: "PM_CAMPO",
  COORDINATORE: "COORDINATORE",
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
  },
  {
    id: "emp-002",
    username: "luigi.bianchi",
    password: "password",
    nome: "Luigi",
    cognome: "Bianchi",
    roles: [ROLES.DIPENDENTE],
    azienda: "INWAVE",
  },
  {
    id: "emp-003",
    username: "anna.verdi",
    password: "password",
    nome: "Anna",
    cognome: "Verdi",
    roles: [ROLES.DIPENDENTE],
    azienda: "STEP",
  },
  {
    id: "emp-004",
    username: "giulia.conti",
    password: "password",
    nome: "Giulia",
    cognome: "Conti",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
  },
  {
    id: "emp-005",
    username: "marco.neri",
    password: "password",
    nome: "Marco",
    cognome: "Neri",
    roles: [ROLES.DIPENDENTE],
    azienda: "INWAVE",
  },
  {
    id: "emp-006",
    username: "elisa.ferri",
    password: "password",
    nome: "Elisa",
    cognome: "Ferri",
    roles: [ROLES.DIPENDENTE],
    azienda: "STEP",
  },
  {
    id: "emp-007",
    username: "paolo.mancini",
    password: "password",
    nome: "Paolo",
    cognome: "Mancini",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
  },
  {
    id: "emp-008",
    username: "sara.galli",
    password: "password",
    nome: "Sara",
    cognome: "Galli",
    roles: [ROLES.DIPENDENTE],
    azienda: "INWAVE",
  },
  {
    id: "emp-009",
    username: "davide.moretti",
    password: "password",
    nome: "Davide",
    cognome: "Moretti",
    roles: [ROLES.DIPENDENTE],
    azienda: "STEP",
  },
  {
    id: "emp-010",
    username: "chiara.riva",
    password: "password",
    nome: "Chiara",
    cognome: "Riva",
    roles: [ROLES.DIPENDENTE],
    azienda: "BRT",
  },

  {
    id: "admin-001",
    username: "admin",
    password: "admin",
    nome: "Ada",
    cognome: "Min",
    roles: [ROLES.AMMINISTRATORE],
    azienda: "BRT",
  },
  {
    id: "dt-001",
    username: "dtec",
    password: "dtec",
    nome: "Teo",
    cognome: "Rico",
    roles: [ROLES.DIRETTORE_TECNICO],
    azienda: "INWAVE",
  },
  {
    id: "dg-001",
    username: "dg",
    password: "dg",
    nome: "Gino",
    cognome: "Dire",
    roles: [ROLES.DIRETTORE_GENERALE],
    azienda: "STEP",
  },
  {
    id: "pmc-001",
    username: "pmcampo",
    password: "pmcampo",
    nome: "Paolo",
    cognome: "Campo",
    roles: [ROLES.PM_CAMPO],
    azienda: "BRT",
  },
  {
    id: "coord-001",
    username: "coordinatore",
    password: "coordinatore",
    nome: "Cora",
    cognome: "Dinatore",
    roles: [ROLES.COORDINATORE],
    azienda: "INWAVE",
  },
];

export async function authenticate(username, password) {
  await new Promise((r) => setTimeout(r, 250));
  const found = USERS.find((u) => u.username === username && u.password === password);
  if (!found) throw new Error("Credenziali non valide");
  const { password: _omit, ...safe } = found;
  return {
    user: safe,
    token: `mock-token-${safe.id}`,
  };
}