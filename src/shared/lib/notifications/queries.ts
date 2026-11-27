import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';

export type NotificationCategory = 'academic' | 'launch' | 'system';

export interface NotificationRecord {
  id: string;
  category: NotificationCategory;
  tag: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  category: string;
  tag: string;
  title: string;
  body: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

function normalizeCategory(category: string): NotificationCategory {
  if (category === 'academic' || category === 'launch' || category === 'system') {
    return category;
  }
  return 'system';
}

export async function listUserNotifications(userId: string): Promise<NotificationRecord[]> {
  if (!isSupabaseConfigured() || !userId) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, category, tag, title, body, action_url, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [];
      }
      return [];
    }

    const rows = (data ?? []) as NotificationRow[];
    return rows.map((row) => ({
      id: row.id,
      category: normalizeCategory(row.category),
      tag: row.tag,
      title: row.title,
      body: row.body,
      actionUrl: row.action_url,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
