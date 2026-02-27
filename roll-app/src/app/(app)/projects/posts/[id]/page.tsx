'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  Eye,
  Edit3,
  Save,
  Globe,
  Wand2,
  Trash2,
  Settings,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { PostBlockEditor } from '@/components/blog/PostBlockEditor';
import { BlogPhotoLayout } from '@/components/blog/BlogPhotoLayout';
import { EssayFontSelector } from '@/components/blog/EssayFontSelector';
import { useToast } from '@/stores/toastStore';
import { smartDesignBlogWithTemplate } from '@/lib/design/design-engine';
import type { BlogBlock } from '@/lib/design/design-engine';
import type { BlogPost, EssayTemplate, EssayFont } from '@/types/blog';

type EditorMode = 'preview' | 'edit' | 'settings';

interface RollPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption: string | null;
  aesthetic_score: number | null;
  face_count: number | null;
  scene_classification: string[];
}

interface RollReel {
  id: string;
  thumbnail_url: string;
  video_url: string;
  width: number;
  height: number;
  caption: string | null;
  duration_ms: number | null;
}

export default function EssayEditorPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { toast } = useToast();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mode, setMode] = useState<EditorMode>('preview');

  // Editable fields
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [font, setFont] = useState<EssayFont>('default');
  const [blocks, setBlocks] = useState<BlogBlock[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Media maps
  const [rollPhotos, setRollPhotos] = useState<RollPhoto[]>([]);
  const [rollReels, setRollReels] = useState<RollReel[]>([]);

  // Fetch post data
  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog/posts/${postId}`);
        if (!res.ok) {
          toast('Post not found', 'error');
          router.push('/designs');
          return;
        }
        const { data } = await res.json();
        const blogPost = data as BlogPost;
        setPost(blogPost);
        setTitle(blogPost.title || '');
        setStory(blogPost.story || '');
        setExcerpt(blogPost.excerpt || '');
        setFont((blogPost.essay_font as EssayFont) || 'default');
        setTags(blogPost.tags || []);

        // Parse essay blocks
        if (blogPost.essay_blocks) {
          try {
            setBlocks(JSON.parse(blogPost.essay_blocks));
          } catch {
            setBlocks([]);
          }
        }

        // Fetch photos from the post's roll(s)
        const rollIds = [blogPost.roll_id, ...(blogPost.roll_ids || [])].filter(Boolean);
        await fetchRollMedia(rollIds);
      } catch {
        toast('Failed to load post', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchRollMedia = async (rollIds: string[]) => {
    try {
      const photoPromises = rollIds.map(async (rollId) => {
        const res = await fetch(`/api/rolls/${rollId}/photos`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? []).map((rp: Record<string, unknown>) => ({
          id: rp.photo_id || rp.id,
          thumbnail_url: (rp.photos as Record<string, unknown>)?.thumbnail_url || rp.thumbnail_url || '',
          developed_url: (rp.photos as Record<string, unknown>)?.developed_url || rp.developed_url || '',
          width: (rp.photos as Record<string, unknown>)?.width || rp.width || 1200,
          height: (rp.photos as Record<string, unknown>)?.height || rp.height || 800,
          caption: (rp.photos as Record<string, unknown>)?.caption || rp.caption || null,
          aesthetic_score: (rp.photos as Record<string, unknown>)?.aesthetic_score || rp.aesthetic_score || null,
          face_count: (rp.photos as Record<string, unknown>)?.face_count || rp.face_count || null,
          scene_classification: ((rp.photos as Record<string, unknown>)?.scene_classification || rp.scene_classification || []) as string[],
        }));
      });
      const allPhotos = (await Promise.all(photoPromises)).flat();
      setRollPhotos(allPhotos);
    } catch {
      // Silently handle
    }
  };

  const photoMap = useMemo(() => {
    const map = new Map<string, RollPhoto>();
    for (const p of rollPhotos) map.set(p.id, p);
    return map;
  }, [rollPhotos]);

  const videoMap = useMemo(() => {
    const map = new Map<string, RollReel>();
    for (const v of rollReels) map.set(v.id, v);
    return map;
  }, [rollReels]);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!post) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          story: story || null,
          excerpt: excerpt || null,
          essay_font: font,
          essay_blocks: JSON.stringify(blocks),
          tags,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setPost(data as BlogPost);
        toast('Saved', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Failed to save', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }, [post, title, story, excerpt, font, blocks, tags, toast]);

  // Publish
  const handlePublish = useCallback(async () => {
    if (!post) return;
    setPublishing(true);
    try {
      // Save first
      await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          story: story || null,
          excerpt: excerpt || null,
          essay_font: font,
          essay_blocks: JSON.stringify(blocks),
          tags,
        }),
      });

      // Then publish
      const res = await fetch(`/api/blog/posts/${post.id}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        toast('Published! Your essay is now public.', 'success');
        setPost((prev) => prev ? { ...prev, status: 'published' } : prev);
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Failed to publish', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setPublishing(false);
    }
  }, [post, title, story, excerpt, font, blocks, tags, toast]);

  // Re-design
  const handleRedesign = useCallback(() => {
    if (!post) return;
    const template = (post.essay_template || 'documentary') as EssayTemplate;

    const mediaItems = [
      ...rollPhotos.map(p => ({
        id: p.id,
        type: 'photo' as const,
        width: p.width,
        height: p.height,
        caption: p.caption,
        aesthetic_score: p.aesthetic_score,
        face_count: p.face_count,
        scene_classification: p.scene_classification,
        duration_ms: null,
      })),
      ...rollReels.map(v => ({
        id: v.id,
        type: 'video' as const,
        width: v.width,
        height: v.height,
        caption: v.caption,
        aesthetic_score: null,
        face_count: null,
        scene_classification: [] as string[],
        duration_ms: v.duration_ms,
      })),
    ];

    const designed = smartDesignBlogWithTemplate(mediaItems, template, story || undefined);
    setBlocks(designed);
    toast('Re-designed!', 'success');
  }, [post, rollPhotos, rollReels, story, toast]);

  // Delete post
  const handleDelete = useCallback(async () => {
    if (!post || !confirm('Are you sure you want to delete this essay?')) return;
    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Essay deleted', 'success');
        router.push('/designs');
      } else {
        toast('Failed to delete', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    }
  }, [post, router, toast]);

  // Tag management
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="md" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-element)]">
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">Post not found</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/designs')}>
          Back to Designs
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-[var(--space-hero)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-element)]">
          <BackButton href="/designs" />
          <div className="min-w-0">
            <div className="flex items-center gap-[var(--space-tight)]">
              <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] truncate">
                {title || 'Untitled Essay'}
              </h1>
              <Badge variant={post.status === 'published' ? 'developed' : 'info'}>
                {post.status}
              </Badge>
            </div>
            {post.essay_template && (
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] capitalize">
                {post.essay_template} style · {blocks.length} blocks
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-[var(--space-tight)]">
          {/* Mode toggles */}
          <div className="flex items-center bg-[var(--color-surface-sunken)] rounded-[var(--radius-pill)] p-0.5">
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                mode === 'preview'
                  ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Eye size={14} /> Preview
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                mode === 'edit'
                  ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('settings')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                mode === 'settings'
                  ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Settings size={14} />
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSave} isLoading={saving}>
            <Save size={14} className="mr-1" /> Save
          </Button>

          {post.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublish}
              isLoading={publishing}
              disabled={!title.trim() || blocks.length === 0}
            >
              <Globe size={14} className="mr-1" /> Publish
            </Button>
          )}

          {post.status === 'published' && post.slug && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
            >
              View Public
            </Button>
          )}
        </div>
      </div>

      {/* ─── Preview Mode ─── */}
      {mode === 'preview' && (
        <div className="max-w-3xl mx-auto w-full">
          {/* Title */}
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] leading-tight mb-[var(--space-element)]">
            {title || 'Untitled Essay'}
          </h2>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] leading-relaxed mb-[var(--space-section)] font-[family-name:var(--font-display)] italic">
              {excerpt}
            </p>
          )}

          {/* Content blocks */}
          {blocks.length > 0 ? (
            <BlogPhotoLayout
              blocks={blocks}
              photoMap={photoMap as unknown as Map<string, { id: string; thumbnail_url: string; developed_url: string; width: number; height: number; caption: string | null }>}
              videoMap={videoMap as unknown as Map<string, { id: string; thumbnail_url: string; video_url: string; width: number; height: number; caption: string | null; duration_ms: number | null }>}
            />
          ) : (
            <div className="text-center py-[var(--space-hero)]">
              <Wand2 size={32} className="mx-auto mb-[var(--space-element)] text-[var(--color-ink-tertiary)]" />
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] mb-[var(--space-element)]">
                No content blocks yet.
              </p>
              <Button variant="primary" size="sm" onClick={handleRedesign}>
                <Wand2 size={14} className="mr-1" /> Auto-Design
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Edit Mode ─── */}
      {mode === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-section)]">
          {/* Left: Block editor */}
          <div>
            <PostBlockEditor
              blocks={blocks}
              photoMap={photoMap as unknown as Map<string, { thumbnail_url: string; caption: string | null }>}
              videoMap={videoMap as unknown as Map<string, { thumbnail_url: string; caption: string | null }>}
              onBlocksChange={setBlocks}
            />

            <div className="mt-[var(--space-component)] flex items-center gap-[var(--space-element)]">
              <Button variant="ghost" size="sm" onClick={() => { handleRedesign(); }}>
                <Wand2 size={14} className="mr-1" /> Re-design
              </Button>
            </div>
          </div>

          {/* Right: Live preview */}
          <div>
            <div className="sticky top-20">
              <div className="flex items-center gap-[var(--space-tight)] mb-[var(--space-element)]">
                <Eye size={14} className="text-[var(--color-ink-tertiary)]" />
                <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em]">
                  Preview
                </span>
              </div>
              <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] p-[var(--space-component)] bg-[var(--color-surface)] max-h-[70vh] overflow-y-auto">
                <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] leading-tight mb-[var(--space-component)]">
                  {title || 'Untitled Essay'}
                </h2>

                <BlogPhotoLayout
                  blocks={blocks}
                  photoMap={photoMap as unknown as Map<string, { id: string; thumbnail_url: string; developed_url: string; width: number; height: number; caption: string | null }>}
                  videoMap={videoMap as unknown as Map<string, { id: string; thumbnail_url: string; video_url: string; width: number; height: number; caption: string | null; duration_ms: number | null }>}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Mode ─── */}
      {mode === 'settings' && (
        <div className="max-w-xl flex flex-col gap-[var(--space-component)]">
          {/* Title */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your photo essay a title..."
              className="w-full h-12 px-[var(--space-element)] text-[length:var(--text-lead)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] font-[family-name:var(--font-display)] focus:outline-none focus:border-[var(--color-border-focus)]"
              maxLength={200}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary for previews and SEO..."
              className="w-full h-20 px-[var(--space-element)] py-[var(--space-element)] text-[length:var(--text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] resize-none"
              maxLength={500}
            />
          </div>

          {/* Story */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
              Story
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Write the narrative behind these photos..."
              className="w-full h-40 px-[var(--space-element)] py-[var(--space-element)] text-[length:var(--text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] resize-none leading-relaxed"
              maxLength={10000}
            />
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-tight)]">
              {story.length}/10000
            </p>
          </div>

          {/* Font */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)] block">
              Typography
            </label>
            <EssayFontSelector selected={font} onSelect={setFont} />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
              Tags
            </label>
            <div className="flex flex-wrap gap-[var(--space-tight)] mb-[var(--space-tight)]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] text-[length:var(--text-caption)] px-[var(--space-tight)] py-0.5 rounded-[var(--radius-pill)]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-[var(--space-tight)]">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-caption)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                maxLength={50}
              />
              <Button variant="secondary" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="mt-[var(--space-section)] pt-[var(--space-component)] border-t border-[var(--color-border)]">
            <h3 className="text-[length:var(--text-caption)] font-medium text-[var(--color-error)] uppercase tracking-[0.04em] mb-[var(--space-element)]">
              Danger Zone
            </h3>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1 text-[var(--color-error)]" />
              <span className="text-[var(--color-error)]">Delete Essay</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
