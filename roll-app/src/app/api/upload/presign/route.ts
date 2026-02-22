import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPresignedUploadUrl } from '@/lib/storage/r2';
import { MAX_FILES_PER_UPLOAD, MAX_FILE_SIZE_BYTES, ALLOWED_CONTENT_TYPES } from '@/lib/utils/constants';
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

    const body = await request.json();
    const { files } = body as {
      files: Array<{ filename: string; contentType: string; sizeBytes: number }>;
    };

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Invalid request: files array required' }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES_PER_UPLOAD} files per upload` }, { status: 400 });
    }

    const uploads = [];
    for (const file of files) {
      if (file.sizeBytes > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: `File ${file.filename} exceeds 50MB limit` }, { status: 400 });
      }

      const allowedTypes = ALLOWED_CONTENT_TYPES as readonly string[];
      if (!allowedTypes.includes(file.contentType)) {
        return NextResponse.json({ error: `Unsupported file type: ${file.contentType}` }, { status: 400 });
      }

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
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
