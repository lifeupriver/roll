export default function EmbedPage() {
  // This route is handled by the API route at /api/gallery/[slug]/embed
  // which returns raw HTML. This page exists as a fallback.
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <p className="text-[#666]">Loading gallery...</p>
    </div>
  );
}
