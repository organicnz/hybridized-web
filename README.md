# Hybridized - Next.js 16

Modern web application built with Next.js 16, Supabase, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Runtime & Package Manager:** Bun 1.4 canary (no Node.js required)
- **Framework:** Next.js 16.5 canary with App Router, Cache Components
- **Language:** TypeScript 7.1 beta, type-checked with `tsrs` (Rust port)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS 4 (CSS-first `@theme`)
- **Components:** shadcn/ui
- **Animations:** Framer Motion
- **i18n:** next-intl
- **Deployment:** Vercel (Bun runtime)

## Requirements

- [Bun](https://bun.sh) 1.4 **canary** — provides the package manager, test
  runner, bundler and JavaScript runtime. **Node.js is not required and is not
  installed.**

### Toolchain

| Tool                  | Version                        | Channel                    |
| --------------------- | ------------------------------ | -------------------------- |
| Bun                   | `1.4.4-canary.1`               | canary                     |
| Next.js               | `16.5.0-canary.19`             | canary                     |
| `tsrs` (Rust TS port) | `0.18.0`                       | latest (no canary channel) |
| `bun-types`           | `1.4.4-canary.20261019T141446` | canary                     |
| `tailwindcss`         | `4.3.3`                        | latest                     |

Bun also provides the linter (`bun lint`) and the formatter (`bun fmt`), so
there is no separate linting or formatting dependency.

The Bun build is pinned once, in `.bun-version`, as the npm publish version:

| Source           | Value                         | Read by                                  |
| ---------------- | ----------------------------- | ---------------------------------------- |
| `.bun-version`   | `1.4.3-canary.20261019.1`     | `scripts/install-bun.ts`                 |
| `package.json`   | `bun@1.4.3-canary.20261019.1` | The lockfile layer, CI                   |
| `.bun-lock.json` | `1.4.3-canary.20261019.1`     | Generated lock — sha512 + build revision |
| `vercel.json`    | `1.4.x`                       | Vercel (manages patch versions)          |

`packageManager` is **not** what pins the runtime: Bun 1.4 never re-execs the
build it names. `scripts/install-bun.ts` is. It resolves the immutable npm
artifact `@oven/bun-<platform>@<version>`, verifies its sha512 against
`.bun-lock.json`, and installs the binary to `.bun/bin/bun` — which
`.mise.toml` puts first on `PATH`. CI bootstraps with `bun-version: canary`
and then replaces it with the same pinned build, so local and CI run the
identical binary.

Canaries are not GitHub releases: Bun's `canary` tag serves unversioned
assets that are replaced daily, and canaries have no git tags, so
`oven-sh/setup-bun` cannot resolve one. The npm publish version is the only
immutable handle, because npm forbids republishing a version.

`1.4.x` in `vercel.json` must stay inside the 1.4 line — it is the Rust
rewrite of Bun, and Vercel only accepts a release line, never a canary.

To move to a newer canary: edit `.bun-version`, run `bun run setup:bun
--pin-all`, and commit the updated `.bun-lock.json`. `bun run doctor` warns
when a newer canary has been published.

## Getting Started

1. **Install the pinned Bun build:**

```bash
bun run setup:bun
```

This downloads the exact build named in `.bun-version` into `.bun/bin/bun`,
verifying its sha512 against `.bun-lock.json`. `.mise.toml` puts that
directory first on `PATH`, so `bun` is the pinned build from here on.

2. **Install dependencies:**

```bash
bun install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
```

Add your Supabase credentials to `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Run development server:**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Commands

```bash
bun run dev        # Start dev server (Next.js on the Bun runtime)
bun run build      # Production build
bun run start      # Serve the production build
bun run lint       # bun lint (Bun's built-in oxlint engine)
bun run format     # bun fmt (Bun's built-in formatter)
bun run fix        # lint --fix + format
bun run typecheck  # tsrs --noEmit (Rust port of the TypeScript compiler)
bun run typecheck:fast # bun check (Bun's own multi-core checker)
bun test           # unit tests
bun run verify     # lint + 2 type checkers + test (the full gate)
bun run doctor     # assert the Bun environment invariants still hold
bun run setup:bun  # install the exact Bun build pinned by .bun-version
bun run setup:tsdk # use tsrs as the editor's language server
```

`bun run doctor` is the migration's guard rail. It checks that the version pin
agrees across `.bun-version`, `package.json` and `.bun-lock.json`, that the
running Bun _is_ the pinned build, that no Node.js toolchain is reachable on
`PATH`, that `bun.lock` still satisfies `package.json`, that every package
needing an install script is trusted, that `bunfig.toml` keeps scripts on Bun
and Bun's own shell, that no install cache was created inside the project,
that no source file imports a `node:` module, that `tsrs` is the type gate,
and that CI never pulls in Node.js. It exits non-zero on any failure, and runs
in CI.

### Two type checkers, both in the gate

`bun run verify` runs two independent checkers over the whole project, and
both must agree:

| Command                  | Engine                           | Wall time |
| ------------------------ | -------------------------------- | --------- |
| `bun run typecheck`      | `tsrs` — Rust port of TypeScript | ~0.9 s    |
| `bun run typecheck:fast` | `bun check` — Bun's own checker  | ~0.15 s   |

`tsrs` is the fast, faithful port of the TypeScript compiler — it reports the
same diagnostics as `tsc` with the same error codes, and it is the primary
gate. `bun check` is the multi-core gate that runs in a fraction of a second.

The `typescript` npm package is **not** installed. TypeScript 7 ships no
JavaScript compiler API, so it cannot act as a gate here, and its
`#!/usr/bin/env node` launcher would be the last Node-flavoured entry in the
dependency tree. `next.config.ts` sets `experimental.useTypeScriptCli: false`
and `@typescript/native-preview` is installed instead, which is what tells
Next.js not to look for the `typescript` package at all.

Next.js' own type-check pass is disabled (`typescript.ignoreBuildErrors` in
`next.config.ts`) because it would duplicate `tsrs` on every build.

