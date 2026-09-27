export const SKINS = {
  default: { name: 'PHOSPHOR', price: 0, className: '', desc: 'classic green' },
  amber: {
    name: 'AMBER_PHOSPHOR',
    price: 300,
    className: 'skin-amber',
    desc: 'warm burn-in amber',
  },
  cyan: { name: 'CYAN_DREAM', price: 250, className: 'skin-cyan', desc: 'deep water terminal' },
  violet: { name: 'VIOLET_WAVE', price: 400, className: 'skin-violet', desc: 'late night divide' },
  matrix: { name: 'MATRIX_GREEN', price: 350, className: 'skin-matrix', desc: 'the original digital rain' },
  cyberpunk: { name: 'CYBERPUNK_NEON', price: 450, className: 'skin-cyberpunk', desc: 'high tech, low life' },
  monochrome: { name: 'MONOCHROME_WHITE', price: 200, className: 'skin-monochrome', desc: 'pure signal, no noise' },
};

export const SKIN_LIST = Object.entries(SKINS).map(([id, def]) => ({ id, ...def }));

export const resolveSkin = (id) => {
  const skin = SKINS[id] || SKINS.default;
  return { id: SKINS[id] ? id : 'default', ...skin };
};

export const themeToItemName = (skinId) => `theme_${skinId}`;
export const resolveThemePurchase = (itemName) => {
  const skinId = itemName.replace(/^theme_/, '');
  return SKINS[skinId] ? { skinId, skin: SKINS[skinId] } : null;
};
