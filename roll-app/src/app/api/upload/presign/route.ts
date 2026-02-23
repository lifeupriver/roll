import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPresignedUploadUrl } from '@/lib/storage/r2';
import { parseBody, presignUploadSchema } from '@/lib/validation';
import { uploadLimiter } from '@/lib/rate-limit';
import { captureError } from '@/lib/sentry';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch { /* Server Component */ }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = uploadLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    const parsed = await parseBody(request, presignUploadSchema);
    if (parsed.error) return parsed.error;
    const { files } = parsed.data;

    const uploads = [];
    for (const file of files) {
      const ext = file.filename.split('.').pop()?.toLowerCase() || 'jpg';
      const uuid = randomUUID();
      const storageKey = `originals/${user.id}/${uuid}.${ext}`;

      const { url } = await getPresignedUploadUrl(storageKey, file.contentType);

      uploads.push({
        filename: file.filename,
        uploadUrl: url,
        storageKey,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    }

    return NextResponse.json({ uploads });
  } catch (err) {
    captureError(err, { context: 'upload-presign' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
