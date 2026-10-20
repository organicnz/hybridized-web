#!/usr/bin/env bun
/**
 * Wire `tsrs` up as the editor's TypeScript language server.
 *
 * `tsrs` ships a language server (`tsrs --lsp -stdio`) that speaks the same
 * protocol as `tsgo --lsp -stdio`. Using it in the editor means the editor
 * and the CI type gate run the exact same Rust checker — and the editor no
 * longer needs the `typescript` npm package, which this project does not
 * have.
 *
 * VS Code's TypeScript 7 extension starts `<tsdk>/tsgo --lsp --stdio`, so
 * the `tsdk` directory has to contain an executable literally named `tsgo`.
 * This script symlinks the *native* Rust binary there — not the npm package's
 * `#!/usr/bin/env node` launcher — so no Node.js is involved.
 *
 * Usage:
 *   bun scripts/setup-tsdk.ts            # create ~/.tsrs-tsdk
 *   bun scripts/setup-tsdk.ts --print    # only print the instructions
 */
import { existsSync, mkdirSync, rmSync, symlinkSync } from "bun:fs";
import { join, resolve } from "bun:path";

/** The user's home directory, without reaching for `node:os`. */
function homeDir(): string {
  const home = Bun.env.HOME ?? Bun.env.USERPROFILE;
  if (!home) {
    throw new Error("Neither HOME nor USERPROFILE is set — cannot locate ~/.tsrs-tsdk.");
  }
  return home;
}

const TSDK_DIR = join(homeDir(), ".tsrs-tsdk");
const TSDK_EXE = join(TSDK_DIR, "tsgo");

/** The npm package name for the native binary on this platform. */
function platformPackage(): string {
  const { platform, arch } = process;
  if (platform === "darwin") {
    return arch === "arm64" ? "darwin-arm64" : "darwin-x64";
  }
  if (platform === "linux") {
    return arch === "arm64" ? "linux-arm64" : "linux-x64";
  }
  if (platform === "win32") return "win32-x64";
  throw new Error(`tsrs has no published binary for ${platform}-${arch}.`);
}

/** Absolute path of the native Rust binary inside node_modules. */
function nativeBinary(): string {
  const projectRoot = resolve(import.meta.dir, "..");
  const candidate = join(
    projectRoot,
    "node_modules",
    "@tsrs",
    platformPackage(),
    process.platform === "win32" ? "tsrs.exe" : "tsrs",
  );
  if (!existsSync(candidate)) {
    throw new Error(
      `The native tsrs binary is not installed at ${candidate}.\n` +
        `Run "bun install" so the @tsrs/${platformPackage()} optional dependency is present.`,
    );
  }
  return candidate;
}

function instructions(): string {
  return `
tsrs is wired up as the TypeScript language server.

  tsdk   ${TSDK_DIR}
  binary ${TSDK_EXE}

VS Code — add to your user settings.json:

  {
    "js/ts.tsdk.path": "${TSDK_DIR}"
  }

  Then run "TypeScript 7: Restart Server" from the command palette.

Neovim (0.11+) — in your LSP configuration:

  vim.lsp.config('tsrs', {
    cmd = { '${nativeBinary()}', '--lsp', '-stdio' },
    filetypes = { 'typescript', 'typescriptreact', 'javascript', 'javascriptreact' },
    root_markers = { 'tsconfig.json', 'jsconfig.json', 'package.json', '.git' },
  })
  vim.lsp.enable('tsrs')
`.trim();
}

if (Bun.argv.includes("--print")) {
  console.log(instructions());
  process.exit(0);
}

const binary = nativeBinary();

mkdirSync(TSDK_DIR, { recursive: true });

// Replace any previous link so a stale target cannot linger.
if (existsSync(TSDK_DIR) || existsSync(TSDK_EXE)) {
  rmSync(TSDK_EXE, { force: true });
}
symlinkSync(binary, TSDK_EXE);

console.log(instructions());
