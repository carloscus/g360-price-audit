export const COLOR_SCHEME = {
  'Mi Marca': '#f97316',
  'vinifan2': '#e11d48',
  'artesco': '#b45309',
  'layconsa': '#7c3aed',
  'vikingo': '#2563eb',
  'Competidor 5': '#059669',
  'Competidor 6': '#0891b2',
  'Competidor 7': '#ea580c',
  'Competidor 8': '#9333ea',
  'Competidor 9': '#0d9488',
  'default': '#6b7280'
} as const;

export type BrandName = keyof typeof COLOR_SCHEME;

const BRAND_COLORS = [
  '#00a86b',
  '#2563eb',
  '#e11d48',
  '#b45309',
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#ea580c',
  '#9333ea',
  '#0d9488',
  '#ca8a04',
  '#4f46e5',
  '#db2777',
  '#2563eb'
];

export const getBrandColor = (brandName: string): string => {
  const normalizedBrandName = brandName.toLowerCase().trim();
  const schemeKey = Object.keys(COLOR_SCHEME).find(
    key => key.toLowerCase() === normalizedBrandName
  );
  if (schemeKey) {
    const fixedColor = COLOR_SCHEME[schemeKey as BrandName];
    if (fixedColor && fixedColor !== COLOR_SCHEME.default) {
      return fixedColor;
    }
  }
  const hash = brandName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & 0xFFFF;
  }, 0);
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length];
};

export const shadeColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1).toUpperCase();
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const POSITION_COLOR_PALETTE = [
  '#F97316',
  '#E11D48',
  '#059669',
  '#0D9488',
  '#7C3AED',
];

const BRAND_CSS_VAR_TEXT = [
  '--color-brand-0-text',
  '--color-brand-1-text',
  '--color-brand-2-text',
  '--color-brand-3-text',
  '--color-brand-4-text',
];

const BRAND_CSS_VAR_HEADER = [
  '--color-brand-0-header',
  '--color-brand-1-header',
  '--color-brand-2-header',
  '--color-brand-3-header',
  '--color-brand-4-header',
];

const BRAND_FALLBACK_TEXT = ['#F97316', '#E11D48', '#059669', '#0D9488', '#7C3AED'];
const BRAND_FALLBACK_HEADER = ['#EA580C', '#DC2626', '#059669', '#0F766E', '#7C3AED'];

function resolveCSSVar(varName: string, fallback: string): string {
  if (typeof document !== 'undefined') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (value) return value;
  }
  return fallback;
}

export const getBrandColorByPosition = (brandName: string, competidores: string[]): string => {
  const index = competidores.findIndex(c => c.toLowerCase() === brandName.toLowerCase());
  if (index !== -1) {
    const i = index % BRAND_CSS_VAR_TEXT.length;
    return resolveCSSVar(BRAND_CSS_VAR_TEXT[i], BRAND_FALLBACK_TEXT[i]);
  }
  return resolveCSSVar('--color-brand-default-text', '#6B7280');
};

export const getBrandHeaderStylesByPosition = (brandName: string, competidores: string[]) => {
  const index = competidores.findIndex(c => c.toLowerCase() === brandName.toLowerCase());
  let headerColor: string;
  if (index !== -1) {
    const i = index % BRAND_CSS_VAR_HEADER.length;
    headerColor = resolveCSSVar(BRAND_CSS_VAR_HEADER[i], BRAND_FALLBACK_HEADER[i]);
  } else {
    headerColor = resolveCSSVar('--color-brand-default-header', '#6B7280');
  }
  const darkerColor = shadeColor(headerColor, 20);
  const shadowColor = hexToRgba(headerColor, 0.3);
  return {
    background: `linear-gradient(135deg, ${headerColor}, ${darkerColor})`,
    color: 'var(--color-text-inverse, #ffffff)',
    boxShadow: `0 2px 8px ${shadowColor}`,
    border: 'none',
    fontWeight: '700',
  };
};