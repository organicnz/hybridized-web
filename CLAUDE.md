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
- **Git hooks:** Bun scripts in `.githooks/` — no hook-runner dependency
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
.githooks/    → Git hooks, as Bun scripts
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
bun run test:coverage # unit tests with the coverage floor
bun run verify     # lint + both type checkers + test
bun run doctor     # assert the Bun environment invariants
bun run setup:bun  # install the exact Bun build pinned by .bun-version
bun run setup:tsdk # wire tsrs up as the editor's language server
bun run hooks:install # point Git at the Bun-native hooks in .githooks/
bun run hooks:run    # run a hook by hand (default: pre-commit)
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
- **The install is isolated.** `bunfig.toml` sets `linker = "isolated"`, so
  `node_modules` is pnpm-shaped and a package only sees the dependencies it
  declares. A _phantom dependency_ — importing something that was never
  declared, and only resolving because something else installed it — now
  fails at install time instead of on someone else's machine. When one turns
  up, declare the package as a direct dependency; do not reach for
  `publicHoistPattern` to hide it. Adopting the isolated linker is what
  surfaced `@vgpu/wgsl` as an undeclared direct dependency of this project.
- **Never enable `globalStore`.** It makes warm installs much faster, but it
  adds a second symlink hop, and Turbopack then cannot statically resolve the
  re-exports of `@sentry/react` (`export * from "@sentry/browser"`). The build
  fails with _"Export startBrowserTracingPageLoadSpan doesn't exist in target
  module"_. The isolated linker on its own is fine. `bun run doctor` fails if
  it is ever turned on.
- **The Supabase edge functions are Deno, and are checked with Deno.** The
  Supabase edge runtime is Deno, so `supabase/functions/**` is excluded from
  the root `tsconfig.json` — and Bun cannot check it either, because the
  `jsr:` specifiers do not resolve in Bun. `supabase/functions/deno.json`
  holds the configuration, and `bun run typecheck:edge` / `bun run lint:edge`
  run `deno check` and `deno lint` against it. CI installs Deno for this.
  - `supabase/functions/deno.json`'s `fmt` settings are tuned so `deno fmt`
    and `bun fmt` agree exactly (`trailingCommas: "onlyMultiLine"`,
    `proseWrap: "never"`). `bun fmt` is the project's formatter; the two
    must not fight.
  - `nodeModulesDir: "auto"` puts Deno's npm tree in
    `supabase/functions/node_modules/`, so it does not collide with Bun's.
  - `deno lint` requires a version on every JSR import, so
    `jsr:@supabase/functions-js@2/edge-runtime.d.ts` is pinned.
  - A `catch` clause value is `unknown` under `strict`; narrow it with
    `err instanceof Error ? err.message : String(err)`.
  - `noUncheckedIndexedAccess` is on, so a regex capture group is
    `string | undefined` — read it with `?.[1]` and narrow it.
  - **The logic of an edge function lives in a module of its own, when it can
    be tested.** `supabase/functions/sync-firstory/parse.ts` holds the parsing
    and the band matching, and the entry point imports it. The reason is
    testability: the entry point calls `Deno.serve` at module scope, so
    importing it starts a listener, and the pure logic inside it could not be
    reached by a test at all.
    - That module is ordinary TypeScript — no Deno APIs — so its tests run
      with **Bun**, in the same suite as the rest of the project
      (`tests/firstory-parse.test.ts`). Nothing about a Deno function has to
      mean a Deno test runner.
    - The cron calls the function every six hours, so a change in the band
      matching quietly moves episodes between bands. The tests pin the
      matching down: the exact artist name, the longest band name winning,
      and the "Greg Benz belongs to Benz & MD" special case.
- **Clear `.next` when the install layout changes.** Turbopack caches module
  identities, so a cache built against a different `node_modules` layout
  produces baffling errors — a null where a string is expected, in the middle
  of a PostCSS transform. `rm -rf .next` after changing the linker.
- **`minimumReleaseAge = 259200` (three days).** Bun will not resolve a
  version published less than three days ago, so a compromised release cannot
  be pulled in during the window where it is still being discovered. The only
  exemptions are `next`, `bun-types` and `tsrs` — the prerelease channels
  this project deliberately follows, pinned to an exact version with a
  recorded integrity hash. **Adding a prerelease dependency means adding it
  to `minimumReleaseAgeExcludes`**, or it can never be updated; `bun run
doctor` fails when the exemption list rots.
- Automation lives in `scripts/**/*.ts` and is executed with `bun`. Use Bun
  Shell (`import { $ } from "bun"`) instead of shelling out to `sh -c`.
