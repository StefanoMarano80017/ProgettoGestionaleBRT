// DEBUG_TS: enable verbose staging logs when VITE_TS_DEBUG is truthy and not production.
// Avoid referencing undefined globals (process in browsers) to satisfy eslint no-undef.
// Access process via globalThis to avoid eslint no-undef in browser bundles.
const globalProcess = typeof globalThis !== 'undefined' && globalThis.process ? globalThis.process : undefined;
const hasProcess = !!(globalProcess && globalProcess.env);
const isProd = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'production')
  || (hasProcess && globalProcess.env.NODE_ENV === 'production');
export const DEBUG_TS = !isProd && (typeof import.meta !== 'undefined' ? !!import.meta.env?.VITE_TS_DEBUG : true);
