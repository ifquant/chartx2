import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(repoRoot, "packages/chartx2");
const releaseRoot = "/Users/dev/workspace2/hc_apps/releases/chartx2";

mkdirSync(releaseRoot, { recursive: true });

// Local consumers should only ever see the latest chartx2 tarball, not stale pack output.
for (const entry of readdirSync(releaseRoot)) {
  if (entry.startsWith("chartx2-library-") && entry.endsWith(".tgz")) {
    rmSync(path.join(releaseRoot, entry));
  }
}

// Rebuild the publishable package first so the tarball matches the current dist surface.
execFileSync("pnpm", ["--filter", "@chartx2/library", "build"], {
  cwd: repoRoot,
  stdio: "inherit",
});

execFileSync("pnpm", ["pack", "--pack-destination", releaseRoot], {
  cwd: packageRoot,
  stdio: "inherit",
});