- Use `bun:fs`, `bun:fs/promises`, `bun:path`, `Bun.file()`, `Bun.Glob`,
  `Bun.XML` and `Bun.sleep` rather than their `node:` equivalents or a
  third-party library. `types/bun-modules.d.ts` supplies the ambient types
  `bun-types` does not ship, written against Bun's own API — **no file in
  this project may name a `node:` module, not even in type position**, and
  `bun run doctor` fails if one does.
  - `bun:fs` re-exports the _callback_ API; use `bun:fs/promises` for
    promises.
  - `@types/node` **is** a direct dependency: Next.js refuses to build without
    it and says so explicitly. It is types only, so nothing about it puts a
    Node.js runtime in the project, and no file re-exports its typings the
    way the old `types/bun-modules.d.ts` did. `bun run doctor` fails if it is
    dropped, and fails if any _other_ Node.js package is added.
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
- **The test suite runs with `--isolate`.** `bun test --isolate` gives every
  test file a fresh global _and_ a fresh module registry. Bun runs the whole
  suite in one process, so without isolation a `mock.module` in one file
  replaces the module for every other file, and a polyfill installed by one
  file is visible to all of them. A file that needs a `localStorage` polyfill
  must install its own (`tests/helpers/local-storage.ts`).
  - `bun run test` is the entry point, not a bare `bun test` — the flag is
    the point. `verify` and the coverage script both call `bun run test`.
- **`bunfig.toml` sets `[test] randomize = true`.** The tests run in a random
  order and Bun prints the seed, so a test that quietly depends on another
  one fails instead of passing by luck. Do not make a test order-dependent.
  - A module-level cache needs a cold registry to be observed. `--isolate`
    gives that per _file_, so a test that needs a cold cache gets a file of
    its own (`tests/user-storage-lookup.test.ts`).
- **`bunfig.toml` sets `[test] rerunEach = 2`.** Every test file runs twice,
  and the second run sees the module state the first one left behind. A test
  that needs a _clean_ module — a cached value, a mocked global — fails
  instead of passing. This is the class of bug that hides in a suite that
  only ever runs once.
- **`bunfig.toml` sets `[lint] maxWarnings = 16`.** The React Compiler
  findings are warnings rather than errors on purpose, so the count is
  _capped_ instead. The number does not move up: a new warning fails the
  lint, and the fix is to resolve it or to raise the count deliberately.
  Lowering it as warnings are fixed is the other half of the ratchet.
- **`bun fmt` sorts the Tailwind classes** (`[fmt.sortTailwindcss]`). It needs
  no plugin, and it means a `className` can be scanned and two people editing
  the same list produce the same result.
- **Mock modules with `bun:test`'s `mock.module`**, not with a seam in the
  production code. Two rules:
  - **A mock factory replaces the module's whole export set.** Every named
    export the real module has has to be in the factory, or the missing ones
    cannot be added back to an existing import — the failure is a
    `SyntaxError: Export named '...' not found`.
  - **Register the mock once, in a shared helper** (`tests/helpers/supabase.ts`).
    A `mock.module` call is global to the process, so registering it in each
    file lets them clobber each other.
- **The API's contract is tested, not only its helpers.**
  `tests/api-routes.test.ts` calls the exported Vercel handler with a `Request`
  and reads the response back, the way Next.js calls it. Only the database is
  faked: the authorisation, the validation, the parsing and the error handling
  are the real implementations. The fake is a proxy, because a query builder
  is a thenable and a `then` member on a class is a thenable by accident.
- **Anything thrown from a route is normalised first.** Hono only hands an
  `Error` to the app's error handler; anything else is re-thrown and the
  request dies without the clean JSON the API promises. So the throw sites use
  `toError` from `lib/api/errors.ts`, and a test asserts that a driver
  failing with a plain object still answers `500` with
  `{ "error": "Internal server error" }`.
- **`bunfig.toml` sets `[lint] typeAware = true`.** The type-aware rules —
  `@typescript-eslint/no-floating-promises` and friends — are the ones that
  need the type information to be useful. The codebase is clean under them.
