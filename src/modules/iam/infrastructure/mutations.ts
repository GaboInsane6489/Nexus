'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/shared/lib/supabase/server';
import type { AppRole } from '../domain/entities';
import type { AssignUserRoleInput, UpdateProfileInput } from '../application/schemas';

export async function updateCurrentUserProfileRecord(input: UpdateProfileInput): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('nexus_profile_name', input.fullName, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  cookieStore.set('nexus_profile_username', input.username, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  cookieStore.set('nexus_profile_doc', input.documentId, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  if (input.bio !== undefined) {
    cookieStore.set('nexus_profile_bio', input.bio, { path: '/', maxAge: 60 * 60 * 24 * 30 });
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .update({
          full_name: input.fullName,
          username: input.username,
          document_id: input.documentId,
          bio: input.bio ?? null,
          timezone: input.timezone,
        })
        .eq('id', user.id);
    }
  }
}

export async function switchActiveSessionRole(role: AppRole): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('nexus_active_role', role, { path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export async function executeAssignUserRoleRpc(input: AssignUserRoleInput): Promise<void> {
  if (isSupabaseConfigured()) {
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
}
