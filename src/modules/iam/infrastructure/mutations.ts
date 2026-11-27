'use server';

import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';
import type { AppRole } from '../domain/entities';
import type { AssignUserRoleInput, UpdateProfileInput } from '../application/schemas';

export async function updateCurrentUserProfileRecord(input: UpdateProfileInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado.');
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Usuario no autenticado.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      username: input.username,
      document_id: input.documentId,
      bio: input.bio ?? null,
      timezone: input.timezone,
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function switchActiveSessionRole(_role: AppRole): Promise<void> {
  throw new Error(
    'El cambio de rol por cookie de sesión fue eliminado. Los cambios de rol deben realizarse mediante rpc_assign_user_role.'
  );
}

export async function executeAssignUserRoleRpc(input: AssignUserRoleInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado.');
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('rpc_assign_user_role', {
    target_user_id: input.targetUserId,
    new_role: input.newRole,
    reason: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}