- **Every configuration file is TypeScript.** `postcss.config.ts`, not
  `.mjs` — a `.mjs` config is a file the type checker never sees.
  `bun run doctor` fails if a `.js`, `.mjs` or `.cjs` config reappears.
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
    `bun:fs` / `bun:fs/promises` / `bun:path`.
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
- **The git hooks are Bun scripts**, in `.githooks/`, with `core.hooksPath`
  pointing at them. `scripts/hooks/install.ts` does that and is wired to the
  `prepare` lifecycle script, so `bun install` keeps the hooks in place. Do
  not reintroduce a hook-runner dependency: `lefthook` was an npm package
  that downloaded a Go binary at install time and shelled out to
  `bun x lefthook` on every hook run.
  - `pre-commit` formats and lints the staged files, then runs both type
    checkers over the project. It re-stages whatever the formatter rewrote,
    so the commit records the formatted content.
  - `pre-push` runs the test suite and the production build.
  - The hooks spawn `process.execPath`, so they always use the same Bun that
    is running them, whatever is on `PATH`.
- **The coverage gate is `bun scripts/coverage.ts`**, not Bun's own
  `coverageThreshold`. That key is broken in the pinned build
  (`1.4.4-canary.1` exits non-zero for every threshold value and prints no
  diagnostic), so the floor is declared as `[test] coverageFloor` in
  `bunfig.toml` and enforced by the script against the lcov report.
  `bun run doctor` fails if `coverageThreshold` is added back. The floor is
  currently ~98% lines and ~98% functions, against a floor of 95%.
  - **The floor measures the logic, not the React surface.** The components
    need a browser to test their behaviour — the click handlers, the effects
    and the media elements cannot run without one — so they are excluded from
    the report in `bunfig.toml`. What they do have is the rendering tests
    (`tests/home-client.test.ts`), which read the markup back and pin the
    structure down: the sets list and the artist profile each scroll inside
    their own panel, and neither is inside the other.
  - A DOM test environment would cover the rest of the React surface. That
    is a dependency decision, not a tooling one.
  - **Every module in the measured scope has to be in the report.** The floor
    only measures the files a test imported, so a module nothing imports
    never reaches the report and the floor cannot see it. The coverage script
    closes that: every module under `lib/`, `app/api/`, `scripts/lib/` and
    `supabase/functions/` has to be measured, or to be in the exemption list
    with a reason for it. The Deno entry points are exempt by their name:
    they call `Deno.serve` at module scope, so a test cannot import one at
    all — the logic that can be tested lives in a module beside them, and
    that module is measured.
  - **A module nothing imports is dead code.** `bun run doctor` fails when a
    file under `lib/`, `components/` or `hooks/` is not imported by anything —
    statically or dynamically. Two were here and are gone: a design-token
    file that had drifted from the CSS that replaced it, and a set of scroll
    hooks that duplicated `components/scroll-reveal.tsx`.
- **A component renders on the server, so its markup can be read back.**
  `renderToStaticMarkup` from `react-dom` — a dependency the project already
  has — renders the client components without a browser. The rules:
  - Render an _element_, never call the component: `createElement(HomeClient,
props)`. Calling it directly runs the hooks outside a render, and React
    says so.
  - Wrap it in the providers it needs. `HomeClient` reads the audio player
    context, so it needs `AudioPlayerProvider` around it.
  - The elements that need the browser — the effects, the event handlers —
    do not run, and that is the point: the _markup_ is what is under test.
- `trustedDependencies` must list every package whose install script is
  needed (`webgpu`, `@vgpu/adapter-node`). Bun blocks the rest, and their
  scripts would never run. Re-check with `bun pm trust --all` after adding a
  dependency. Under the isolated linker the packages live in
  `node_modules/.bun/`, so `bun prune` is what clears a removed dependency's
  store entry.
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
  executable form of the rules above. In outline:
  - the version pin agrees across `.bun-version`, `package.json` and
    `.bun-lock.json`, and the running Bun is that build
  - no Node.js toolchain is on `PATH`; the lockfile satisfies `package.json`;
    every install script is trusted
  - `bunfig.toml` keeps scripts on Bun and Bun's own shell, does not redirect
    the install cache, uses the isolated linker, guards against fresh
    releases, does not use the global virtual store, and does not use the
    broken coverage threshold
  - the coverage gate is wired, the test suite is isolated, randomised and
    re-run, the lint warning count is ratcheted, the linter is type-aware
  - every config file is TypeScript; every direct dependency is imported
  - the edge functions are checked with Deno; the migration chain is checked
    against a real Postgres, and the migrations create the tables and the
    columns the application reads
  - no source file names a `node:` module; `@types/node` is a direct
    dependency because Next.js needs it, and no other Node.js package is
  - `tsrs` is the type gate and the `typescript` package is not installed
  - the git hooks are Bun scripts and no hook runner is a dependency
  - no credential is committed or in the history; the documentation points at
    files that exist; `.env.example` and the code agree
  - CI never pulls in Node.js and every workflow uses the pinned build
    It must pass before committing.
