import { stringToColor, darkenColor } from '@shared/components/Avatar/utils/color.js';

const DEFAULT_AVATAR_COLOR = '#1976d2';

const CANDIDATE_FIELDS = [
  'seed',
  'fullName',
  'displayName',
  'name',
  'label',
  'username',
  'email',
  'employeeId',
  'matricola',
  'id',
  'fallback',
];

const NAME_PAIR_FIELDS = [
  ['name', 'surname'],
  ['firstName', 'lastName'],
  ['nome', 'cognome'],
];

function normalizeValue(value) {
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

function pickFromObject(input) {
  if (!input || typeof input !== 'object') return '';

  for (const field of CANDIDATE_FIELDS) {
    if (field in input && input[field] != null) {
      const normalized = normalizeValue(input[field]);
      if (normalized) return normalized;
    }
  }

  for (const [firstKey, secondKey] of NAME_PAIR_FIELDS) {
    const first = normalizeValue(input[firstKey]);
    const second = normalizeValue(input[secondKey]);
    const combined = `${first} ${second}`.trim();
    if (combined) return combined;
  }

  if ('name' in input && input.name) {
    const normalized = normalizeValue(input.name);
    if (normalized) return normalized;
  }

  return '';
}

export function getAvatarSeed(value) {
  if (value == null) return '';

  if (Array.isArray(value)) {
    for (const item of value) {
      const seed = getAvatarSeed(item);
      if (seed) return seed;
    }
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return normalizeValue(value);
  }

  const fromObject = pickFromObject(value);
  if (fromObject) return fromObject;

  return '';
}

export function getAvatarColor(value) {
  const seed = getAvatarSeed(value);
  if (!seed) return DEFAULT_AVATAR_COLOR;
  return stringToColor(seed.toLowerCase());
}

export function getAvatarPalette(value, options = {}) {
  const { borderDarken = 0.28 } = options;
  const seed = getAvatarSeed(value);
  const background = getAvatarColor(seed || value);
  const border = darkenColor(background, borderDarken) || background;

  return {
    seed,
    background,
    border,
  };
}

export { DEFAULT_AVATAR_COLOR };
