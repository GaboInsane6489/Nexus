'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { BadgeEntity, UserGamificationSummary } from '../domain/entities';
import { buildGamificationSummary } from '../domain/rules';

export async function listCatalogBadgesWithStatus(
  userId?: string
): Promise<BadgeEntity[]> {
  const supabase = await createSupabaseServerClient();

  const [badgesRes, userBadgesRes] = await Promise.all([
    supabase
      .from('badges')
      .select('id, code, name, description, icon_key, xp_bonus')
      .order('xp_bonus', { ascending: true })
      .limit(20),
    userId
      ? supabase
          .from('user_badges')
          .select('badge_id, awarded_at')
          .eq('user_id', userId)
          .limit(50)
      : Promise.resolve({ data: [] as Array<{ badge_id: string; awarded_at: string }> }),
  ]);

  const unlockedMap = new Map<string, string>();
  for (const ub of userBadgesRes.data ?? []) {
    unlockedMap.set(ub.badge_id, ub.awarded_at);
  }

  return (badgesRes.data ?? []).map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    description: b.description,
    iconKey: b.icon_key,
    xpBonus: b.xp_bonus,
    isUnlocked: Boolean(userId && unlockedMap.has(b.id)),
    awardedAt: userId ? (unlockedMap.get(b.id) ?? null) : null,
  }));
}

export async function getUserGamificationSummary(
  userId: string
): Promise<UserGamificationSummary> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('user_gamification')
    .select(
      'total_xp, current_streak_days, longest_streak_days, streak_freezes_available'
    )
    .eq('user_id', userId)
    .maybeSingle();

  return buildGamificationSummary(
    userId,
    data?.total_xp ?? 0,
    data?.current_streak_days ?? 0,
    data?.longest_streak_days ?? 0,
    data?.streak_freezes_available ?? 0
  );
}
