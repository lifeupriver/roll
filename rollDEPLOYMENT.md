# Roll — Deployment

> Environment variables, hosting configuration, CI/CD, domain setup, and deployment checklist for the web prototype.

---

## 1. Hosting Architecture

| Service | Purpose | Plan |
|---|---|---|
| **Vercel** | Next.js hosting, SSR, API routes, edge functions | Pro ($20/mo for 300s function timeout) |
| **Supabase** | Auth, PostgreSQL, Realtime, Edge Functions | Free tier (prototype), Pro for launch |
| **Cloudflare R2** | Photo storage | Pay-as-you-go (free tier: 10GB storage, 10M reads/mo) |
| **Resend** | Transactional email | Free tier (100 emails/day) |
| **Cloudflare DNS** | Domain management + CDN for thumbnails | Free |

---

## 2. Environment Variables

### 2.1 Required Variables

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === Cloudflare R2 ===
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=roll-photos-dev
R2_PUBLIC_URL=https://photos.roll.photos

# === eyeQ / Perfectly Clear ===
EYEQ_API_KEY=xxxxx
EYEQ_API_URL=https://api.perfectlyclear.com/v3
EYEQ_PRESET=roll_standard

# === Prodigi (Print Fulfillment) ===
PRODIGI_API_KEY=xxxxx
PRODIGI_API_URL=https://api.sandbox.prodigi.com
PRODIGI_WEBHOOK_SECRET=xxxxx
ENABLE_PRINT_FULFILLMENT=false

# === Resend (Email) ===
RESEND_API_KEY=xxxxx

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Roll
```

### 2.2 Environment-Specific Overrides

| Variable | Development | Staging | Production |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://staging.roll.photos` | `https://roll.photos` |
| `R2_BUCKET_NAME` | `roll-photos-dev` | `roll-photos-staging` | `roll-photos-prod` |
| `PRODIGI_API_URL` | Sandbox | Sandbox | Production |
| `ENABLE_PRINT_FULFILLMENT` | `false` | `false` | `true` |
| `EYEQ_API_URL` | Production (same API) | Production | Production |

### 2.3 Setting Variables in Vercel

```bash
# Using Vercel CLI
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add R2_SECRET_ACCESS_KEY production
# ... etc for each server-only variable

# NEXT_PUBLIC_ variables are safe for all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
```

---

## 3. Vercel Configuration

### 3.1 `vercel.json`

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/process/**/*.ts": {
      "maxDuration": 300
    },
    "src/app/api/eyeq/**/*.ts": {
      "maxDuration": 60
    },
    "src/app/api/upload/**/*.ts": {
      "maxDuration": 30
    },
    "src/app/api/prodigi/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-DNS-Prefetch-Control", "value": "on" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 3.2 `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'photos.roll.photos',  // R2 thumbnail CDN
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',  // R2 signed URLs
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',  // Supabase storage (if used)
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',  // For photo upload handling
    },
  },
};

export default nextConfig;
```

---

## 4. Supabase Setup

### 4.1 Project Configuration

1. Create project in Supabase dashboard (region: us-east-1 to match Vercel)
2. Note the project URL and anon key
3. Copy the service role key (keep secret)
4. Enable email auth in Authentication → Providers
5. Configure magic link settings:
   - Magic link expiry: 3600 seconds (1 hour)
   - Redirect URL: `https://roll.photos/auth/callback` (add all environments)

### 4.2 Database Migrations

Run migrations using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref xxxxx

# Run all migrations
supabase db push

# Or apply individual migration
supabase migration up
```

Migration files live in `supabase/migrations/` (see DATA_MODEL.md for migration order).

### 4.3 Edge Functions Deployment

```bash
# Deploy all edge functions
supabase functions deploy process-roll
supabase functions deploy send-notification
supabase functions deploy prodigi-webhook

