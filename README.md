# Nahid Estes

A full-stack editorial portfolio, photography archive, travel journal and content studio built with Next.js 16, TypeScript, Tailwind CSS, MongoDB and Auth.js.

## What is included

- Responsive editorial homepage matching the supplied warm ivory, deep olive and muted-gold art direction
- Dynamic work, photography, journal and places-and-culture archives with category filters, pagination links and search
- Dynamic detail pages with related stories, social sharing, canonical metadata and JSON-LD
- Credentials-protected admin studio with content lists, create/edit/delete workflows, draft/published/scheduled states and TipTap editing
- Validated newsletter and contact forms with rate limiting and MongoDB persistence
- Mongoose models and indexes for users, posts, projects, galleries, place stories, categories, subscribers, messages and site settings
- Sitemap, robots rules, RSS, Open Graph image, custom icon, loading/error/404 states and seed content

The public site falls back to realistic sample content when MongoDB is not configured, so the interface can be previewed before connecting services. Writes require MongoDB.

## Local development

Requirements: Node.js 20.9 or newer and either a local MongoDB instance (including MongoDB Compass) or MongoDB Atlas.

1. Copy `.env.example` to `.env.local`.
2. Add your MongoDB and Auth.js credentials.
3. Install dependencies with `npm install`.
4. Seed the public content with `npm run seed`.
5. Create the initial admin with `npm run seed:admin`. The command reads `ADMIN_EMAIL` and `ADMIN_PASSWORD`, stores only a bcrypt hash, and makes no changes when that email already exists.
6. Start development with `npm run dev` and open `http://localhost:3000`.
7. Sign in at `/admin/login` using the admin credentials from your local environment.

For the local MongoDB setup used by this project, set `MONGODB_URI=mongodb://127.0.0.1:27017/nahidestes`. Compass is the database viewer; the local MongoDB server service must also be running.

Generate a strong auth secret with `openssl rand -base64 32` or another cryptographically secure generator. Use the same value for `AUTH_SECRET` and `NEXTAUTH_SECRET`.

## MongoDB Atlas

1. Create an Atlas project and a production cluster.
2. Create a database user with access only to the application database.
3. Add your local IP while developing. For Vercel, configure Atlas network access according to your organization’s security policy; avoid a broad allowlist where a private networking option is available.
4. Copy the driver connection string into `MONGODB_URI`, including the database name, such as `nahidestes`.
5. Run `npm run seed` for content and `npm run seed:admin` for the initial administrator. The schemas create unique indexes for emails and slugs plus content/search indexes.

## Images

Cloudinary uploads are temporarily disabled. The admin studio currently accepts existing HTTPS image URLs and previews them directly in the browser; it never proxies arbitrary hosts through the Next.js image optimizer. Public content continues to use `next/image`, so every remote hostname must be added explicitly to the exact `images.remotePatterns` allowlist in `next.config.ts` before publishing. Do not add a wildcard hostname. Existing Unsplash and legacy Cloudinary URLs remain allowlisted, and a storage provider can be added later without changing the content models.

## Vercel deployment

1. Push the repository to your Git provider and import it into Vercel as a Next.js project.
2. Add every variable from `.env.example` in Vercel Project Settings. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://nahidestes.com`.
3. Add `nahidestes.com` under Domains and configure the DNS records Vercel provides.
4. Deploy. The standard build command is `npm run build`; no custom output directory is required.
5. After the first deployment, verify `/api/auth/signin`, one content detail page, `/sitemap.xml`, `/robots.txt` and `/feed.xml`.
6. Seed production from a trusted local machine using the production `MONGODB_URI`. Do not run the seed command automatically on every deploy.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Content model notes

Published records are shown publicly; drafts and scheduled records remain in the studio. For scheduled publishing, run a Vercel Cron endpoint or Atlas Trigger that changes due records from `scheduled` to `published`. The schema and editor already capture `scheduledAt`/publication dates; the scheduling worker is intentionally deployment-specific.

Remote sample imagery uses Unsplash URLs. Replace these with image URLs you are licensed to use before launch, including descriptive alt text and appropriate image rights/credits.
