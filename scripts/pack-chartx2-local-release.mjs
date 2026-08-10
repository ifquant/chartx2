import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPackedChartx2LifecycleBarrel } from "./verify-packed-chartx2-barrel.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "packages/chartx2");
const releaseRoot = process.env.CHARTX2_LOCAL_RELEASE_ROOT
  ?? "/Users/dev/workspace2/hc_apps/build/chartx2";

function mutateStagedLifecycleDeclarationForFailureTest(stagedTarballPath, stagingRoot) {
  const mutationRoot = mkdtempSync(path.join(stagingRoot, ".verify-mutation-"));

  try {
    execFileSync("tar", ["-xzf", stagedTarballPath, "-C", mutationRoot]);
    const declarationPath = path.join(
      mutationRoot,
      "package/dist/public/index.d.ts",
    );
    const declaration = readFileSync(declarationPath, "utf8");
    const mutatedDeclaration = declaration.replace(
      'export * from "./market-chart-lifecycle";\n',
      "",
    );

    if (mutatedDeclaration === declaration) {
      throw new Error("Failure test could not remove the staged lifecycle declaration export");
    }

    writeFileSync(declarationPath, mutatedDeclaration);
    execFileSync("tar", ["-czf", stagedTarballPath, "-C", mutationRoot, "package"]);
  } finally {
    rmSync(mutationRoot, { recursive: true, force: true });
  }
}

mkdirSync(releaseRoot, { recursive: true });
const stagingRoot = mkdtempSync(path.join(releaseRoot, ".pack-"));

try {
  // This test-only hook exercises cleanup after the staging directory exists but
  // before a build can produce a new artifact. It is only used with an isolated
  // release root by the failure-path script below.
  if (process.env.CHARTX2_RELEASE_TEST_FAIL_BEFORE_BUILD === "1") {
    throw new Error("Injected build failure for local release cleanup verification");
  }

  // Rebuild the publishable package first so the tarball matches the current dist surface.
  execFileSync("pnpm", ["--filter", "@chartx2/library", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  execFileSync("pnpm", ["pack", "--pack-destination", stagingRoot], {
    cwd: packageRoot,
    stdio: "inherit",
  });

  const stagedTarballs = readdirSync(stagingRoot).filter(
    (entry) => entry.startsWith("chartx2-library-") && entry.endsWith(".tgz"),
  );

  if (stagedTarballs.length !== 1) {
    throw new Error(
      `Expected exactly one staged chartx2 tarball, found ${stagedTarballs.length}`,
    );
  }

  const stagedTarball = path.join(stagingRoot, stagedTarballs[0]);
  if (process.env.CHARTX2_RELEASE_TEST_MUTATE_LIFECYCLE_BARREL === "1") {
    mutateStagedLifecycleDeclarationForFailureTest(stagedTarball, stagingRoot);
  }

  // `dist/` is generated and the release filename does not change for every
  // source revision. Verify the staged archive itself before it can replace the
  // prior artifact; source-barrel checks cannot prove this package payload.
  assertPackedChartx2LifecycleBarrel(stagedTarball);

  // stagingRoot and releaseRoot share a parent directory, so rename is an atomic
  // replacement on this filesystem. The old same-name artifact stays in place
  // until build, pack, and payload verification have all succeeded.
  renameSync(stagedTarball, path.join(releaseRoot, stagedTarballs[0]));

  // A version change can leave a differently named prior tarball. Remove those
  // only after the verified new artifact has become the published artifact.
  for (const entry of readdirSync(releaseRoot)) {
    if (
      entry !== stagedTarballs[0]
      && entry.startsWith("chartx2-library-")
      && entry.endsWith(".tgz")
    ) {
      rmSync(path.join(releaseRoot, entry));
    }
  }
} finally {
  // Every failed stage must be recoverable: retain the prior artifact and remove
  // only the exact per-run staging directory, never the broader release root.
  rmSync(stagingRoot, { recursive: true, force: true });
}
