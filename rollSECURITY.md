# Roll — Security

> Authentication model, data protection, encryption, privacy requirements, and threat model for the web prototype.

---

## 1. Security Principles

1. **Privacy is the product.** No ads. No tracking. No data sales. No public profiles. This is a core brand promise, not a compliance checkbox.
2. **Least privilege everywhere.** RLS on every table. Signed URLs with short expiry. Service role key server-side only.
3. **Defense in depth.** Auth + RLS + storage isolation + signed URLs + input validation. No single layer is trusted alone.
4. **Fail closed.** If auth fails, deny access. If RLS can't be verified, deny access. Never default to open.

---

## 2. Authentication

### 2.1 Auth Model

Supabase Auth with two methods:

| Method | Flow | Use Case |
|---|---|---|
| Magic Link | Enter email → receive link → click → session created | Primary (simulates Sign in with Apple simplicity) |
| Email + Password | Enter email + password → session created | Fallback for users who prefer passwords |

**No social auth in prototype.** No Google, Apple, or Facebook sign-in. These add complexity and privacy concerns for the prototype phase. Post-prototype: Sign in with Apple for iOS.

### 2.2 Session Management

- **Session token:** JWT stored in httpOnly, Secure, SameSite=Lax cookie via `@supabase/ssr`
- **Token lifetime:** 1 hour access token, 7-day refresh token
- **Token refresh:** automatic via Supabase client (refreshes before expiry)
- **Session validation:** middleware on every `(app)` route request
- **Sign out:** clears cookies, revokes refresh token server-side

### 2.3 Magic Link Security

- Link expires after 1 hour
- One-time use (consumed on first click)
- Sent via Supabase's built-in email service (or Resend custom SMTP)
- Redirect URL whitelisted: only `{APP_URL}/auth/callback`
- PKCE flow used by default in Supabase for magic links

### 2.4 Password Requirements (if user chooses password auth)

