import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "packages/chartx2");
const releaseRoot = "/Users/dev/workspace2/hc_apps/releases/chartx2";

mkdirSync(releaseRoot, { recursive: true });
const stagingRoot = mkdtempSync(path.join(releaseRoot, ".pack-"));

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

// Only replace the published tarball after build and pack succeed, so a failed attempt
// does not delete the last usable local release artifact.
for (const entry of readdirSync(releaseRoot)) {
  if (entry.startsWith("chartx2-library-") && entry.endsWith(".tgz")) {
    rmSync(path.join(releaseRoot, entry));
  }
}

renameSync(
  path.join(stagingRoot, stagedTarballs[0]),
  path.join(releaseRoot, stagedTarballs[0]),
);
rmSync(stagingRoot, { recursive: true, force: true });
