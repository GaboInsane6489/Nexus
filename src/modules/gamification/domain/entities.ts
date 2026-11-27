export interface BadgeEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  iconKey: string;
  xpBonus: number;
  isUnlocked?: boolean;
  awardedAt?: string | null;
}

export interface UserGamificationSummary {
  userId: string;
  totalXp: number;
  currentLevel: number;
  nextLevelRequiredXp: number;
  currentLevelFloorXp: number;
  levelProgressPct: number;
  currentStreakDays: number;
  longestStreakDays: number;
  streakFreezesAvailable: number;
  streakMultiplier: number;
}