- Minimum 8 characters
- No maximum limit
- No composition rules (research shows these don't improve security)
- Passwords hashed with bcrypt (Supabase default)
- Rate limited: 5 failed attempts → 15-minute lockout

---

## 3. Authorization

### 3.1 Row Level Security (RLS)

Every table has RLS enabled. See DATA_MODEL.md for full policy definitions.

**Core access patterns:**

| Data | Who Can Read | Who Can Write |
|---|---|---|
| Profile | Own user only | Own user only |
| Photos | Own user only | Own user only (insert + update, no delete) |
| Rolls | Own user only | Own user only |
| Roll photos | Roll owner only | Roll owner only |
| Favorites | Own user only | Own user only |
| Circles | Circle members only | Creator only (for settings) |
| Circle posts | Circle members only | Circle members only |
| Circle reactions | Circle members only | Own user only |
| Print orders | Own user only | Own user only |

### 3.2 Service Role Usage

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is used **only** for:

1. Processing pipeline (updating photo filter results in bulk)
2. Webhook handlers (Prodigi, which has no user session)
3. Background cron jobs (cleanup, retry)
4. Creating profile on user signup (trigger function with `SECURITY DEFINER`)

**Never** pass the service role key to the client. **Never** use it in Server Components that render user-facing data.

### 3.3 Tier-Based Feature Gates

| Feature | Check Location | Implementation |
|---|---|---|
| Film profiles (Golden, Vivid, etc.) | Frontend + Backend | Frontend hides; backend rejects if profile ≠ 'warmth' and tier ≠ 'plus' |
| Circle creation | Frontend + Backend | Frontend hides CTA; backend checks tier before insert |
| Album printing | Frontend + Backend | Frontend shows upgrade prompt; backend rejects order |
| 5×7 prints | Frontend + Backend | Frontend shows lock icon; backend rejects |
| Cloud backup > 100 | Backend only | Backend checks photo_count against tier limit |

**Important:** Frontend gates are for UX only. Backend must always re-validate tier access. Never trust the client.

---

## 4. Data Protection

### 4.1 Data Classification

| Classification | Examples | Storage | Access |
|---|---|---|---|
| **Sensitive** | Email addresses, shipping addresses, passwords | Supabase (encrypted at rest) | Own user only, service role |
| **Private** | Photos (original + processed), EXIF GPS data | Cloudflare R2 (encrypted at rest) | Signed URLs, own user only |
| **Internal** | Processing job data, analytics, filter results | Supabase | Own user + service role |
| **Shared** | Circle posts, shared photos | R2 (circle namespace) | Circle members only |

### 4.2 Encryption

| Layer | Method | Notes |
|---|---|---|
| In transit | TLS 1.3 everywhere | Enforced by Vercel, Supabase, R2, all APIs |
| At rest (Supabase) | AES-256 | Supabase managed |
| At rest (R2) | AES-256 | Cloudflare managed |
| Passwords | bcrypt (cost factor 10) | Supabase Auth managed |
| Session tokens | JWT (HS256) | Supabase Auth managed |

### 4.3 Photo Privacy

- **Original photos are never publicly accessible.** Always behind signed URLs.
- **Thumbnails** are served from a public R2 bucket for CDN performance. Thumbnails are 400px wide — low enough resolution to be useless for printing but sufficient for grid display.
- **EXIF GPS data** is stored in the database but **never exposed to other users.** Not included in Circle shared photos.
- **When sharing to a Circle,** photos are copied to an isolated namespace. The sharer's user_id is not embedded in the file path.
- **Processed photos** include the film profile in the filename but no user-identifying information.

### 4.4 Signed URL Policy

| Resource | Expiry | Purpose |
|---|---|---|
| Upload presigned URL | 1 hour | Client → R2 upload |
| Display signed URL (originals) | 1 hour | Lightbox full-resolution view |
| Display signed URL (processed) | 1 hour | Developed roll viewing |
| Prodigi signed URL | 24 hours | Print fulfillment (Prodigi needs time to download) |
| Circle photo signed URL | 1 hour | Circle member viewing |

---

## 5. Input Validation

### 5.1 All API Routes

Every API route validates:
1. **Authentication:** valid Supabase session exists
2. **Content-Type:** `application/json` for POST requests
3. **Request body:** validated against TypeScript interface using zod or similar
4. **User ownership:** requested resources belong to the authenticated user

### 5.2 File Upload Validation

| Check | Threshold | Action |
|---|---|---|
| File type | JPEG, HEIC, PNG, WebP only | Reject with 400 |
| File size | Max 50MB | Reject with 413 |
| Batch size | Max 500 files | Reject with 400 |
| Content hash | Check for existing hash | Skip duplicate |
| Image dimensions | Min 100×100, max 20000×20000 | Reject with 400 |

### 5.3 Text Input Sanitization

- Circle names: max 100 characters, strip HTML
- Roll names: max 100 characters, strip HTML
- Captions: max 500 characters, strip HTML
- Shipping address fields: max 200 characters each, strip HTML
- Email: RFC 5322 validation

---

## 6. Threat Model (Prototype Scope)

### 6.1 Threats and Mitigations

| Threat | Severity | Mitigation |
|---|---|---|
| Unauthorized photo access | High | RLS policies, signed URLs with expiry, user_id validation |
| Session hijacking | High | httpOnly cookies, SameSite=Lax, TLS only, short access token lifetime |
| CSRF | Medium | SameSite cookies, origin header validation on mutations |
| XSS | Medium | React's built-in escaping, no `dangerouslySetInnerHTML`, CSP headers |
| EXIF data leak | Medium | Strip EXIF from thumbnails, never expose GPS to other users |
| R2 bucket enumeration | Medium | Signed URLs only (except thumbnails), unpredictable key structure |
| eyeQ API key exposure | High | Server-side only, never in client bundle, env variable |
| Prodigi webhook spoofing | Medium | Signature verification on all webhook requests |
| Upload abuse (storage) | Medium | File size limits, batch limits, per-user storage quota |
| Processing abuse (cost) | Medium | Rate limiting on develop endpoint, per-user daily limits |

### 6.2 Not Addressed in Prototype

These are real risks but acceptable for the validation phase:
- DDoS protection (rely on Vercel/Cloudflare defaults)
- Advanced bot detection
- IP-based rate limiting (use simple per-user limits)
- WAF rules
- Penetration testing
- SOC 2 compliance

---

## 7. HTTP Security Headers

Configure in `next.config.ts`:

```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs these
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://*.r2.cloudflarestorage.com https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];
```

---

## 8. Environment Variable Security

| Variable | Exposure | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Safe to expose (public API endpoint) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Safe to expose (restricted by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **NEVER expose to client. Bypasses RLS.** |
| `R2_ACCESS_KEY_ID` | Server only | R2 admin access |
| `R2_SECRET_ACCESS_KEY` | Server only | R2 admin access |
| `EYEQ_API_KEY` | Server only | Paid API access |
| `PRODIGI_API_KEY` | Server only | Print fulfillment |
| `RESEND_API_KEY` | Server only | Email sending |

**Verification:** Run `npx next build` and check the client bundle for any server-only environment variables. They should never appear.

---

## 9. Data Retention

| Data | Retention | Deletion Trigger |
|---|---|---|
| User profile | Until account deletion | User deletes account |
| Photos (originals) | Until account deletion | User deletes account → R2 objects deleted |
| Photos (processed) | Until account deletion | User deletes account → R2 objects deleted |
| Thumbnails | Until account deletion | User deletes account → R2 objects deleted |
| Circle posts | Until circle deletion or account deletion | Creator leaves or deletes circle |
| Print orders | 3 years (legal requirement for commerce) | Automatic cleanup after 3 years |
| Processing jobs | 30 days | Automatic cleanup cron |
| Circle invites | 7 days (expired) or until consumed | Automatic cleanup cron |
| Auth sessions | 7 days (refresh token expiry) | Supabase managed |

### Account Deletion Flow

When a user requests account deletion:
1. Delete all R2 objects (originals, processed, thumbnails) — background job
2. Remove from all circles (or transfer circle ownership)
3. Delete all database records (CASCADE handles most via foreign keys)
4. Delete Supabase auth user
5. Send confirmation email
6. Complete within 30 days (GDPR requirement)
