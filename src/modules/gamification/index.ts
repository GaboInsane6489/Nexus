// API Pública del Módulo Gamification (Nivel 4) — Gobernado por nexus-architecture-guard
export type { BadgeEntity, UserGamificationSummary } from './domain/entities';
export {
  calculateRequiredXpForLevel,
  calculateLevelFromTotalXp,
  calculateStreakMultiplier,
  buildGamificationSummary,
} from './domain/rules';
export { listCatalogBadgesWithStatus } from './infrastructure/queries';