Getting the two to agree required three fixes, each a genuine improvement:

- `noUncheckedSideEffectImports: true` in `tsconfig.json` — `tsc` silently
  allowed side-effect imports of unresolvable modules; Bun's checker reports
  them. The option makes `tsc` match.
- `types/css.d.ts` declares `*.css`, so the stylesheet imports resolve.
- `lib/webgpu.ts` reads `navigator.gpu` through a local type instead of
  augmenting the global `Navigator`, which collided with the `NavigatorGPU`
  interface Bun's checker ships.

### tsrs as the editor's language server

`tsrs` also ships a language server (`tsrs --lsp -stdio`). `bun run setup:tsdk`
symlinks the _native_ Rust binary to `~/.tsrs-tsdk/tsgo`, which is where
VS Code's TypeScript 7 extension looks for it:

```jsonc
// VS Code user settings
{ "js/ts.tsdk.path": "~/.tsrs-tsdk" }
```

The editor and the CI gate then run the same checker, and the editor no
longer needs the `typescript` package either. Neovim users can point
`vim.lsp.config` at `tsrs --lsp -stdio` directly; the script prints the
exact snippet.

## Bun-First Architecture

Node.js is not part of this project at any layer — not the toolchain, not the
scripts, not the runtime, not production.

| Concern            | Bun-native choice                                                |
| ------------------ | ---------------------------------------------------------------- |
| Package manager    | `bun.lock` (text lockfile), `bun install --frozen-lockfile`      |
| Script runtime     | `bunfig.toml` → `[run] bun = true` — no script ever hits Node.js |
| Script shell       | `bunfig.toml` → `[run] shell = "bun"` — no bash/zsh dependency   |
| Test runner        | `bun test`                                                       |
| Type checking      | `tsrs` (Rust) + `bun check`                                      |
| Linting            | `bun lint` — the oxlint engine, built in                         |
| Formatting         | `bun fmt` — built in                                             |
| Language server    | `tsrs --lsp -stdio` — built into `tsrs`                          |
| File system        | `bun:fs` / `bun:path` / `Bun.file()` / `Bun.Glob`                |
| XML parsing        | `Bun.XML` (the RSS/Atom parser in `lib/api/rss.ts`)              |
| Script automation  | Bun Shell (`$`) inside `scripts/*.ts` — no shell scripts         |
| Environment vars   | `Bun.env` in scripts, `process.env` in Next.js app code          |
| Git hooks          | Lefthook, invoked via `bun x --bun`                              |
| Production runtime | Vercel Functions on Bun (`bunVersion` in `vercel.json`)          |
| Styling            | Tailwind CSS 4 — CSS-first `@theme`, no `tailwind.config.ts`     |

## Tailwind CSS 4

The stylesheet is configured in CSS, not JavaScript. `tailwind.config.ts` is
gone; the theme lives in `app/globals.css` as a `@theme` block, and
`postcss.config.mjs` uses `@tailwindcss/postcss` (no `autoprefixer` — v4 has
its own vendor prefixing).

Three Tailwind 4 rules the project depends on:

- **Colours are complete values.** `:root` holds `hsl(0 0% 100%)`, not
  `0 0% 100%`, and `@theme` maps `--color-background: var(--background)`.
  Tailwind 4 resolves colour utilities by parsing the theme value, so
  `hsl(var(--x))` cannot be used — it emits a literal `<alpha-value>` or gets
  mangled. Opacity modifiers (`bg-card/70`) still work because v4 implements
  them with `color-mix()`.
