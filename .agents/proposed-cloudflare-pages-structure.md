# PROPOSED CHANGES - Cloudflare Pages Multi-Project Structure
**Date**: 2026-06-24
**Task**: Create folder structure and config for laslogTMX Cloudflare Pages multi-project deployment
**Backup branch**: backup-before-cloudflare-pages-structure (created, main preserved)
**SAFETY CHECK PASSED**: Followed skills/safetySKILL.md strictly (re-read full, no secrets, limited scope, backup created, summaries before edits, <=3 files/batch, .env.example only).
**Scope**: ONLY folder creation, build configs, documentation. NO moving existing app code, no new features, no secrets.

## Summary of All Changes
- **Total files affected**: 13
  - 8 created (structure + skeleton + checkpoint)
  - 5 updated (configs + docs)
- Changes applied in batches of at most 3 files at a time.
- All new marketing code is minimal skeleton only (landing page) to allow build/deploy.
- Marketing uses static export (suitable for marketing site). Web app remains full-featured.
- Production branch = `main` for both.
- Root dir: `apps/marketing` and `apps/web`
- Staging docs reference `develop` branch per requirements.

## Exact File List

### CREATED (8)
1. apps/marketing/package.json
2. apps/marketing/next.config.js
3. apps/marketing/wrangler.toml
4. apps/marketing/tsconfig.json
5. apps/marketing/app/layout.tsx
6. apps/marketing/app/page.tsx
7. apps/marketing/app/globals.css
8. .agents/checkpoints/cloudflare-pages-structure.json

### UPDATED (5)
9. package.json (root)
10. turbo.json
11. .env.example
12. README.md
13. skills/webbuildSKILL.md

(Also this proposal doc will be removed or kept in commit? Kept for record.)

## Proposed File Contents (exact to be written)

### 1. apps/marketing/package.json
```json
{
  "name": "marketing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.5.0"
  }
}
```

### 2. apps/marketing/next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // trailingSlash: true, // optional for static hosts
};

module.exports = nextConfig;
```

### 3. apps/marketing/wrangler.toml
```
name = "laslogtmx-marketing"
compatibility_date = "2026-06-21"
pages_build_output_dir = "out"

[env.production]
name = "laslogtmx-marketing"
routes = [
  { pattern = "laslogtmx.com", custom_domain = true },
]

[env.staging]
name = "laslogtmx-marketing-staging"
routes = [
  { pattern = "dev.laslogtmx.com", custom_domain = true },
]
```

### 4. apps/marketing/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### 5. apps/marketing/app/layout.tsx
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'laslogTMX | Transport Management Xperience',
  description: 'Modern mobile-first TMS for carriers, brokers & 3PLs. Military time, real-time chat, compliance tools.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

### 6. apps/marketing/app/page.tsx
```tsx
import React from 'react';

