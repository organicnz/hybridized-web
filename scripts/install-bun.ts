#!/usr/bin/env bun
/**
 * Install the exact Bun build pinned by `.bun-version`.
 *
 * Why this exists instead of `mise` or `oven-sh/setup-bun`:
 *
 *   - Bun's "canary" release channel has unversioned assets that are replaced
 *     every day, so a canary version *string* is not a pin. The GitHub tag
 *     `canary` served a different binary today than yesterday.
 *   - The npm publish version (`1.4.3-canary.20261019.1`) IS immutable — npm
 *     forbids republishing a version — and it is the only handle that resolves
 *     to one specific binary everywhere.
 *   - `setup-bun` resolves versions against Bun's git tags, and canaries have
 *     no git tags, so it cannot install a pinned canary at all.
 *   - `package.json`'s `packageManager` does not pin the runtime either: Bun
 *     1.4 never re-execs the named build.
 *
 * So: resolve the platform package `@oven/bun-<platform>` at the pinned
 * version, verify its `dist.integrity` (sha512) against `.bun-lock.json`,
 * extract the binary, and record the revision it reports.
 *
 * Usage:
 *   bun scripts/install-bun.ts                    # install to ./.bun/bin
 *   bun scripts/install-bun.ts --output-dir DIR   # install elsewhere
 *   bun scripts/install-bun.ts --check            # verify only, install nothing
 *   bun scripts/install-bun.ts --pin-all         # record every platform's hash
 */
import { chmodSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "bun:fs";
import { join, resolve } from "bun:path";

const REGISTRY = "https://registry.npmjs.org";

/** Per-platform npm package names, mirroring Bun's own release packaging. */
const PLATFORM_PACKAGES: Record<string, string> = {
  "darwin-arm64": "bun-darwin-aarch64",
  "darwin-x64": "bun-darwin-x64",
  "linux-arm64": "bun-linux-aarch64",
  "linux-arm64-musl": "bun-linux-aarch64-musl",
  "linux-x64": "bun-linux-x64",
  "linux-x64-musl": "bun-linux-x64-musl",
  "win32-x64": "bun-windows-x64",
  "win32-x64-baseline": "bun-windows-x64-baseline",
};

/** The path the binary lives at inside the platform tarball. */
const TARBALL_BINARY = "package/bin/bun";

interface LockFile {
  /** The npm publish version of the pinned Bun. */
  version: string;
  /** The revision the pinned binary reports, e.g. "1.4.4-canary.1+6bb5dc195". */
  revision: string;
  /** sha512 integrity of each platform tarball, keyed by npm package name. */
  integrity: Record<string, string>;
}

interface RegistryVersion {
  version: string;
  dist: { tarball: string; integrity?: string; shasum?: string };
}

const args = Bun.argv.slice(2);
const checkOnly = args.includes("--check");
const pinAll = args.includes("--pin-all");
const outputDirArg = args.indexOf("--output-dir");
const outputDir = outputDirArg === -1 ? undefined : args[outputDirArg + 1];

/** True on Linux distributions built against musl libc. */
function isMusl(): boolean {
  if (process.platform !== "linux") return false;
  try {
    const ldd = Bun.spawnSync(["ldd", "--version"], { stdout: "pipe" });
    const output = ldd.stdout.toString().toLowerCase();
    if (output.includes("musl")) return true;
    const lddPath = Bun.which("ldd");
    if (!lddPath) return false;
    return lddPath.includes("musl");
  } catch {
    return false;
  }
}

/** The npm package name for the current machine. */
function currentPlatformPackage(): string {
  const arch = process.arch;
  if (process.platform === "darwin") {
    const name = PLATFORM_PACKAGES[`darwin-${arch}`];
    if (name) return name;
  }
  if (process.platform === "linux") {
    const suffix = isMusl() ? "musl" : "";
    const name = PLATFORM_PACKAGES[`linux-${arch}${suffix ? `-${suffix}` : ""}`];
    if (name) return name;
  }
  if (process.platform === "win32") {
    const name = PLATFORM_PACKAGES[`win32-${arch}`];
    if (name) return name;
  }
  throw new Error(`No Bun release package is published for ${process.platform}-${process.arch}.`);
}

/**
 * Extract a single file from a gzipped tar archive.
 *
 * Bun has no built-in tar reader (`Bun.Tar` does not exist yet), so this
 * walks the 512-byte ustar headers directly. The platform tarballs hold one
 * binary plus a manifest and a README, so nothing here needs to handle
 * long-name extensions, links or PAX headers.
 */
function extractFromTarGz(tarGz: Uint8Array<ArrayBuffer>, wanted: string): Uint8Array<ArrayBuffer> {
  const tar = Bun.gunzipSync(tarGz);
  const headerSize = 512;

  for (let offset = 0; offset + headerSize <= tar.length;) {
    const header = tar.subarray(offset, offset + headerSize);

    // A header of all NUL bytes marks the end of the archive.
    if (header.every((byte) => byte === 0)) break;

    const name = new TextDecoder().decode(header.subarray(0, 100)).replace(/\0.*$/, "");
    const size = Number.parseInt(
      new TextDecoder().decode(header.subarray(124, 136)).replace(/\0.*$/, "").trim(),
      8,
    );
    const typeFlag = String.fromCharCode(header[156]);

    const dataStart = offset + headerSize;
    const data = tar.subarray(dataStart, dataStart + size);

    // "0" is a regular file; everything else (directory, symlink, ...) is skipped.
    if (typeFlag === "0" && name === wanted) {
      return data;
    }

    // Payloads are padded to a 512-byte boundary.
    offset = dataStart + Math.ceil(size / headerSize) * headerSize;
  }

  throw new Error(`${wanted} is not present in the archive.`);
}

/** Verify a sha512 integrity string ("sha512-<base64>") against bytes. */
function verifyIntegrity(bytes: Uint8Array<ArrayBuffer>, integrity: string): void {
  const [algorithm, expected] = integrity.split("-");
  if (algorithm !== "sha512" || !expected) {
    throw new Error(`Unsupported integrity format: ${integrity}`);
  }
  const hasher = new Bun.CryptoHasher("sha512");
  hasher.update(bytes);
  const actual = hasher.digest("base64");
  if (actual !== expected) {
    throw new Error(
      `Integrity check failed.\n  expected sha512-${expected}\n  actual   sha512-${actual}`,
    );
  }
}

async function loadLock(): Promise<LockFile | null> {
  const path = join(import.meta.dir, "..", ".bun-lock.json");
  if (!existsSync(path)) return null;
  return (await Bun.file(path).json()) as LockFile;
}

async function saveLock(lock: LockFile): Promise<void> {
  const path = join(import.meta.dir, "..", ".bun-lock.json");
  await Bun.write(path, `${JSON.stringify(lock, null, 2)}\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const projectRoot = resolve(import.meta.dir, "..");
const version = (await Bun.file(join(projectRoot, ".bun-version")).text()).trim();
const platformPackage = currentPlatformPackage();
const lock = await loadLock();

console.log(`Bun ${version} → @oven/${platformPackage}`);

const metadata = (await fetch(`${REGISTRY}/@oven%2F${platformPackage}`).then((response) => {
  if (!response.ok) {
    throw new Error(`Registry lookup failed for @oven/${platformPackage}: HTTP ${response.status}`);
  }
  return response.json();
})) as { versions: Record<string, RegistryVersion> };

const release = metadata.versions[version];
if (!release) {
  throw new Error(
    `@oven/${platformPackage} has no version ${version}. The pinned Bun was never published for this platform.`,
  );
}

// The lockfile records the integrity of every platform tarball it knows about.
// A new platform is added the first time it is installed; after that the
// download is verified byte-for-byte against the recorded hash.
const expectedIntegrity = lock?.integrity?.[platformPackage];
const integrity = release.dist.integrity;
if (!integrity) {
  throw new Error(`The registry did not publish an integrity hash for ${version}.`);
}
if (expectedIntegrity && expectedIntegrity !== integrity) {
  throw new Error(
    `Integrity mismatch for @oven/${platformPackage}@${version}.\n` +
      `  locked   ${expectedIntegrity}\n` +
      `  registry ${integrity}\n` +
      `The published artifact changed. Delete .bun-lock.json and re-run to re-pin.`,
  );
}

// `--pin-all` records the hash of every platform Bun publishes, so a CI
// runner on a different platform verifies against a committed value instead
// of trusting the registry blindly.
const integrityMap: Record<string, string> = { ...lock?.integrity };
if (pinAll) {
  for (const packageName of Object.values(PLATFORM_PACKAGES)) {
    const versions = (await fetch(`${REGISTRY}/@oven%2F${packageName}`).then((response) => {
      if (!response.ok) {
        throw new Error(`Registry lookup failed for @oven/${packageName}: HTTP ${response.status}`);
      }
      return response.json();
    })) as { versions: Record<string, RegistryVersion> };

    const platformRelease = versions.versions[version];
    if (!platformRelease?.dist.integrity) {
      console.warn(`! @oven/${packageName} has no ${version} — skipping`);
      continue;
    }
    integrityMap[packageName] = platformRelease.dist.integrity;
  }
  console.log(`✓ recorded ${Object.keys(integrityMap).length} platform hashes`);
}

if (checkOnly) {
  console.log(`✓ registry integrity ${integrity.slice(0, 23)}… matches the lockfile`);
  process.exit(0);
}

const tarballResponse = await fetch(release.dist.tarball);
if (!tarballResponse.ok) {
  throw new Error(`Download failed: HTTP ${tarballResponse.status} for ${release.dist.tarball}`);
}
const tarball = new Uint8Array(await tarballResponse.arrayBuffer());

verifyIntegrity(tarball, integrity);

const binary = extractFromTarGz(tarball, TARBALL_BINARY);
const binDir = outputDir ?? join(projectRoot, ".bun", "bin");
const target = join(binDir, "bun");

mkdirSync(binDir, { recursive: true });

// Write to a sibling and rename into place. Opening the target for writing
// fails with ETXTBSY when the target is the binary currently running this
// script — which is exactly what happens in CI, where the installer
// replaces the bootstrap Bun that invoked it. A rename is atomic and
// replaces the directory entry, so the running process keeps its own
// (now unlinked) inode and the new binary is in place for the next exec.
const staging = join(binDir, `.bun.${process.pid}.staging`);
try {
  writeFileSync(staging, binary);
  chmodSync(staging, 0o755);
  renameSync(staging, target);
} catch (error) {
  rmSync(staging, { force: true });
  throw error;
}

// Ask the binary what it actually is. The npm publish version and the
// revision the binary reports are different strings — Bun's release pipeline
// publishes a dated canary version whose binary self-reports a "canary.N"
// counter — so the revision is what identifies the build in practice.
const probe = Bun.spawnSync([target, "--revision"], { stdout: "pipe" });
if (probe.exitCode !== 0) {
  throw new Error(`The installed binary did not run: ${probe.stderr.toString().trim()}`);
}
const revision = probe.stdout.toString().trim();

const nextLock: LockFile = {
  version,
  revision,
  integrity: { ...integrityMap, [platformPackage]: integrity },
};
await saveLock(nextLock);

console.log(`✓ installed ${target}`);
console.log(`  revision ${revision}`);
console.log(`  sha512   ${integrity.slice(0, 23)}…`);