# Set secrets for edge functions
supabase secrets set EYEQ_API_KEY=xxxxx
supabase secrets set R2_ACCESS_KEY_ID=xxxxx
supabase secrets set R2_SECRET_ACCESS_KEY=xxxxx
```

### 4.4 Realtime Configuration

Enable Realtime on these tables in Supabase dashboard → Database → Replication:

- `rolls` (for processing status updates)
- `photos` (for filtering status updates)
- `circle_posts` (for live circle feed)

---

## 5. Cloudflare R2 Setup

### 5.1 Bucket Creation

```bash
# Using Cloudflare Wrangler CLI
wrangler r2 bucket create roll-photos-dev
wrangler r2 bucket create roll-photos-prod
```

### 5.2 CORS Policy

Apply via Cloudflare dashboard → R2 → Bucket → Settings → CORS:

```json
[
  {
    "AllowedOrigins": ["https://roll.photos", "https://staging.roll.photos", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-content-sha256"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5.3 Public Access for Thumbnails

Create a Cloudflare Worker to serve thumbnails publicly:

```javascript
// workers/thumbnail-proxy.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading /

    // Only allow thumbnail directory
    if (!key.startsWith('thumbnails/')) {
      return new Response('Not Found', { status: 404 });
    }

    const object = await env.R2_BUCKET.get(key);
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=2592000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
```

Bind to custom domain: `photos.roll.photos`

---

## 6. Domain Configuration

### 6.1 DNS Records

| Record | Type | Name | Value |
|---|---|---|---|
| A | A | roll.photos | Vercel IP (76.76.21.21) |
| CNAME | CNAME | www | cname.vercel-dns.com |
| CNAME | CNAME | photos | Worker route (thumbnail CDN) |

### 6.2 Vercel Domain Setup

```bash
vercel domains add roll.photos
vercel domains add www.roll.photos
```

### 6.3 SSL

- Vercel: automatic Let's Encrypt SSL for roll.photos
- Cloudflare: automatic SSL for photos.roll.photos (thumbnail CDN)
- Supabase: automatic SSL for project URL

---

## 7. Development Workflow

### 7.1 Local Development

```bash
# Clone repo
git clone https://github.com/joshuabrownphotography/roll.git
cd roll

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in actual values

# Start Supabase local (optional, requires Docker)
supabase start

# Start Next.js dev server
npm run dev
# → http://localhost:3000
```

### 7.2 Git Branching

```
main          → Production (auto-deploys to Vercel)
staging       → Staging environment (preview deployment)
feat/*        → Feature branches (preview deployments)
fix/*         → Bug fix branches (preview deployments)
```

### 7.3 Vercel Preview Deployments

Every push to a non-main branch creates a preview deployment at `roll-xxxxx.vercel.app`. Preview deployments use the same Supabase project (dev environment) and R2 dev bucket.

---

## 8. Pre-Launch Checklist

### 8.1 Infrastructure

- [ ] Vercel project created and linked to GitHub repo
- [ ] Supabase project created (us-east-1 region)
- [ ] R2 buckets created (dev + prod)
- [ ] Resend account created, domain verified
- [ ] DNS configured for roll.photos
- [ ] SSL certificates provisioned (automatic)
- [ ] All environment variables set in Vercel

### 8.2 Database

- [ ] All migrations applied successfully
- [ ] RLS policies verified (run test queries as anon/authenticated)
- [ ] Triggers verified (profile creation, roll count, updated_at)
- [ ] Realtime enabled on rolls, photos, circle_posts tables
- [ ] Seed data loaded (development only)

### 8.3 Storage

- [ ] R2 CORS policy applied
- [ ] Thumbnail CDN Worker deployed
- [ ] Presigned URL generation tested
- [ ] Upload → store → retrieve flow verified

### 8.4 External Services

- [ ] eyeQ API key active and tested
- [ ] Prodigi sandbox API key tested (order lifecycle)
- [ ] Prodigi webhook URL registered
- [ ] Resend API key tested (send test email)

### 8.5 Security

- [ ] Security headers verified (run securityheaders.com)
- [ ] No server-only env vars in client bundle (check build output)
- [ ] RLS policies prevent cross-user data access
- [ ] Signed URLs expire correctly
- [ ] Rate limiting active on all API routes

### 8.6 Performance

- [ ] Lighthouse score > 90 on mobile
- [ ] LCP < 2.5s on 4G throttled
- [ ] Photo grid scrolls at 60fps
- [ ] Bundle size < 200KB initial JS