- **No credential is committed, and none is in the history.** The rules live
  in `scripts/lib/secrets.ts`, shared by the doctor and
  `bun run audit:secrets`. A credential-shaped value is a `Bearer` token, or
  an assignment to a `*_SECRET` / `*_TOKEN` / `*_PASSWORD` / `*_PRIVATE_KEY` /
  `*_KEY` name, that is long, mixed and not a placeholder. `NEXT_PUBLIC_*` is
  exempt: it is in the browser bundle by definition. The value is never
  printed — only where it was.
  - The doctor scans the working tree and the **reachable** history.
  - `bun run audit:secrets` scans **every object the repository has ever
    held**, including the ones no ref points at any more — which is where a
    secret in an amended commit ends up. It runs in CI, with `fetch-depth: 0`.
  - A credential that is already known is recorded by **digest** in
    `scripts/known-secret-digests.json`, so acknowledging a leak does not put
    it back into the repository. A finding whose digest is not listed fails
    the run; a listed one is reported until the credential is rotated and the
    history rewritten. A **known** credential in a commit that could be pushed
    still fails: the history was rewritten to take it out, so putting it back
    makes it live again.
  - The value may be quoted or bare, and the digest is the same either way —
    `const API_KEY = "…"` and `API_KEY=…` are the same credential. A read of
    an environment variable (`process.env.SYNC_SECRET`) is not a credential:
    the value is not in the source.
  - The rules have their own tests, in `tests/secrets.test.ts`, including a
    throwaway git repository with a credential committed to it. The scanner is
    the gate that stands between a leaked key and the repository, so it is
    measured like the rest of the code.
  - **A secret that reaches the repository has to be rotated**, because
    removing it from the file does not remove it from the history.
- **The migrations have to create the tables and the columns the application
  reads.** `bun run doctor` compares what the migrations create with what
  `lib/types/database.types.ts` declares, offline, and reports any column
  that no migration creates. The types are the contract: they are generated
  from the live database, and the application reads them. A column the types
  declare but no migration creates is a column a _fresh_ database does not
  have — and the failure is silent, because a query for a missing column
  throws and the error is swallowed. `profiles.admin` was exactly that: the
  authorization path selects it, so on a database without it nobody would
  ever be an admin.
  - **A unique constraint the application relies on has to exist too.** The
    doctor reads the `onConflict` targets out of the application and checks
    that a migration makes those columns unique. `POST /api/v1/sync-episodes`
    upserts on `episode_id`, and the chain had only a plain index on it — so
    on a database built from the migrations the upsert raises 42P10 and the
    endpoint syncs nothing. The live database may already have the index, so
    the migration is a no-op there; a fresh one gets it.
  - **A sync that wrote nothing is not a success.** The endpoint used to
    answer `{ success: true, synced: 0 }` when every write failed, which is
    how a broken upsert stays invisible. It now counts the failures, logs the
    reason server-side, and answers `success: false`.
- **`bun run check:migrations` applies the whole chain to a throwaway
  Postgres** and compares the result with the contract: every migration
  applies in order to an empty database, every declared column exists, the
  signup triggers fire, the search function finds rows, and row level
  security is on every table. Postgres is pinned in `.mise.toml` for it, and
  the check skips itself cleanly when Postgres is absent. It runs in CI.
  - `20240101000001_core_tables.sql` sorts _before_ migrations that have
    already been applied, so the deploy workflow needs `supabase db push
--include-all`. The migration is idempotent, so on the production
    database it is a no-op.
- **Every route needs a skip-link target.** The root layout offers a "Skip to
  content" link pointing at `#main-content`. Only the pages that use
  `<AppShell>` had that id, so on the rest of the site the link did nothing.
  `bun run doctor` walks each route's imports and checks that something in
  the graph carries the id, `<AppShell` or `<AuthShell>`. A route that only
  redirects is exempt — it never renders its own content.
- **The security headers have a test.** They are the app's outermost
  defence, and they live in `next.config.ts` — a file no test touched, so a
  header that was dropped was invisible. `tests/security-headers.test.ts`
  checks that they are set on every route and that their values are the
  strict ones, and that the policy's `report-uri` points at a route that
  exists.
  - The policy is **report-only**: it has `unsafe-inline` in `script-src`,
    which Next's inline scripts need, so enforcing it would break the app.
    It reports, and the headers do the enforcing. `frame-ancestors 'self'`
    is in the policy as well as `X-Frame-Options`, so the policy says the
    same thing when it is enforced.
