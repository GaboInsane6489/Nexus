'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';
import type { ActionResult } from '@/shared/types/action-result';

const notificationIdSchema = z.string().uuid();

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = notificationIdSchema.safeParse(notificationId);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Identificador de notificación inválido.',
      },
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Supabase no está configurado en este entorno.',
      },
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para actualizar tus notificaciones.',
        },
      };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', parsed.data)
      .eq('user_id', user.id);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code ?? 'NOTIFICATION_UPDATE_FAILED',
          message: error.message,
        },
      };
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: { id: parsed.data },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'NOTIFICATION_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'Error al marcar la notificación como leída.',
      },
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<{ count: number }>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Supabase no está configurado en este entorno.',
      },
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para actualizar tus notificaciones.',
        },
      };
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select('id');

    if (error) {
      return {
        success: false,
        error: {
          code: error.code ?? 'NOTIFICATION_UPDATE_FAILED',
          message: error.message,
        },
      };
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: { count: data?.length ?? 0 },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'NOTIFICATION_UPDATE_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Error al marcar todas las notificaciones como leídas.',
      },
    };
  }
}
