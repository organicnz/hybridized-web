# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**Hybridized** - Music/audio streaming web application built with Next.js 16, deployed on Vercel.

## Tech Stack

- **Runtime & Package Manager:** Bun 1.4 **canary** — package manager, test
  runner, linter, formatter and JavaScript runtime. **Node.js is not used**;
  the lockfile is `bun.lock`, the test runner is `bun test`, and Next.js runs
  on the Bun runtime.
- **Framework:** Next.js 16.5 canary with App Router, Cache Components
- **Language:** TypeScript 7.1, type-checked with `tsrs` (Rust port)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS 4 (CSS-first `@theme`)
- **Components:** shadcn/ui
- **Linting & Formatting:** Bun's built-ins — `bun lint` (oxlint engine) and
  `bun fmt`
- **Deployment:** Vercel (Bun runtime via `bunVersion` in `vercel.json`)
- **Domain:** hybridized.online (via Cloudflare DNS)

## Key Directories

```
app/          → Next.js App Router pages
components/   → Reusable UI components
lib/          → Utilities, Supabase client, types
public/       → Static assets (favicon, images)
scripts/      → Bun automation (TypeScript, executed with `bun`)
tests/        → `bun test` suites
types/        → Ambient type declarations (e.g. `bun:fs` / `bun:path`)
supabase/     → Supabase migrations, edge functions and config
```

## Environment Variables

See `.env.example` for the full list. Minimum required in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional:

- `SUPABASE_SECRET_KEY` - service-role key. Required by the mutating sync
  endpoints (`/api/v1/sync-*`, `/api/v1/match-*`) so their writes bypass RLS.
  Without it those routes fall back to a cookie session and are denied by RLS
  unless called by an authenticated admin.
- `SYNC_SECRET` - shared bearer secret for those endpoints, as an alternative to
  an admin profile (`Authorization: Bearer <SYNC_SECRET>`).
- `NEXT_PUBLIC_SENTRY_DSN` - enables Sentry; leave blank to disable.

## Commands

```bash
bun install        # Install dependencies (bun.lock)
bun run dev        # Start dev server (Next.js on the Bun runtime)
bun run build      # Production build
bun run start      # Serve the production build
bun run lint       # bun lint (Bun's built-in oxlint engine)
bun run format     # bun fmt (Bun's built-in formatter)
bun run fix        # lint --fix + format
bun run typecheck  # tsrs --noEmit (Rust port of the TypeScript compiler)
bun run typecheck:fast # bun check (Bun's own multi-core checker)
bun test           # unit tests
bun run verify     # lint + both type checkers + test
bun run doctor     # assert the Bun environment invariants
bun run setup:bun  # install the exact Bun build pinned by .bun-version
bun run setup:tsdk # wire tsrs up as the editor's language server
bun x <pkg>        # one-off package execution (replaces npx)
```

Bun-native extras:

```bash
bun check              # Bun's own multi-core type checker (whole project)
bun run typecheck:fast # alias for `bun check`
bun lint               # built-in linter (oxlint engine, no extra binary)
bun fmt                # built-in formatter
bun audit              # vulnerability scan
bun outdated           # outdated dependencies
bun pm why <pkg>       # dependency explanation
bun pm trust --all     # (re)allow install scripts for packages that need them
```

Node.js, npm and npx are not part of this project. Use `bun`, `bun run` and
`bun x` instead.

## Bun-First Rules

This project has **no Node.js at any layer** — not the toolchain, not the
scripts, not the runtime, not production.

