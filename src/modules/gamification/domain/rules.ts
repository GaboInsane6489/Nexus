import type { UserGamificationSummary } from './entities';

/**
 * Curva progresiva de niveles de Nexus:
 * XP_requerido(L) = FLOOR(100 * (L - 1)^1.5)
 */
export function calculateRequiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function calculateLevelFromTotalXp(totalXp: number): number {
  if (totalXp < 100) return 1;
  let level = 1;
  while (calculateRequiredXpForLevel(level + 1) <= totalXp && level < 100) {
    level++;
  }
  return level;
}

export function calculateStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 7) return 1.2;
  return 1.0;
}

export function buildGamificationSummary(
  userId: string,
  totalXp: number,
  currentStreakDays: number,
  longestStreakDays: number,
  streakFreezesAvailable: number
): UserGamificationSummary {
  const currentLevel = calculateLevelFromTotalXp(totalXp);
  const currentLevelFloorXp = calculateRequiredXpForLevel(currentLevel);
  const nextLevelRequiredXp = calculateRequiredXpForLevel(currentLevel + 1);
  const span = Math.max(1, nextLevelRequiredXp - currentLevelFloorXp);
  const progressInLevel = Math.max(0, totalXp - currentLevelFloorXp);
  const levelProgressPct = Math.min(
    100,
    Math.round((progressInLevel / span) * 100)
  );

  return {
    userId,
    totalXp,
    currentLevel,
    nextLevelRequiredXp,
    currentLevelFloorXp,
    levelProgressPct,
    currentStreakDays,
    longestStreakDays: Math.max(longestStreakDays, currentStreakDays),
    streakFreezesAvailable,
    streakMultiplier: calculateStreakMultiplier(currentStreakDays),
  };
}
