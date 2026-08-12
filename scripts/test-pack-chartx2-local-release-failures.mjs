import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packScript = path.join(repoRoot, "scripts/pack-chartx2-local-release.mjs");
const releaseRoot = mkdtempSync(path.join(tmpdir(), "chartx2-pack-failure-test-"));
const packageMetadata = JSON.parse(readFileSync(path.join(repoRoot, "packages/chartx2/package.json"), "utf8"));
// Derive the filename from the publish authority so a version bump cannot make
// the failure-path test protect a stale artifact while the packer writes another.
const artifactName = `chartx2-library-${packageMetadata.version}.tgz`;
const artifactPath = path.join(releaseRoot, artifactName);

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function assertNoStagingResidue(stage) {
  const residue = readdirSync(releaseRoot).filter((entry) => entry.startsWith(".pack-"));
  if (residue.length !== 0) {
    throw new Error(`${stage} left staging residue: ${residue.join(", ")}`);
  }
}

function runPack(testEnvironment = {}) {
  execFileSync("node", [packScript], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CHARTX2_LOCAL_RELEASE_ROOT: releaseRoot,
      ...testEnvironment,
    },
    stdio: "pipe",
  });
}

function expectFailure(stage, testEnvironment, expectedMessage, originalHash) {
  let failure;
  try {
    runPack(testEnvironment);
  } catch (error) {
    failure = error;
  }

  if (failure === undefined) {
    throw new Error(`${stage} unexpectedly published an artifact`);
  }

  const output = `${failure.stdout ?? ""}${failure.stderr ?? ""}`;
  if (!output.includes(expectedMessage)) {
    throw new Error(`${stage} failed for an unexpected reason: ${output}`);
  }
  if (sha256(artifactPath) !== originalHash) {
    throw new Error(`${stage} changed the prior artifact after failure`);
  }
  assertNoStagingResidue(stage);
}

try {
  // The fixture is deliberately not a valid package. Every failed attempt must
  // leave these exact bytes untouched before the later success proof replaces it.
  writeFileSync(artifactPath, "known-good-prior-artifact\n");
  const originalHash = sha256(artifactPath);

  expectFailure(
    "build failure",
    { CHARTX2_RELEASE_TEST_FAIL_BEFORE_BUILD: "1" },
    "Injected build failure",
    originalHash,
  );
  expectFailure(
    "mutated lifecycle barrel failure",
    { CHARTX2_RELEASE_TEST_MUTATE_LIFECYCLE_BARREL: "1" },
    "market-chart-lifecycle",
    originalHash,
  );

  runPack();
  if (sha256(artifactPath) === originalHash) {
    throw new Error("successful release did not replace the prior artifact");
  }
  assertNoStagingResidue("successful release");
  console.log("Verified chartx2 local release failure cleanup and atomic replacement");
} finally {
  rmSync(releaseRoot, { recursive: true, force: true });
}