- The Bun build is pinned **once**, in `.bun-version`, as the npm publish
  version (`1.4.3-canary.20261019.1`). Three things must agree with it:
  `package.json`'s `packageManager`, the generated `.bun-lock.json`, and the
  build that is actually running.
  - **`packageManager` does not pin the runtime.** Bun 1.4 never re-execs the
    named build — not on `bun install`, not on any subcommand. The pin is
    enforced by `scripts/install-bun.ts`, which resolves the immutable npm
    artifact `@oven/bun-<platform>@<version>`, verifies its sha512 against
    `.bun-lock.json`, and installs it to `.bun/bin/bun`.
  - **Canaries are not GitHub releases.** Bun's `canary` tag serves unversioned
    assets that are replaced every day, and canaries have no git tags, so
    `oven-sh/setup-bun` cannot resolve a pinned canary at all. The npm
    publish version is the only immutable handle — npm forbids republishing a
    version. CI therefore bootstraps with `bun-version: canary` and then
    replaces it with the pinned build.
  - `.mise.toml` prepends `./.bun/bin` to `PATH`, so the pinned build wins
    locally. It deliberately does **not** pin bun in `[tools]`: mise's `bun`
    backend resolves canary strings against the moving channel, and a `path:`
    pin hard-fails on a fresh clone before `bun run setup:bun` can run.
  - `vercel.json` can only name a release line, so it stays `1.4.x` (the Rust
    rewrite) and must never be left outside the 1.4 line.
  - To bump: edit `.bun-version`, run `bun run setup:bun --pin-all`, and
    commit `.bun-lock.json`. `bun run doctor` warns when a newer canary has
    been published.
- `bunfig.toml` sets `[run] bun = true`, so every `package.json` script runs on
  the Bun runtime, and `[run] shell = "bun"`, so `&&`/`||` chains run in Bun's
  own shell instead of bash/zsh.
- **Never set an install-cache `dir` in `bunfig.toml`.** Bun does not expand
  `~` in that path — it creates a literal `~` directory inside the project
  root and fills it with the whole cache. The default is already
  `~/.bun/install/cache`; `bun pm cache` reports the effective path.
- Automation lives in `scripts/**/*.ts` and is executed with `bun`. Use Bun
  Shell (`import { $ } from "bun"`) instead of shelling out to `sh -c`.
- Use `bun:fs`, `bun:fs/promises`, `bun:path`, `Bun.file()`, `Bun.Glob`,
  `Bun.XML` and `Bun.sleep` rather than their `node:` equivalents or a
  third-party library. `types/bun-modules.d.ts` supplies the ambient types
  `bun-types` does not ship; it is the **only** file allowed to name a `node:`
  module, and only in type position. `bun run doctor` fails otherwise.
  - `bun:fs` re-exports the _callback_ API; use `bun:fs/promises` for
    promises.
- Prefer a Bun built-in over a dependency. `lib/api/rss.ts` uses `Bun.XML`
  instead of `xml2js`; do not reintroduce an XML/feed library.
- Use `Bun.env` in `scripts/**`.
- **Keep `process.env` in Next.js app code.** `NEXT_PUBLIC_*` values are
  inlined into the client bundle at build time, and route handlers / `proxy.ts`
  can run on the Edge runtime where `Bun` is undefined. `Bun.env` is only safe
  in standalone Bun scripts.
- Run tools through `bun x --bun <tool>` so they never pick up a Node
  installation if one is present on the machine. `tsrs` ships a
  `#!/usr/bin/env node` launcher, so `--bun` is what keeps it on Bun.
- **Two type checkers run in `verify` and must agree:** `tsrs` (the Rust
  port — the primary gate) and `bun check` (multi-core, ~150 ms). Run
  `bun run verify`, not just one of them.
  - The `typescript` npm package is **not** installed. TypeScript 7 ships no
    JavaScript compiler API, so it cannot serve as a gate here, and its
    `#!/usr/bin/env node` launcher would be the last Node-flavoured entry in
    the dependency tree. Next.js is told about this with
    `experimental.useTypeScriptCli: false` plus
    `@typescript/native-preview`; without the native preview, Next would try
    to install `typescript@^6` on every build.
  - `noUncheckedSideEffectImports: true` is on, so an unresolvable
    side-effect import is an error in both.
  - `types/css.d.ts` declares `*.css`; `types/bun-modules.d.ts` declares
    `bun:fs` / `bun:path`.
  - Do **not** augment the global `Navigator` (or other DOM interfaces) for
    APIs that a newer toolchain already declares. `lib/webgpu.ts` reads
    `navigator.gpu` through a local type for exactly this reason — Bun's
    checker ships `NavigatorGPU`, and a global augmentation collides with it.
