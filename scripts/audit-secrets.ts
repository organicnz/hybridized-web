#!/usr/bin/env bun
/**
 * Audit the whole git history for credentials.
 *
 * A secret that was committed once is in the history forever, and a
 * repository is public. Removing it from the file does not remove it from
 * the commits — the only fix is to rotate the credential. So the question is
 * not "is the working tree clean" but "was a credential ever committed",
 * and that means looking at every object the repository has ever held.
 *
 * This walks every blob the repository contains — reachable commits and
 * unreferenced leftovers alike — and reports the credential-shaped strings
 * in them. The value is never printed, only where it was.
 *
 * How a finding is treated:
 *
 *   - in a commit that could be pushed, and not known → **fails**. It is in
 *     the history, and it would be on the remote and in every clone.
 *   - in a commit, and known → reported. It is recorded in
 *     `scripts/known-secret-digests.json` and is being rotated.
 *   - only in an unreachable object → reported. Staging a file and unstaging
 *     it leaves one of these behind; git prunes it on its own.
 *
 * `bun run doctor` runs the same check over the working tree and over the
 * reachable history.
 *
 * Usage: bun scripts/audit-secrets.ts
 */
import { findSecretsInHistory, knownSecretDigests, partitionFindings } from "./lib/secrets";

console.log("▸ walking every object in the repository");

// The deep scan: the objects no ref points at any more as well, which is
// where a secret in an amended commit ends up. The doctor only looks at the
// reachable history, because staging a file and unstaging it leaves a
// dangling blob and a credential that was never committed.
const findings = findSecretsInHistory({ includeUnreferenced: true });
const knownDigests = await knownSecretDigests();
const { known, unknown } = partitionFindings(findings, knownDigests);

const describe = (finding: { path: string; what: string }): string =>
  `${finding.path} (${finding.what})`;

// A finding in a commit that could be pushed fails, whether it is known or
// not: the history was rewritten to take it out, so putting it back makes it
// live again.
const committed = findings.filter((finding) => finding.reachable);
const unreachable = unknown.filter((finding) => !finding.reachable);

if (committed.length > 0) {
  console.error(`\n✗ ${committed.length} credential-shaped value(s) in the history:`);
  for (const finding of committed) {
    const tag = knownDigests.has(finding.digest) ? " — a known leak, still being rotated" : "";
    console.error(`  ${describe(finding)}${tag}`);
  }
  console.error(
    "\n  Removing these from the files is not enough — the values are in the commits.\n" +
      "  Rotate the credentials, then rewrite the history if the repository is public.",
  );
  process.exit(1);
}

if (known.length > 0) {
  console.log(`\n! ${known.length} known leak(s) still in the history:`);
  for (const finding of known) {
    console.log(`  ${describe(finding)}`);
  }
  console.log("  These are recorded in scripts/known-secret-digests.json and are being rotated.");
}

if (unreachable.length > 0) {
  console.log(`\n! ${unreachable.length} credential-shaped value(s) in unreachable objects:`);
  for (const finding of unreachable) {
    console.log(`  ${describe(finding)}`);
  }
  console.log("  No commit points at these — git will prune them on its own.");
}

console.log("\n✓ no new credential in any commit that could be pushed");