export default function MarketingHome() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Tailwind CDN for demo styling on static export - replace with proper build in future */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script dangerouslySetInnerHTML={{ __html: `
        tailwind.config = { theme: { extend: { colors: { 'tmx-blue': '#00bfff' } } } };
      `}} />
      
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div style={{width: '36px', height: '36px', background: '#0F172A', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>TMX</div>
          <span className="text-2xl font-semibold text-[#0F172A]">laslogTMX</span>
        </div>
        <nav className="flex gap-6 text-sm">
          <a href="#features" className="text-[#64748B] hover:text-[#00bfff]">Features</a>
          <a href="https://app.laslogtmx.com/pricing" className="text-[#64748B] hover:text-[#00bfff]">Pricing</a>
          <a href="https://app.laslogtmx.com/auth/login" className="text-[#64748B] hover:text-[#00bfff]">Log in</a>
          <a href="https://app.laslogtmx.com/auth/signup" className="px-4 py-2 bg-[#00bfff] text-white rounded-xl text-sm font-medium hover:bg-[#0099cc]">Get Started</a>
        </nav>
      </header>

      <main>
        <section className="text-center py-16">
          <div className="inline px-4 py-1 rounded-full bg-sky-100 text-[#00bfff] text-xs tracking-widest mb-4">TRANSPORT MANAGEMENT XPERIENCE</div>
          <h1 className="text-6xl font-bold text-[#0F172A] leading-tight mt-3">The modern TMS<br />for carriers &amp; brokers.</h1>
          <p className="mt-4 text-xl text-[#64748B] max-w-md mx-auto">Military time. Real-time team chat. Receipt OCR. FMCSA compliance. Built for the road.</p>
          <div className="mt-8 flex gap-4 justify-center">
            <a href="https://app.laslogtmx.com/auth/signup" className="inline-block px-8 py-3 bg-[#00bfff] text-white rounded-2xl font-semibold hover:bg-[#0099cc]">Start free trial</a>
            <a href="https://app.laslogtmx.com/auth/login" className="inline-block px-8 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50">Log in to app</a>
          </div>
          <p className="mt-3 text-xs text-[#94A3B8]">No credit card required • Works great on mobile</p>
        </section>

        <section id="features" className="grid md:grid-cols-3 gap-6 py-12">
          {[
            { icon: '⏰', title: 'Military Time', desc: 'Default everywhere. No AM/PM confusion on the road or in logs.' },
            { icon: '💬', title: 'Team + Load Chat', desc: 'Realtime company chat and per-load threads. Attachments supported.' },
            { icon: '🧾', title: 'Receipt OCR', desc: 'Snap photos, auto-extract, mandatory correction step before submit.' },
            { icon: '🛡️', title: 'MOTUS + Compliance', desc: 'FMCSA status, DOT claims, troubleshooting library for drivers.' },
            { icon: '🚛', title: 'Internal Load Board', desc: 'Post, bid, negotiate loads inside your company. Full audit trail.' },
            { icon: '📱', title: 'Mobile First', desc: 'Expo-powered native app. Same data, offline capable features.' },
          ].map((f, i) => (
            <div key={i} className="border border-[#E2E8F0] rounded-3xl p-6 hover:border-[#00bfff] transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="font-semibold text-lg text-[#0F172A]">{f.title}</div>
              <div className="text-[#64748B] mt-2 text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </section>

        <section className="bg-[#0F172A] text-white rounded-3xl p-10 text-center my-12">
          <h2 className="text-3xl font-bold">Ready to modernize your ops?</h2>
          <p className="text-[#94A3B8] mt-2">Join carriers running on laslogTMX.</p>
          <a href="https://app.laslogtmx.com/auth/signup" className="mt-6 inline-block bg-white text-[#0F172A] px-6 py-3 rounded-2xl font-semibold">Create account →</a>
        </section>
      </main>

      <footer className="text-center text-xs text-[#94A3B8] pt-8 border-t mt-12">
        © {new Date().getFullYear()} laslogTMX — <a href="https://app.laslogtmx.com" className="underline">app.laslogtmx.com</a> • <a href="https://github.com" className="underline">Source</a>
      </footer>
    </div>
  );
}
```

(Note: Uses Tailwind Play CDN script + inline styles for zero-config static build. Future iteration can add proper tailwind + shared components.)

### 7. apps/marketing/app/globals.css
```css
/* Minimal marketing styles - extend or replace with Tailwind build later */
:root {
  --tmx-blue: #00bfff;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #0F172A;
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}
```

### 8. .agents/checkpoints/cloudflare-pages-structure.json
```json
{
  "checkpoint": "cloudflare-pages-multi-project",
  "version": "2026-06-24",
  "status": "complete",
  "backup_branch": "backup-before-cloudflare-pages-structure",
  "structure": {
    "marketing": {
      "path": "apps/marketing",
      "purpose": "laslogtmx.com - marketing / landing site",
      "framework": "Next.js (static export for CF Pages)",
      "production_branch": "main",
      "cf_pages_project": "laslogtmx-marketing",
      "root_directory_in_cf": "apps/marketing",
      "build_output": "out"
    },
    "web": {
      "path": "apps/web",
      "purpose": "app.laslogtmx.com - full TMS web app",
      "framework": "Next.js (full, with API/middleware)",
      "production_branch": "main",
      "cf_pages_project": "laslogtmx-web",
      "root_directory_in_cf": "apps/web",
      "build_output": ".vercel/output/static"
    }
  },
  "domains": {
    "marketing": "laslogtmx.com",
    "app": "app.laslogtmx.com",
    "staging": "dev.laslogtmx.com",
    "staging_branch": "develop"
  },
  "deployment": {
    "production": {
      "branch": "main",
      "marketing_project_root": "apps/marketing",
      "web_project_root": "apps/web"
    },
    "staging": {
      "branch": "develop",
      "note": "Configure preview or separate staging project, set NEXT_PUBLIC_*_URL overrides on the branch"
    }
  },
  "files": {
    "marketing_configs": ["package.json", "next.config.js", "wrangler.toml", "tsconfig.json"],
    "docs_updated": ["README.md", "skills/webbuildSKILL.md", ".env.example", "turbo.json", "package.json"]
  },
  "next_steps": "Create two CF Pages projects via dashboard (see README for exact steps). Point custom domains. Add env vars via dashboard per project/branch."
}
```

## Root Updates

### 9. package.json (root) - delta
Add to scripts:
```json
"dev:marketing": "turbo run dev --filter=marketing",
"build:marketing": "turbo run build --filter=marketing",
```
(Also update name/desc if needed; workspaces already cover apps/* )

Full scripts after:
```json
"scripts": {
  "dev:web": "turbo run dev --filter=web",
  "dev:mobile": "turbo run start --filter=mobile",
  "dev:marketing": "turbo run dev --filter=marketing",
  "build:web": "turbo run build --filter=web",
  "build:mobile": "turbo run build --filter=mobile",
  "build:marketing": "turbo run build --filter=marketing",
  "lint": "turbo run lint",
  "clean": "turbo run clean && rm -rf node_modules"
},
```

### 10. turbo.json - delta
Ensure outputs cover marketing:
In "build" outputs already has ".next/**", "dist/**" — add "out/**" for marketing static.
```json
"outputs": [
  ".next/**",
  "out/**",
  "dist/**"
]
```

### 11. .env.example - additions (at top after existing domains)
```
# ── Marketing site (laslogtmx.com) - separate CF Pages project (apps/marketing)
# NEXT_PUBLIC_MARKETING_URL=https://laslogtmx.com
# Used for canonical links / redirects in marketing app. Set per-project in CF if needed.
```

### 12. README.md - Cloudflare section overhaul (summary)
Replace / extend the "Cloudflare Deployment" section with detailed multi-project info + exact dashboard steps + instructions for:
- laslogtmx.com (marketing, root=apps/marketing)
- app.laslogtmx.com (web, root=apps/web)
- dev.laslogtmx.com (staging on develop branch)

Include production branch = main note.

### 13. skills/webbuildSKILL.md - update domains + deployment notes + quick build commands.

## Post-Change Actions (executed after edits)
- git add (specific limited files)
- git commit -m "feat: add Cloudflare Pages multi-project structure (apps/marketing + configs)"
- git push origin main
- git push origin backup-before-cloudflare-pages-structure
- Provide EXACT dashboard steps in final report
- Update checkpoint .agents/checkpoints/cloudflare-pages-structure.json
- Delete or keep proposal doc? (kept)
- Final status report

**This proposal document serves as the "show summary of changes first" artifact required by safetySKILL.md.**

If proceeding, the exact strings used for search_replace will match the current file contents precisely.
