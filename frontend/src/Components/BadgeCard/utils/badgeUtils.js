import LogoBRT from '@assets/LogoBRT.png';
import LogoGestionale from '@assets/LogoGestionale.png';
import LogoInwave from '@assets/LogoInwave.png';
import LogoSTEP from '@assets/LogoSTEP.png';

/**
 * Mapping between company key (uppercased) and its logo asset.
 */
export const COMPANY_LOGOS = Object.freeze({
  BRT: LogoBRT,
  INWAVE: LogoInwave,
  STEP: LogoSTEP,
});

/**
 * Resolve badge data (holderName, companyId, companyKey, logo) from props and user context.
 * Priority rules:
 *  - Explicit prop values override derived/user values.
 *  - companyKey uppercased; falls back to ''.
 *  - companyLogo prop overrides automatic mapping; fallback to LogoGestionale.
 * @param {object} params composite inputs
 * @param {object} params.props component props
 * @param {object|null} params.user auth user object
 * @returns {{holderName:string, companyId:string, companyKey:string, companyLogo:string}}
 */
export function resolveBadgeData({ props, user }) {
  const {
    holderName: propHolderName,
    companyId: propCompanyId,
    companyLogo: propCompanyLogo,
    company: propCompany,
  } = props;

  const holderName = (propHolderName && String(propHolderName).trim()) ||
    (user ? `${user.nome} ${user.cognome}` : '');
  const companyId = (propCompanyId && String(propCompanyId).trim()) || user?.id || '';
  const companyRaw = propCompany || user?.azienda || '';
  const companyKey = String(companyRaw).toUpperCase();
  const companyLogo = (propCompanyLogo && String(propCompanyLogo).trim()) ||
    COMPANY_LOGOS[companyKey] || LogoGestionale;

  return { holderName, companyId, companyKey, companyLogo };
}
