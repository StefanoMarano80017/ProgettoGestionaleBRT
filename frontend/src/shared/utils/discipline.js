export const DISCIPLINES = ['MECH', 'ELEC', 'CIVIL', 'STRUCT', 'TELCO', 'SOFTWARE', 'PM', 'HSE'];

export const DISCIPLINE_LABEL = {
  MECH: 'Meccanica',
  ELEC: 'Elettrica',
  CIVIL: 'Civile',
  STRUCT: 'Strutturale',
  TELCO: 'Telco',
  SOFTWARE: 'Software',
  PM: 'Project Mgmt',
  HSE: 'HSE',
};

export function getDisciplineLabel(code) {
  return DISCIPLINE_LABEL[code] || code;
}