- **A server component renders to a stream.** `renderToReadableStream` from
  `react-dom/server` — a dependency the project already has — reads the
  markup of an async page back, so the artist page can be tested: the
  artist, their episodes, an episode that belongs to nobody, the skip-link
  target, and the 404 for an artist that does not exist.
  - It needs three things the test has to provide: the database (the static
    client is mocked), the app router (`next/navigation` is mocked, because
    the nav asks for the router), and the audio player context (the provider
    wraps the page, the way the root layout does).
- **An artist page that does not exist answers 200.** The status was sent
  with the first chunk of the stream, so `notFound()` inside the suspended
  part can only change the body — Next.js's own rule, and the reason it is
  not a bug to chase. Two things make it right instead:
  - **`dynamicParams = false` is not the answer.** With Cache Components it
    is not supported at all: the build fails with _"Route segment config
    `dynamicParams` is not compatible with `nextConfig.cacheComponents`"_.
  - **The metadata keeps the page out of an index.** The title is "Not
    Found" and `robots` is `noindex` for an artist that does not exist, so
    a crawler does not index a 404 that answers 200.
- **A page title is a name, not a slug.** The slug is what the URL carries
  — "alex-hall" — and the title is what a visitor reads, so the metadata
  looks the artist up (`findArtistBySlug`) and uses the name.
- **A number from a query string is clamped _and_ checked.** `Math.max(NaN, 1)`
  is `NaN`, so clamping alone does not make a limit safe: `?limit=abc` would
  reach the database as `NaN` and the query would be nonsense. `clampInteger`
  in `lib/api/validation.ts` falls back to the default for a value that is
  not a number, and clamps the rest.
- **A value in storage is not to be trusted.** It is whatever was written
  there — an older version wrote a different shape, and a half-finished write
  leaves a broken one. `getUserStorageItemAsJson` returns `null` for a value
  that does not parse, so a parse error cannot take the player down with it.
- **The proxy is the boundary, and it has a test.** `proxy.ts` rate limits
  the API per address and guards the protected pages. `tests/proxy.test.ts`
  covers both: the quota headers are on every answer (including the first
  one for an address, which is the one a client looks at), the hundredth
  request in the window gets a 429 with a `Retry-After`, and a signed-out
  visitor is sent to the login page with the page they wanted in
  `redirectTo`.
  - The address has to be fresh per test: the proxy keeps its map in the
    module, and the module survives the file's second run, so an address
    used twice would start that run one request down.
- **The CSP report endpoint does not trust its body.** The body comes from
  whoever posted it, so a body that is not JSON is a 400 and a body that is
  larger than a report is a 413 — neither may take the handler down.
- **The documentation has to point at files that exist.** The doctor checks
  every backticked path in `docs/*.md`, `README.md` and `CLAUDE.md`. A
  reference that is a plan, or a name the project used to have, is skipped —
  the words `create`, `renamed`, `used to be`, `gone` and the rest mark it —
  but a path that is simply wrong is reported. The `middleware.ts` →
  `proxy.ts` rename left four documents pointing at a file that had not
  existed for a release.
- **`.env.example` and the code have to agree.** The doctor checks both
  directions: a variable the code reads but the example does not list, and a
  variable the example lists that nothing reads. The platform sets `CI`,
  `NODE_ENV`, and the `SUPABASE_URL` and `SUPABASE_ANON_KEY` that the edge
  runtime injects, so those are exempt.
- **Every workflow that runs Bun must install the pinned build** with
  `bun scripts/install-bun.ts --output-dir "$HOME/.bun/bin"`. The installer
  replaces `oven-sh/setup-bun`'s binary in place, in the same directory, so
  every later step in that job runs the build `.bun-version` names. A
  workflow that skips it runs on whatever the canary channel served that day.
  `bun run doctor` fails if any workflow does not.
- **Deno is pinned in `.mise.toml`** (`[tools] deno = "2"`), because it can be:
  mise's `deno` backend resolves stable release lines against real releases,
  and none of the canary problems that keep Bun out of `[tools]` apply. The
  edge functions run on it, so its version is part of the toolchain.
- `Bun.Glob` does **not** support brace expansion (`{a,b}` matches nothing).
  Use one pattern per shape, e.g. `node_modules/*/package.json` and
  `node_modules/@*/*/package.json`.

## Tailwind CSS 4 Rules

The theme is CSS-first: `tailwind.config.ts` is gone and `app/globals.css`
carries an `@theme` block. `postcss.config.ts` uses `@tailwindcss/postcss`
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