- **Linting and formatting are Bun built-ins.** `bun lint` runs the same
  oxlint engine as the standalone binary, and `bun fmt` replaces Biome.
  - `oxlint.json` stays the rule config: `bun lint -c oxlint.json` is the
    supported invocation. The `jsx-a11y` plugin is enabled explicitly, and
    `typescript/no-explicit-any`, `eqeqeq` and `typescript/ban-ts-comment`
    are listed by hand because they were Biome rules with no default-on
    oxlint equivalent.
  - The `lint` script name shadows the built-in, so every invocation passes
    `--no-script` to avoid recursing into the script. The same applies to
    `check` and `fmt` — **do not add a `check` script** to `package.json`.
  - `jsx-a11y/media-has-caption` is off on purpose: music has no spoken
    dialogue, so the players' `<audio>` elements have no caption track.
- `trustedDependencies` must list every package whose install script is
  needed (`sharp`, `webgpu`, `@vgpu/adapter-node`, `lefthook`). Bun blocks the
  rest, and their scripts would never run. Re-check with `bun pm trust --all`
  after adding a dependency.
- **React Compiler rule triage.** `oxlint.json` enables the React Compiler
  rules (`react/set-state-in-effect`, `react/refs`, `react/purity`,
  `react/immutability`) as `warn`, not `error`: making the codebase
  React-Compiler-shaped is a deliberate refactor of its own. The findings are
  real and are listed in `oxlint.json`:
  - `set-state-in-effect` — the mount effects read localStorage, the session
    and the loaded profile; they are the SSR-safe way to do it.
  - `refs` — lazy `useRef` initialisation and passing a ref's current value
    to a child are used in the audio engine.
  - `purity` — `Date.now()` cache-busting and `new Date()` in the footer.
  - `immutability` — the Web Audio filter nodes live in `useState`.
- **Do not "fix" `react/purity` in a client component by hoisting `new Date()`
  to module scope.** Next 16.5's Instant Navigation validation fails the
  prerender with `CLIENT_HOOK_DYNAMIC` when a client module reads the clock
  at import time — the build then reports the _first_ URL-data reader it
  finds (`SpeedInsights`), which points at the wrong file. Keep
  `new Date()` in the render and leave the rule as a warning.
- `bun dedupe` is **not** safe here: it downgrades `magic-string` 1.4.3 →
  0.30.21 for `@sentry/bundler-plugins`, a major-version downgrade.
  `bun audit fix` _is_ safe — it only upgrades within existing ranges.

## Next.js 16.5 Notes

`next.config.ts` enables both Cache Components and Partial Prefetching.
Next 16.3+ treats them as a pair and warns when `cacheComponents` is on
without `partialPrefetching`; both become the default in the next major.

Next 16.3+ also validates **Instant Navigations** during prerendering. A
Client Component that reads URL data (`useParams`, `usePathname`,
`useSearchParams`, `useSelectedLayoutSegment(s)`) outside a `<Suspense>`
boundary fails the build with `CLIENT_HOOK_DYNAMIC`. The root layout's
`<SpeedInsights />` reads the route params, so it sits behind its own
`<Suspense fallback={null}>` — without that, every dynamic route's static
shell becomes URL-specific and `/home/[artist]` can no longer be prerendered.

When a new client component reads URL data, put it behind a `<Suspense>`
boundary rather than reaching for `export const instant = false`. Use
`bun run build` (add `--debug-prerender` for a full user-frame stack) to
catch these — the error names the exact component.

`next build` no longer type-checks — `next.config.ts` sets
`typescript.ignoreBuildErrors` because `tsrs` already covers it and is far
faster. **That makes `bun run verify` the only type gate**, so it must pass
before a build is trusted.

