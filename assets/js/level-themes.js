export const LEVEL_THEMES = {
  forest: {
    layers: [
      { src: "assets/images/background/bg_far.webp", factor: 0.15, isOpaque: true },
      { src: "assets/images/background/bg_mid.webp", factor: 0.35 },
      { src: "assets/images/background/bg_near.webp", factor: 0.6 },
    ],
    skyTopColor: "#2a7380",
    skyBottomColor: "#06202a",
    particles: { color: "210, 255, 235", count: 40, riseSpeed: [0.004, 0.014], driftSpeed: 0.012, size: [6, 14], alpha: 0.3 },
    fireflies: { haloColor: "185, 255, 70", coreColor: "245, 255, 200" },
    vignetteColor: "rgba(0, 12, 16, 0.55)",
  },
  ember: {
    layers: [
      { src: "assets/images/background/bg_boss_far.webp", factor: 0.15, isOpaque: true },
      { src: "assets/images/background/bg_boss_mid.webp", factor: 0.35 },
      { src: "assets/images/background/bg_boss_near.webp", factor: 0.6 },
    ],
    skyTopColor: "#843c28",
    skyBottomColor: "#180806",
    particles: { color: "255, 150, 70", count: 46, riseSpeed: [0.018, 0.04], driftSpeed: 0.02, size: [4, 9], alpha: 0.4 },
    fireflies: { haloColor: "255, 135, 35", coreColor: "255, 225, 160" },
    vignetteColor: "rgba(20, 5, 2, 0.6)",
  },
};

export function getLevelTheme(level) {
  return level.getEntities("Boss").length > 0 ? LEVEL_THEMES.ember : LEVEL_THEMES.forest;
}
