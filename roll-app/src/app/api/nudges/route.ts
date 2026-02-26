import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

interface Nudge {
  id: string;
  type: string;
  title: string;
  description: string;
  action: string;
  actionUrl: string;
  dismissKey: string;
}

// GET /api/nudges — get active nudges for the current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nudges: Nudge[] = [];

    // 1. Check for unassigned favorites (36+ = roll waiting)
    const { count: unassignedCount } = await supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('roll_id', null);

    if ((unassignedCount || 0) >= 36) {
      nudges.push({
        id: 'unassigned-favorites',
        type: 'roll',
        title: 'You have a roll waiting!',
        description: `${unassignedCount} favorites are ready to be turned into a roll.`,
        action: 'Create Roll',
        actionUrl: '/library',
        dismissKey: 'nudge-unassigned-fav',
      });
    }

    // 2. Check for developed rolls with no blog post (share prompt)
    const { data: recentRolls } = await supabase
      .from('rolls')
      .select('id, title, theme_name')
      .eq('user_id', user.id)
      .eq('status', 'developed')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (recentRolls && recentRolls.length > 0) {
      const latestRoll = recentRolls[0];
      const { count: postCount } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('roll_id', latestRoll.id)
        .eq('user_id', user.id);

      if ((postCount || 0) === 0) {
        nudges.push({
          id: 'share-roll',
          type: 'share',
          title: 'Share your latest roll',
          description: `"${latestRoll.theme_name || latestRoll.title || 'Your roll'}" is ready to share with friends or publish to your blog.`,
          action: 'Share',
          actionUrl: `/roll/${latestRoll.id}`,
          dismissKey: `nudge-share-${latestRoll.id}`,
        });
      }
    }

    // 3. Check for 3+ developed rolls with 0 magazines
    const { count: developedRollCount } = await supabase
      .from('rolls')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'developed');

    const { count: magazineCount } = await supabase
      .from('magazines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((developedRollCount || 0) >= 3 && (magazineCount || 0) === 0) {
      nudges.push({
        id: 'create-magazine',
        type: 'magazine',
        title: 'Turn your rolls into a magazine',
        description: 'Your stories and photos, designed into a beautiful printed magazine.',
        action: 'Create Magazine',
        actionUrl: '/projects/magazines/create',
        dismissKey: 'nudge-create-magazine',
      });
    }

    // 4. Check for 2+ magazines with 0 books
    const { count: bookCount } = await supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((magazineCount || 0) >= 2 && (bookCount || 0) === 0) {
      nudges.push({
        id: 'create-book',
        type: 'book',
        title: 'Compile a book from your magazines',
        description: 'Combine your magazines into a beautiful hardcover book.',
        action: 'Create Book',
        actionUrl: '/projects/books/create',
        dismissKey: 'nudge-create-book',
      });
    }

    // 5. Check if first blog post published but no blog profile
    const { count: publishedPostCount } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'published');

    if ((publishedPostCount || 0) > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('blog_slug, blog_enabled')
        .eq('id', user.id)
        .single();

      if (!profile?.blog_slug || !profile?.blog_enabled) {
        nudges.push({
          id: 'setup-blog',
          type: 'blog',
          title: 'Set up your blog profile',
          description: 'Choose a URL and name for your public blog.',
          action: 'Set Up Blog',
          actionUrl: '/settings/blog',
          dismissKey: 'nudge-setup-blog',
        });
      }
    }

    return NextResponse.json({ data: nudges });
  } catch (err) {
    captureError(err, { context: 'nudges' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
