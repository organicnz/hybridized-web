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
bun run typecheck:edge # deno check — the Supabase edge functions
bun run lint:edge  # deno lint — the Supabase edge functions
bun run check:migrations # apply the migration chain to a throwaway Postgres
bun run audit:secrets  # walk every git object for credentials
bun test           # unit tests
bun run test:coverage # unit tests with the coverage floor from bunfig.toml
bun run verify     # lint + 2 type checkers + test (the full gate)
bun run doctor     # assert the Bun environment invariants still hold
bun run ci         # everything CI runs, in one command
bun run setup:bun  # install the exact Bun build pinned by .bun-version
bun run setup:tsdk # use tsrs as the editor's language server
bun run hooks:install # point Git at the Bun-native hooks in .githooks/
bun run hooks:run    # run a hook by hand (default: pre-commit)
```

`bun run doctor` is the migration's guard rail. Among the checks: the
version pin agrees across `.bun-version`, `package.json` and `.bun-lock.json`;
the running Bun _is_ the pinned build; no Node.js toolchain is reachable on
`PATH`; `bun.lock` still satisfies `package.json`; every package needing an
install script is trusted; `bunfig.toml` keeps scripts on Bun and Bun's own
shell; no install cache was created inside the project; the install is
isolated and guarded against fresh releases; no source file names a `node:`
module; no Node.js package is a direct dependency; `tsrs` is the type gate; the
git hooks are Bun scripts; the edge functions are type-checked; every direct
dependency is actually imported; the documentation points at files that
exist; `.env.example` and the code agree on the environment; no credential is
committed or anywhere in the history; the migrations create the tables and
the columns the application reads; and every workflow uses the pinned build
and never pulls in Node.js.

It exits non-zero on any failure, and runs in CI.

## Credentials

A credential that was committed once is in the history forever, and a
repository is public. Removing it from the file does not remove it from the
commits — the only fix is to rotate it. So the question is not "is the
working tree clean" but "was a credential ever committed".

`bun run audit:secrets` walks the history — every commit a local branch
reaches, and the objects no ref points at any more — and reports the
credential-shaped strings in them. The value is never printed, only where it
was. It runs in CI, with `fetch-depth: 0` so there is a history to audit.

`bun run doctor` runs the same rules over the working tree and over the
reachable history.

### The purge

Three credentials were committed to this repository before the audit
existed, and the repository is public. They were removed from the files, and
then the **history was rewritten** so the values are not in any commit:

| Credential              | Where it was committed                                            |
| ----------------------- | ----------------------------------------------------------------- |
| `FUNCTION_SECRET`       | `docs/edge-functions-security.md`, `docs/edge-functions-audit.md` |
| `SUPABASE_ACCESS_TOKEN` | `.kiro/settings/mcp.json`, since deleted                          |
| `VERCEL_API_KEY`        | `.kiro/settings/mcp.json`, since deleted                          |

A fresh clone of the repository contains none of them. What the rewrite
cannot do is invalidate a value that was public — **all three still have to
be rotated** in the Supabase and Vercel dashboards.

`scripts/known-secret-digests.json` is how a leak that is _known but still
being rotated_ gets acknowledged: the entry is the **digest** of the value, so
the file that admits to a leak does not put it back into the repository. A
finding whose digest is listed is reported as a warning; one that is not
listed fails the run. The list is empty now — the history is clean.

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

| Concern            | Bun-native choice                                                     |
| ------------------ | --------------------------------------------------------------------- |
| Package manager    | `bun.lock` (text lockfile), `bun install --frozen-lockfile`           |
| Install layout     | `linker = "isolated"` — pnpm-style, no phantom dependencies           |
| Supply chain       | `minimumReleaseAge` — a release must be 3 days old to be resolved     |
| Script runtime     | `bunfig.toml` → `[run] bun = true` — no script ever hits Node.js      |
| Script shell       | `bunfig.toml` → `[run] shell = "bun"` — no bash/zsh dependency        |
| Test runner        | `bun test --isolate` — a fresh global and registry per file           |
| Test order         | `bunfig.toml` → `[test] randomize = true` — no order-dependent tests  |
| Test re-runs       | `bunfig.toml` → `[test] rerunEach = 2` — no stale-module dependencies |
| Module mocking     | `mock.module` from `bun:test` — no seams in the production code       |
| Coverage           | `bun scripts/coverage.ts` — a native floor gate over the lcov report  |
| Type checking      | `tsrs` (Rust) + `bun check`                                           |
| Linting            | `bun lint` — the oxlint engine, built in, type-aware                  |
| Lint ratchet       | `bunfig.toml` → `[lint] maxWarnings` — the count cannot creep up      |
| Formatting         | `bun fmt` — built in, with Tailwind class sorting                     |
| Language server    | `tsrs --lsp -stdio` — built into `tsrs`                               |
| File system        | `bun:fs` / `bun:path` / `Bun.file()` / `Bun.Glob`                     |
| XML parsing        | `Bun.XML` (the RSS/Atom parser in `lib/api/rss.ts`)                   |
| Script automation  | Bun Shell (`$`) inside `scripts/*.ts` — no shell scripts              |
| Environment vars   | `Bun.env` in scripts, `process.env` in Next.js app code               |
| Git hooks          | Bun scripts in `.githooks/` — no hook-runner dependency               |
| Production runtime | Vercel Functions on Bun (`bunVersion` in `vercel.json`)               |
| Styling            | Tailwind CSS 4 — CSS-first `@theme`, no `tailwind.config.ts`          |
| Config files       | TypeScript throughout — `postcss.config.ts`, `next.config.ts`         |
| Edge functions     | Deno — the Supabase edge runtime, checked with `deno check`           |

## Isolated installs

`bunfig.toml` sets `linker = "isolated"`, so `node_modules` is laid out the
way pnpm lays it out: every package sees only the dependencies it declares.

That is not a layout preference, it is a correctness guarantee. A _phantom
dependency_ is a package that imports something it never declared and only
resolves because something else happened to install it — it works on one
machine and breaks on another, usually in CI. Under the isolated linker the
undeclared import stops resolving, and `bun install` is what surfaces it.

Adopting it immediately found one in this project: `next.config.ts` loads
`@vgpu/wgsl/loader-webpack` and `types/wgsl-env.d.ts` references
`@vgpu/wgsl/wgsl-types`, but `@vgpu/wgsl` was only ever a transitive
dependency of `vgpu`. It is now a declared devDependency.

`globalStore = true` is deliberately **not** enabled. It would materialise the
packages once into a global virtual store and make warm installs much faster,
but it adds a second symlink hop, and Turbopack then cannot statically
resolve the re-exports of `@sentry/react` (`export * from "@sentry/browser"`).
The build fails with _"Export startBrowserTracingPageLoadSpan doesn't exist in
target module"_. The isolated linker on its own is fine; the global store is
what breaks it. `bun run doctor` fails if it is ever enabled.

One more thing to know: **clear `.next` when the install layout changes.**
Turbopack caches module identities, and a cache built against a different
`node_modules` layout produces baffling errors — a null where a string is
expected, in the middle of a PostCSS transform. `rm -rf .next` when in doubt.

## The release-age guard

`bunfig.toml` sets `minimumReleaseAge = 259200` — three days. Bun will not
resolve a package version that was published less than three days ago, so a
compromised release cannot be pulled into the project during the window where
it is still being discovered and pulled.

The project follows three prerelease channels day to day, and those are the
only exemptions:

```toml
minimumReleaseAgeExcludes = ["next", "bun-types", "tsrs"]
```

They are canary and dev builds from publishers the project already trusts,
pinned to an exact version with a recorded integrity hash, so waiting three
days for them would mean never moving forward. Everything else waits.

## Tests that do not lie

The suite runs with two settings that exist to catch the failures a test
suite normally hides.

**`bun test --isolate`** gives every test file a fresh global _and_ a fresh
module registry. That matters more than it sounds: Bun runs the whole suite
in one process, so without isolation a `mock.module` in one file replaces the
module for every other file too, and a polyfill installed by one file is
visible to all of them. With isolation, a file's mocks, caches and globals
are its own.

**`bunfig.toml` sets `randomize = true`**, so the tests run in a random order
and Bun prints the seed it used. A test that quietly depends on another one
fails instead of passing by luck. The suite passes on every seed.

**`rerunEach = 2`** runs every test file twice. The second run sees the module
state the first one left behind, so a test that depends on a _clean_ module — a
cached value, a mocked global — fails instead of passing. This is the class of
bug that hides in a suite that only ever runs once.

### The lint ratchet

The React Compiler findings are warnings rather than errors on purpose:
making the codebase React-Compiler-shaped is a deliberate refactor of its own,
and the findings are listed in `oxlint.json` and in `CLAUDE.md`.

`bunfig.toml` sets `[lint] maxWarnings = 16` — the current count. The number
does not move up: a new warning fails the lint, and the fix is to resolve it
or to raise the count deliberately. Lowering it as warnings are fixed is the
other half of the ratchet.

### Tailwind class sorting

`bun fmt` sorts the Tailwind classes in every `className`, into the order
the framework's own guide uses — layout, then typography, then the visual
properties. Consistent ordering means a class list can be scanned, and two
people editing the same list produce the same result. It is Bun's
`[fmt.sortTailwindcss]`, and it needs no plugin.

### Mocking the SDK, not the code

`bun:test` ships `mock.module`, so the Supabase layer is tested without a
database and without a seam in the production code:

```ts
// tests/helpers/supabase.ts
mock.module("@supabase/ssr", () => ({ createBrowserClient, createServerClient }));
```

`lib/supabase/client.ts` and `lib/user-storage.ts` both run unmodified; only
the SDK boundary underneath them is replaced. Two rules make it work:

- **A mock factory replaces the module's whole export set.** It has to
  provide every named export the real module has, or the missing ones cannot
  be added back to an existing import.
- **The mock lives in one shared helper.** A `mock.module` call is global to
  the process, so registering it in one place stops the files from clobbering
  each other.

The result: `lib/supabase/server.ts` went from 70% covered to 100%, and
`lib/user-storage.ts` from 79% to 100%. The suite as a whole is at ~96% of
lines and ~99% of functions.

## The edge functions, on Deno

The six Supabase edge functions are the one part of the project that is _not_
Bun — and cannot be. The Supabase edge runtime is Deno, so they run on Deno,
and they are checked with Deno too:

```bash
bun run typecheck:edge   # deno check, with supabase/functions/deno.json
bun run lint:edge        # deno lint
```

Bun cannot type-check them: their imports are `jsr:` specifiers, which Bun
does not resolve. So they were excluded from the root `tsconfig.json` and
nothing checked them at all.

That is now fixed, and the first run found real problems:

- **Four `unknown` caught values treated as `Error`** — `err.message` on a
  value that is not an `Error` throws a `TypeError` and masks the real
  failure. Every one is now narrowed with `instanceof Error`.
- **Sixteen unchecked index accesses** in the feed parser, where a regex
  capture group is read without checking that it matched.
- **An unversioned JSR import** — `jsr:@supabase/functions-js/edge-runtime.d.ts`
  resolved to whatever the registry served that day. It is now pinned to
  `@2`.
- **A 2021-era `deno.land/std` server** in `invite-users`, while the other
  five used `Deno.serve()`. It is consistent now.

`supabase/functions/deno.json` holds the Deno configuration, including the
`nodeModulesDir` that keeps Deno's npm tree in `supabase/functions/` rather
than colliding with Bun's. Its `fmt` settings are tuned so `deno fmt` and
`bun fmt` produce identical output — `bun fmt` is the project's formatter,
and the two must not fight.

## The coverage gate

`bun run test:coverage` runs the suite with coverage on, reads the lcov report
Bun writes, and fails when the totals fall below the floor declared in
`bunfig.toml`:

```toml
[test]
coverageFloor = { lines = 0.95, functions = 0.95 }
```

The gate is a Bun script rather than Bun's built-in `coverageThreshold`,
because `coverageThreshold` is broken in the Bun build this project pins:
`1.4.4-canary.1` exits non-zero for _every_ threshold value, from 0.9 down to
0.001, and prints no diagnostic. `bun run doctor` fails if
`coverageThreshold` is ever added back to `bunfig.toml`.

The floor is currently well clear. The gate also fails when a module in the
measured scope is in no test at all: the floor only measures the files a test
imported, so a module nothing imports never reaches the report.

## Git hooks without a hook runner

The hooks are Bun scripts in `.githooks/`, and `scripts/hooks/install.ts` points
Git at them with `core.hooksPath`. This replaced `lefthook`, which was an npm
package that downloaded a Go binary at install time and then shelled out to
`bun x lefthook` on every hook run.

| Hook         | Gates                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `pre-commit` | `bun fmt` and `bun lint` on the staged files, then `tsrs` and `bun check` over the whole project |
| `pre-push`   | `bun test`, then `bun run build`                                                                 |

`pre-commit` re-stages the files the formatter rewrote, so the commit records
the formatted content rather than the pre-format content.

`bun run hooks:install` is wired to the `prepare` lifecycle script, so the
hooks are installed by `bun install` and stay installed. It is a no-op in CI,
on Vercel and outside a git checkout.

## Tailwind CSS 4

The stylesheet is configured in CSS, not JavaScript. `tailwind.config.ts` is
gone; the theme lives in `app/globals.css` as a `@theme` block, and
`postcss.config.ts` uses `@tailwindcss/postcss` (no `autoprefixer` — v4 has
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

## Next.js 16.5 configuration

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
│   ├── hooks/           # Git hook installer and runner
│   └── doctor.ts        # The executable form of the rules in this file
├── types/               # Ambient type declarations
├── .githooks/           # Git hooks, as Bun scripts
└── public/              # Static assets
```

## `bun:*` types without `node:`

`types/bun-modules.d.ts` declares `bun:fs`, `bun:fs/promises` and `bun:path`
against Bun's own API. `bun-types` does not ship them, and the obvious
alternative — re-exporting the Node typings — would put a `node:` specifier
back into the project.

Declaring them by hand means the repository names no `node:` module at all,
not even in type position, and it means the declarations describe Bun's
runtime rather than Node's. They are also stricter: writing them surfaced two
overloads that the Node typings allow but that Bun's `readFileSync` and
`readdir` need to distinguish.

`@types/node` is still a **direct** devDependency, and it has to be: Next.js
refuses to build without it and says so explicitly. It is types only, it ships
no runtime, and nothing in the project re-exports its typings the way the old
`types/bun-modules.d.ts` did. `bun run doctor` fails if `@types/node` is
dropped, and fails if any _other_ Node.js package is added to `package.json`.

## Database Schema

The authoritative shape is `lib/types/database.types.ts`, generated from the
live database with `bun run types:supabase`.

### Tables

**bands**

- id (int, primary key)
- id_new (int)
- name (text)
- description (text)
- formula (text)
- iframe_url (text)
- cover_url (text)
- soundcloud_url (text)
- firstory_user_id (text)
- other (text)
- created_at (timestamptz)

**episodes**

- id (int, primary key)
- episode_id (text, required)
- band_id (int, references bands.id)
- title (text, required)
- description (text)
- audio_url (text, required)
- cover_url (text)
- pub_date (timestamptz)
- duration (int)
- audio_length (int)
- creator (text)
- explicit (boolean)
- link (text)
- guid (text)
- enclosure_type (text)
- created_at (timestamptz)

**profiles**

- id (uuid, primary key, references auth.users)
- created_at (timestamptz)
- email (text)
- full_name (text)
- avatar_url (text)
- phone (text)
- username (text)
- website (text)
- admin (boolean)
- updated_at (timestamptz)

**settings**

- id (uuid, primary key)
- user_id (uuid, required)
- gains (jsonb)
- volume_settings (jsonb)
- last_track (jsonb)
- last_artist (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### The migration chain is checked

`bands`, `episodes` and `settings` were created out of band, so no migration
owned them. The migrations altered, indexed and wrote policies against tables
that did not exist — which works on the production database and fails on a
_fresh_ one, at the first statement that touches a table nobody created.

`supabase/migrations/20240101000001_core_tables.sql` now creates them, and
sorts before the migrations that assume them. `profiles` gains the five
columns the application reads — including `admin`, which `lib/api/auth.ts`
selects to decide who may call the sync endpoints; without it the query
throws, the error is swallowed, and _nobody_ is ever an admin.

`bun run check:migrations` proves it: it applies the whole chain to a
throwaway Postgres, compares the resulting schema with the generated types,
and asserts the behaviour — the signup triggers fire, the admin flag
persists, `search_episodes` finds rows, and row level security is on every
table. It runs in CI.

The generated types are the contract. A column they declare but no migration
creates is a column a fresh database does not have, and the failure is
silent. `bun run doctor` compares the two, offline, and reports any column
the migrations do not create.

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
