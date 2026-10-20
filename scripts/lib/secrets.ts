/**
 * Credential detection, shared by the doctor and the history audit.
 *
 * The rules are deliberately narrow. A false positive in a check that runs
 * on every commit trains people to ignore it, so only values that are long,
 * mixed, and not obviously a placeholder are reported.
 */

/** The values that are placeholders rather than credentials. */
const PLACEHOLDERS = /^(your[-_]|xxx|<|changeme|example|placeholder|\.\.\.|todo|redacted)/i;

/** A `Bearer` header with a token in it. */
const BEARER = /Bearer\s+([A-Za-z0-9+/=_-]{20,})/g;

/** An assignment to a name that says it holds a credential. */
const ASSIGNMENT = /([A-Z][A-Z0-9_]*)\s*=\s*([^\s"'`#,)]{20,})/g;

/**
 * The names whose value is a credential rather than a public setting.
 *
 * `_KEY` is in the list: an API key is a credential, and the names that use
 * it (`*_SECRET_KEY`, `*_API_KEY`, `*_PRIVATE_KEY`) are exactly the ones
 * that leak.
 */
const SECRET_NAME = /_(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|KEY)$/;

/** Where a credential was found. */
export interface SecretFinding {
  /** The file the credential was in. */
  path: string;
  /** What it looked like — never the value itself. */
  what: string;
  /**
   * A digest of the value.
   *
   * It identifies the credential exactly, without putting it in the
   * repository: a file that lists digests can acknowledge a known leak
   * without recording the secret again.
   */
  digest: string;
  /**
   * Whether a commit in the history still points at this content.
   *
   * A credential that is only in an unreachable object was never in a
   * commit — it is what staging a file and then unstaging it leaves behind.
   * Git will prune it on its own.
   */
  reachable: boolean;
}

/** The sha256 of a value, as hex. */
function digestOf(value: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(value);
  return hasher.digest("hex");
}

/**
 * A credential-shaped value: long enough, not a placeholder, and mixed
 * enough that it is not prose.
 */
function looksLikeSecret(value: string): boolean {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (trimmed.length < 20) return false;
  if (PLACEHOLDERS.test(trimmed)) return false;
  return /[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed) && /\d/.test(trimmed);
}

/**
 * Every credential-shaped value in `text`.
 *
 * `NEXT_PUBLIC_*` is excluded: it is in the browser bundle by definition,
 * so it is public whether or not it looks like a secret.
 */
export function findSecrets(path: string, text: string, reachable = true): SecretFinding[] {
  const findings: SecretFinding[] = [];

  for (const match of text.matchAll(BEARER)) {
    if (!looksLikeSecret(match[1])) continue;
    findings.push({
      path,
      what: "a bearer token",
      digest: digestOf(match[1].trim()),
      reachable,
    });
  }

  for (const match of text.matchAll(ASSIGNMENT)) {
    const [, name, value] = match;
    if (name.startsWith("NEXT_PUBLIC_")) continue;
    if (!SECRET_NAME.test(name)) continue;
    if (!looksLikeSecret(value)) continue;
    findings.push({ path, what: name, digest: digestOf(value.trim()), reachable });
  }

  return findings;
}

/** Run a git command and return its stdout. */
function git(args: string[]): string {
  const result = Bun.spawnSync({ cmd: ["git", ...args], stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`);
  }
  return result.stdout.toString();
}

/**
 * The blob objects, and the path each was last known by.
 *
 * By default this is the objects every ref reaches — the history as it
 * stands. `includeUnreferenced` adds the objects no ref points at any more,
 * which is where a secret in an amended commit ends up.
 *
 * The distinction matters: staging a file and then unstaging it leaves a
 * dangling blob, so a scan of *every* object reports a credential for
 * something that was never committed.
 */
export function blobObjects(
  options: { includeUnreferenced?: boolean } = {},
): Map<string, { path: string; reachable: boolean }> {
  const paths = new Map<string, string>();
  for (const line of git(["rev-list", "--objects", "--all"]).split("\n")) {
    const space = line.indexOf(" ");
    if (space === -1) continue;
    paths.set(line.slice(0, space), line.slice(space + 1));
  }

  const blobs = new Map<string, { path: string; reachable: boolean }>();

  // The reachable objects, and the path each was last known by.
  for (const [sha, path] of paths) {
    blobs.set(sha, { path, reachable: true });
  }

  if (options.includeUnreferenced) {
    for (const line of git([
      "cat-file",
      "--batch-all-objects",
      "--batch-check=%(objectname) %(objecttype)",
    ]).split("\n")) {
      const [sha, type] = line.split(" ");
      if (type !== "blob") continue;
      if (blobs.has(sha)) continue;
      blobs.set(sha, { path: paths.get(sha) ?? "(unreferenced)", reachable: false });
    }
  }

  return blobs;
}

/** The contents of every blob, keyed by sha. */
export function blobContents(shas: string[]): Map<string, string> {
  const contents = new Map<string, string>();
  if (shas.length === 0) return contents;

  const result = Bun.spawnSync({
    cmd: ["git", "cat-file", "--batch"],
    stdin: Buffer.from(`${shas.join("\n")}\n`),
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(`git cat-file --batch failed: ${result.stderr.toString().trim()}`);
  }

  const buffer = result.stdout;
  let offset = 0;

  while (offset < buffer.length) {
    const newline = buffer.indexOf(10, offset);
    if (newline === -1) break;
    const header = buffer.subarray(offset, newline).toString("utf8");
    const parts = header.split(" ");
    const sha = parts[0];
    const size = Number(parts[2]);
    if (!sha || Number.isNaN(size)) break;

    const start = newline + 1;
    contents.set(sha, buffer.subarray(start, start + size).toString("utf8"));
    offset = start + size + 1; // the content is followed by a newline
  }

  return contents;
}

/**
 * Every credential in the history of the repository.
 *
 * The reachable history by default. `includeUnreferenced` also covers the
 * objects no ref points at any more — a secret in an amended commit, or in
 * a file that was staged and then unstaged.
 */
export function findSecretsInHistory(
  options: { includeUnreferenced?: boolean } = {},
): SecretFinding[] {
  const blobs = blobObjects(options);
  const contents = blobContents([...blobs.keys()]);

  const findings: SecretFinding[] = [];
  const seen = new Set<string>();

  for (const [sha, text] of contents) {
    const { path, reachable } = blobs.get(sha) ?? { path: "(unreferenced)", reachable: false };
    for (const finding of findSecrets(path, text, reachable)) {
      const key = `${finding.path} (${finding.what})`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push(finding);
    }
  }

  return findings;
}

/**
 * The digests of the credentials that are already known.
 *
 * They are recorded by digest rather than by value, so the file that
 * acknowledges a leak does not put the leak back into the repository.
 */
export async function knownSecretDigests(): Promise<Set<string>> {
  const file = (await Bun.file("scripts/known-secret-digests.json")
    .json()
    .catch(() => ({ known: [] }))) as { known?: { digest?: string }[] };

  return new Set(file.known?.map((entry) => entry.digest ?? "") ?? []);
}

/** A finding, and whether it is a leak that is already known. */
export interface PartitionedFindings {
  /** A leak that is already known and is being rotated. */
  known: SecretFinding[];
  /** A leak that is new. */
  unknown: SecretFinding[];
}

/** Split the findings into the ones that are known and the ones that are not. */
export function partitionFindings(
  findings: SecretFinding[],
  knownDigests: Set<string>,
): PartitionedFindings {
  const known: SecretFinding[] = [];
  const unknown: SecretFinding[] = [];

  for (const finding of findings) {
    if (knownDigests.has(finding.digest)) known.push(finding);
    else unknown.push(finding);
  }

  return { known, unknown };
}
