export const createStorm = () => ({
  active: true,
  startedAt: Date.now(),
  survivalBits: 0,
  glitchCount: 0,
});

export const tickStorm = (storm, now, glitchChance) => {
  if (!storm.active) return storm;
  const shouldGlitch = Math.random() < glitchChance;
  return {
    ...storm,
    glitchCount: storm.glitchCount + (shouldGlitch ? 1 : 0),
  };
};

export const endStorm = (storm, now) => ({
  ...storm,
  active: false,
  endedAt: now,
});

export const stormSurvived = (storm, now) => {
  if (!storm.startedAt) return false;
  return now - storm.startedAt >= 45_000;
};

export const stormSummary = (storm) => {
  if (!storm.startedAt) return null;
  const elapsed = Math.round((Date.now() - storm.startedAt) / 1000);
  return {
    elapsed,
    glitchCount: storm.glitchCount,
    survived: elapsed >= 45,
  };
};