`next.config.ts` also sets `typedRoutes: true` (a typo in a `next/link` href
is a type error) and `experimental.typedEnv: true` (typed
`process.env.NEXT_PUBLIC_*`). A route prop must be typed `Route`, not
`string`; `lib/utils/route.ts` holds `withQuery` / `withHash` for the one
case the type system cannot express — a route plus a search string or
fragment.

- Run `bun run doctor` after any toolchain or dependency change. It is the
  executable form of the rules above — version pin, pinned build running, no
  Node.js on `PATH`, lockfile in sync, install scripts trusted, `bunfig.toml`
  intact, no install cache inside the project, no `node:` imports, `tsrs` as
  the type gate, no `setup-node` in CI. It must pass before committing.
- `Bun.Glob` does **not** support brace expansion (`{a,b}` matches nothing).
  Use one pattern per shape, e.g. `node_modules/*/package.json` and
  `node_modules/@*/*/package.json`.

## Tailwind CSS 4 Rules

The theme is CSS-first: `tailwind.config.ts` is gone and `app/globals.css`
carries an `@theme` block. `postcss.config.mjs` uses `@tailwindcss/postcss`
(no `autoprefixer` — v4 prefixes on its own).

- **Theme colours must be complete values.** `:root` holds `hsl(0 0% 100%)`,
  and `@theme` maps `--color-background: var(--background)`. Tailwind 4
  resolves colour utilities by parsing the theme value, so `hsl(var(--x))`
  emits a literal `<alpha-value>` or gets mangled. Opacity modifiers
  (`bg-card/70`) still work because v4 implements them with `color-mix()`.
- **Custom utilities use `@utility`, not plain CSS.** A class in
  `@layer utilities` is not a utility: it cannot be `@apply`-ed, and its
  responsive variants (`md:text-fluid-3xl`) lose to the base class. The
  `.text-fluid-*` family is `@utility` for that reason.
- **A family shares one base rule.** Tailwind 4 cannot `@apply` a class from
  `@layer components`, so `.btn` is declared once for the whole family rather
  than inlined into every variant; the variants follow it in the same layer so
  a size still wins. The same applies to `.card`.
- **Do not define the same class twice.** A name that is both an `@utility`
  and a plain class rule breaks the build with a Turbopack loader error.

## Infrastructure

### Hosting

- **Vercel** - Web application hosting (serverless)
- **Supabase** - Database & Auth (remote/hosted, not self-managed)
- **Cloudflare** - DNS management
- No self-hosted servers (no EC2, VPS, etc.)

### DNS (Cloudflare)

- Domain: `hybridized.online`
- A Record: Points to Vercel IP `76.76.21.21`
- CNAME `www`: Points to `vercel-dns.com`
- Proxy status: **DNS only (grey cloud)** - Vercel requires this, do NOT proxy

### Security Configurations

- `app/robots.ts` blocks AI crawlers (GPTBot, ClaudeBot, CCBot, etc.) and allows legitimate search engines (Googlebot, Bingbot, DuckDuckBot)
- Security headers set in `next.config.ts` (X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy, COOP, CSP report-only)
- Vercel Security Checkpoint enabled

### Cloudflare Security

- Bot Fight Mode: Enable in Security → Bots
- AI Labyrinth: Enable to trap AI crawlers
- WAF rules can block AI user-agents

## Database Schema

- **episodes** - podcast episode content (public read, authenticated write)
- **bands** - artists/bands (public read, authenticated write)
- **profiles** - user profiles linked to Supabase Auth (owner-only access)

## Design / Beautification

Premium dark glassmorphic. Deep blacks (`--background: 240 10% 3%`), refined purple/pink/blue gradient meshes, glass cards, fluid typography, refined shadows/brightness. Always merge to `main`; deliver to prod accordingly.

## Deployment

Always merge to `main`. Deliver into prod accordingly.

Push to `main` branch → Auto-deploys to Vercel (production)
