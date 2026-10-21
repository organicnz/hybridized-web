import { describe, expect, it } from "bun:test";
import { mkdtemp } from "bun:fs/promises";
import { tmpdir } from "bun:os";
import { join } from "bun:path";
import {
  blobContents,
  blobObjects,
  findSecrets,
  findSecretsInHistory,
  partitionFindings,
} from "@/scripts/lib/secrets";

/**
 * The credential scanner.
 *
 * It is the gate that stands between a leaked key and the repository, so it
 * has to catch a real credential and it has to stay quiet about the ordinary
 * code around it. A false positive trains people to ignore the check, and a
 * false negative lets a key through.
 */

/** A value that is credential-shaped: long, mixed, and not a placeholder. */
const CREDENTIAL = "sbp_51f3a9c2b7e84d16a0f3c9e5b2d7a48c6";

describe("findSecrets", () => {
  it("catches a credential assigned to a name that says it holds one", () => {
    const findings = findSecrets("app/config.ts", `const SUPABASE_ACCESS_TOKEN = "${CREDENTIAL}";`);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.what).toBe("SUPABASE_ACCESS_TOKEN");
  });

  it("catches a credential in a bearer header", () => {
    const findings = findSecrets(
      "app/api/route.ts",
      `const headers = { Authorization: "Bearer ${CREDENTIAL}" };`,
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]?.what).toBe("a bearer token");
  });

  it("catches a credential in a JSON field", () => {
    const findings = findSecrets("config.json", `{ "VERCEL_API_KEY": "${CREDENTIAL}" }`);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.what).toBe("VERCEL_API_KEY");
  });

  it("catches a credential whatever the name of the file", () => {
    expect(findSecrets("README.md", `API_KEY=${CREDENTIAL}`)).toHaveLength(1);
  });

  it("ignores a read of an environment variable", () => {
    // A test that saves the previous value of an env var to restore it later
    // is ordinary code, and the value is not in the source.
    const findings = findSecrets(
      "tests/api.test.ts",
      "const ORIGINAL_SECRET = process.env.SYNC_SECRET;",
    );

    expect(findings).toEqual([]);
  });

  it("ignores a read of a bracketed environment variable", () => {
    expect(findSecrets("tests/api.test.ts", 'const ORIGINAL = process.env["MY_KEY"];')).toEqual([]);
  });

  it("ignores a public setting", () => {
    expect(findSecrets("app/config.ts", `const NEXT_PUBLIC_URL = "https://example.test";`)).toEqual(
      [],
    );
  });

  it("ignores a placeholder", () => {
    expect(findSecrets(".env.example", `SUPABASE_ACCESS_TOKEN=your-token-here`)).toEqual([]);
  });

  it("ignores a value that is too short to be a credential", () => {
    expect(findSecrets("app/config.ts", `API_KEY=short`)).toEqual([]);
  });

  it("ignores a name that does not say it holds a credential", () => {
    expect(findSecrets("app/config.ts", `MAX_UPLOAD_SIZE = "${CREDENTIAL}"`)).toEqual([]);
  });

  it("reports a digest, never the value", () => {
    const findings = findSecrets("app/config.ts", `const SUPABASE_ACCESS_TOKEN = "${CREDENTIAL}";`);

    expect(findings[0]?.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(findings)).not.toContain(CREDENTIAL);
  });

  it("gives the same digest for the same value", () => {
    const first = findSecrets("a.ts", `API_KEY="${CREDENTIAL}"`);
    const second = findSecrets("b.ts", `API_KEY="${CREDENTIAL}"`);

    expect(first[0]?.digest).toBe(second[0]?.digest);
  });

  it("gives the same digest whether the value is quoted or bare", () => {
    // The same credential written two ways has to produce one digest, or the
    // list of known leaks stops matching it.
    const quoted = findSecrets("a.ts", `API_KEY="${CREDENTIAL}"`);
    const bare = findSecrets("b.ts", `API_KEY=${CREDENTIAL};`);

    expect(quoted[0]?.digest).toBe(bare[0]?.digest);
  });

  it("does not sweep the next statement into the value", () => {
    const findings = findSecrets(
      "tests/api.test.ts",
      "const originalSecret = process.env.SYNC_SECRET;\n    }\n  }\n",
    );

    expect(findings).toEqual([]);
  });
});

describe("partitionFindings", () => {
  const finding = {
    path: "app/config.ts",
    what: "API_KEY",
    digest: "a".repeat(64),
    reachable: true,
  };

  it("separates a known leak from a new one", () => {
    const { known, unknown } = partitionFindings([finding], new Set([finding.digest]));

    expect(known).toHaveLength(1);
    expect(unknown).toEqual([]);
  });

  it("treats an unknown digest as a new leak", () => {
    const { known, unknown } = partitionFindings([finding], new Set());

    expect(known).toEqual([]);
    expect(unknown).toHaveLength(1);
  });
});

/**
 * A throwaway repository, so the history walk can be tested against a history
 * that is small and known.
 */
async function makeRepo(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "secrets-test-"));

  const run = (args: string[]): void => {
    const result = Bun.spawnSync({
      cmd: ["git", ...args],
      cwd: dir,
      stdout: "pipe",
      stderr: "pipe",
    });
    if (result.exitCode !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString().trim()}`);
    }
  };

  run(["init", "-q"]);
  run(["config", "user.email", "test@example.test"]);
  run(["config", "user.name", "Test"]);

  for (const [name, content] of Object.entries(files)) {
    await Bun.write(join(dir, name), content);
  }

  run(["add", "-A"]);
  run(["commit", "-q", "-m", "add the files"]);

  return dir;
}

describe("the history walk", () => {
  it("finds a credential that was committed", async () => {
    const dir = await makeRepo({ "config.ts": `const API_KEY = "${CREDENTIAL}";` });

    const findings = findSecretsInHistory({ cwd: dir });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.path).toBe("config.ts");
    expect(findings[0]?.reachable).toBe(true);
  });

  it("finds nothing in a clean repository", async () => {
    const dir = await makeRepo({ "config.ts": `const PUBLIC_URL = "https://example.test";` });

    expect(findSecretsInHistory({ cwd: dir })).toEqual([]);
  });

  it("finds a credential in an object no ref points at", async () => {
    const dir = await makeRepo({ "config.ts": "const PUBLIC_URL = 'https://example.test';" });

    // Stage a file with a credential, then unstage it: the blob is still in
    // the object store, but no commit points at it.
    await Bun.write(join(dir, "leaked.ts"), `const API_KEY = "${CREDENTIAL}";`);
    Bun.spawnSync({ cmd: ["git", "add", "leaked.ts"], cwd: dir });
    Bun.spawnSync({ cmd: ["git", "reset", "-q"], cwd: dir });

    const reachable = findSecretsInHistory({ cwd: dir });
    expect(reachable).toEqual([]);

    const all = findSecretsInHistory({ cwd: dir, includeUnreferenced: true });
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((finding) => !finding.reachable)).toBe(true);
  });

  it("lists the blobs a commit holds", async () => {
    const dir = await makeRepo({ "config.ts": "const PUBLIC_URL = 'https://example.test';" });

    const blobs = blobObjects({ cwd: dir });
    expect(blobs.size).toBeGreaterThan(0);

    const contents = blobContents([...blobs.keys()], dir);
    expect([...contents.values()].join("\n")).toContain("PUBLIC_URL");
  });
});