- **Custom utilities are `@utility`, not plain CSS.** A class defined in
  `@layer utilities` is not a utility, so it cannot be `@apply`-ed and its
  responsive variants (`md:text-fluid-3xl`) lose to the base class. The
  `.text-fluid-*` family uses `@utility` for exactly that reason.
- **A family of related classes shares one base rule.** Tailwind 4 cannot
  `@apply` a class from `@layer components`, so `.btn` is declared once for the
  whole family instead of being inlined into every variant. The variants
  follow it in the same layer, so a size still wins over a variant.

### Native XML instead of a dependency

`lib/api/rss.ts` parses the Firstory RSS/Atom feeds with Bun's built-in XML
processor, `Bun.XML`. That replaced a hand-rolled regex scanner and removed
the `xml2js` dependency (and its `sax` / `xmlbuilder` / `@types/xml2js`
transitive tree) entirely.

`Bun.XML` is a conforming, non-validating XML 1.0 processor: CDATA, entities,
self-closing tags, namespaced tags and repeated elements are all handled by
the runtime. Because a conforming parser rejects undeclared entities such as
the HTML `&nbsp;`, the parser retries once with those neutralised — so a
stray entity degrades to a sanitised parse rather than to zero episodes.

## Next.js 16.4 configuration

`next.config.ts` enables Cache Components **and** Partial Prefetching
together. Next 16.3+ treats them as a pair and warns when `cacheComponents`
is on without `partialPrefetching`; both become the default in the next
major release.

Next 16.3+ also validates Instant Navigations while prerendering. A Client
Component that reads URL data (`useParams`, `usePathname`, `useSearchParams`,
`useSelectedLayoutSegment(s)`) outside a `<Suspense>` boundary fails the
build with `CLIENT_HOOK_DYNAMIC`. The root layout's `<SpeedInsights />` reads
the route params, so it sits behind its own `<Suspense fallback={null}>` —
without that boundary, every dynamic route's static shell becomes
URL-specific and the 26 artist pages can no longer be prerendered.

If a new client component reads URL data, give it a `<Suspense>` boundary
rather than opting the route out with `export const instant = false`.
`bun run build` catches these; add `--debug-prerender` for a full stack
trace naming the exact component.

### Why `process.env` stays in Next.js app code

`Bun.env` is the right choice in standalone Bun scripts, but Next.js app code
must keep `process.env`:

- `NEXT_PUBLIC_*` variables are **inlined into the client bundle at build
  time** by the Next.js compiler. `Bun.env` is not inlined, so any client
  component reading `Bun.env.NEXT_PUBLIC_*` would break in the browser,
  where `Bun` does not exist.
- Route handlers and `proxy.ts` may execute on a V8-isolate (Edge) runtime
  where `Bun` is undefined but `process.env` is always present.

`Bun.env` is used in `scripts/**` only, where it is safe and correct.

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── home/            # Home page
│   ├── about/           # About page
│   ├── tests/           # Tests page
│   ├── contact/         # Contact page
│   ├── donation/        # Donation page
│   └── auth/            # Authentication pages
├── components/          # Reusable UI components
├── lib/                 # Utilities and configurations
│   ├── supabase/       # Supabase client setup
│   └── types/          # TypeScript types
├── scripts/             # Bun automation (TypeScript, run with `bun`)
├── types/               # Ambient type declarations
└── public/              # Static assets
```

## Database Schema

### Tables

**hybridized**

- id (int, primary key)
- created_at (timestamp)
- name (text)
- description (text)
- formula (text)
- id_new (int)
- iframe_url (text)
- cover_url (text)

**profiles**

- id (uuid, primary key)
- created_at (timestamp)
- email (text)
- full_name (text)
- avatar_url (text)

## Deployment

Always merge to `main`. Deliver to production accordingly.

1. Merge/push to `main`
2. GitHub Actions runs CI
3. Vercel auto-deploys to production (`hybridized.online`)

Vercel installs dependencies from `bun.lock` with
`bun install --frozen-lockfile`, so a deployment can never silently mutate the
lockfile, and it builds the app with `bun run build` (Next.js on the Bun
runtime).

`bunVersion: "1.4.x"` in `vercel.json` puts the serverless functions on Vercel's
Bun runtime as well, so Node.js is not part of the production path either.

## Features

- ✅ Server-side rendering with Next.js 16
- ✅ Supabase authentication
- ✅ Database integration
- ✅ Responsive design with Tailwind
- ✅ Type-safe with TypeScript
- ✅ Ready for Edge Functions
- ✅ Optimized for Vercel deployment

## License

MIT
