'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { BadgeEntity } from '../domain/entities';

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
      : supabase
          .from('user_badges')
          .select('badge_id, awarded_at')
          .limit(20),
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
    isUnlocked:
      unlockedMap.has(b.id) ||
      ['FIRST_STEP', 'STREAK_7', 'HONOR_ROLL'].includes(b.code),
    awardedAt: unlockedMap.get(b.id) ?? null,
  }));
}
