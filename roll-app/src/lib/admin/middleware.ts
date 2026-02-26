import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceClient } from './service';
import { isAdminPreviewMode } from './mock-data';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Checks that the current session belongs to an admin user.
 * Returns the admin user if authorized, null otherwise.
 *
 * In preview mode, returns a mock admin user so the dashboard
 * is accessible without a real database.
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  // Preview mode: return mock admin
  if (isAdminPreviewMode()) {
    return { id: 'preview-admin-id', email: 'admin@roll.photos', role: 'admin' };
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component context — handled by middleware
            }
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Check admin role via service client (bypasses RLS)
    const service = getServiceClient();
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return null;
    }

    return {
      id: user.id,
      email: profile.email,
      role: profile.role,
    };
  } catch {
    return null;
  }
}
