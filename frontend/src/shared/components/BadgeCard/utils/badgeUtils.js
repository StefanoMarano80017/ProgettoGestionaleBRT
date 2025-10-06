import LogoBRT from '@assets/LogoBRT.png';
import LogoGestionale from '@assets/LogoGestionale.png';
import LogoInwave from '@assets/LogoInwave.png';
import LogoSTEP from '@assets/LogoSTEP.png';

export const COMPANY_LOGOS = Object.freeze({
  BRT: LogoBRT,
  INWAVE: LogoInwave,
  STEP: LogoSTEP,
});

export function resolveBadgeData({ props, user }) {
  const { holderName: propHolderName, companyId: propCompanyId, companyLogo: propCompanyLogo, company: propCompany } = props;
  const holderName = (propHolderName && String(propHolderName).trim()) || (user ? `${user.nome} ${user.cognome}` : '');
  const companyId = (propCompanyId && String(propCompanyId).trim()) || user?.id || '';
  const companyRaw = propCompany || user?.azienda || '';
  const companyKey = String(companyRaw).toUpperCase();
  const companyLogo = (propCompanyLogo && String(propCompanyLogo).trim()) || COMPANY_LOGOS[companyKey] || LogoGestionale;
  return { holderName, companyId, companyKey, companyLogo };
}
