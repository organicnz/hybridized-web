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

/**
 * An assignment to a name that says it holds a credential.
 *
 * The value may be quoted or bare: `const API_KEY = "…"` is how a credential
 * is written in code, and `API_KEY=…` is how it is written in an env file.
 * It does not run past the end of the line — the next statement is not part
 * of the value.
 */
const ASSIGNMENT = /([A-Z][A-Z0-9_]*)\s*=\s*["'`]?([^"'`#,)\n\r]{20,})["'`]?/g;

/**
 * The same thing in JSON, where the separator is a colon:
 * `"SUPABASE_ACCESS_TOKEN": "sbp_…"`.
 */
const JSON_FIELD = /"([A-Z][A-Z0-9_]*)"\s*:\s*"([^"]{20,})"/g;

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
 * The value itself, without the quotes or the punctuation around it.
 *
 * The same credential written as `KEY=value` and as `KEY = "value";` has to
 * produce the same digest, or the list of known leaks stops matching.
 */
function normalise(value: string): string {
  return value
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/[;,.]+$/, "");
}

/**
 * A credential-shaped value: long enough, not a placeholder, and mixed
 * enough that it is not prose.
 *
 * The test is *at least two* character classes, not three. A Supabase
 * personal access token is entirely lowercase — a `sbp_` prefix followed by
 * forty hex characters — and it would slip through a rule that wants mixed
 * case, and it is a real credential.
 */
function looksLikeSecret(value: string): boolean {
  const trimmed = normalise(value);
  if (trimmed.length < 20) return false;
  if (PLACEHOLDERS.test(trimmed)) return false;

  const classes = [/[a-z]/.test(trimmed), /[A-Z]/.test(trimmed), /\d/.test(trimmed)].filter(
    Boolean,
  ).length;

  return classes >= 2;
}

/**
 * A read of an environment variable.
 *
 * The value is not in the source — it is looked up at run time — so this is
 * never a credential. A test that saves the previous value of an env var to
 * restore it afterwards is an ordinary thing to write, and the rule below
 * would otherwise report it as a leak.
 */
const ENV_READ = /^(?:process|Bun)\.env(?:\.[A-Za-z_][A-Za-z0-9_]*|\[[^\]]+\])(?:\s*\?\?.*)?;?$/;

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
      digest: digestOf(normalise(match[1])),
      reachable,
    });
  }

  for (const match of text.matchAll(ASSIGNMENT)) {
    const [, name, value] = match;
    if (name.startsWith("NEXT_PUBLIC_")) continue;
    if (!SECRET_NAME.test(name)) continue;
    if (ENV_READ.test(value)) continue;
    if (!looksLikeSecret(value)) continue;
    findings.push({ path, what: name, digest: digestOf(normalise(value)), reachable });
  }

  for (const match of text.matchAll(JSON_FIELD)) {
    const [, name, value] = match;
    if (name.startsWith("NEXT_PUBLIC_")) continue;
    if (!SECRET_NAME.test(name)) continue;
    if (ENV_READ.test(value)) continue;
    if (!looksLikeSecret(value)) continue;
    findings.push({ path, what: name, digest: digestOf(normalise(value)), reachable });
  }

  return findings;
}

/** Run a git command and return its stdout. */
function git(args: string[], cwd?: string): string {
  const result = Bun.spawnSync({ cmd: ["git", ...args], cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`);
  }
  return result.stdout.toString();
}

/**
 * The blob objects, and the path each was last known by.
 *
 * By default this is the objects reachable from a *local* branch or from
 * `HEAD` — the things that could be pushed. The remote-tracking refs are
 * deliberately not included: they mirror what is already on the remote, and a
 * pre-push gate has to judge the history it is about to push, not the one it
 * is about to replace.
 *
 * `includeUnreferenced` adds the objects no ref points at any more, which is
 * where a secret in an amended commit ends up.
 */
export function blobObjects(
  options: { includeUnreferenced?: boolean; cwd?: string } = {},
): Map<string, { path: string; reachable: boolean }> {
  const paths = new Map<string, string>();
  for (const line of git(["rev-list", "--objects", "--branches", "HEAD"], options.cwd).split(
    "\n",
  )) {
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
    for (const line of git(
      ["cat-file", "--batch-all-objects", "--batch-check=%(objectname) %(objecttype)"],
      options.cwd,
    ).split("\n")) {
      const [sha, type] = line.split(" ");
      if (type !== "blob") continue;
      if (blobs.has(sha)) continue;
      blobs.set(sha, { path: paths.get(sha) ?? "(unreferenced)", reachable: false });
    }
  }

  return blobs;
}

/** The contents of every blob, keyed by sha. */
export function blobContents(shas: string[], cwd?: string): Map<string, string> {
  const contents = new Map<string, string>();
  if (shas.length === 0) return contents;

  const result = Bun.spawnSync({
    cmd: ["git", "cat-file", "--batch"],
    cwd,
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
  options: { includeUnreferenced?: boolean; cwd?: string } = {},
): SecretFinding[] {
  const blobs = blobObjects(options);
  const contents = blobContents([...blobs.keys()], options.cwd);

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
