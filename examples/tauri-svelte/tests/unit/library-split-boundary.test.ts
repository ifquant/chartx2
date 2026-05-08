import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const textExtensions = new Set([".js", ".ts", ".svelte", ".md"]);
const skippedDirectories = new Set([
  ".svelte-kit",
  "build",
  "dist",
  "node_modules",
  "playwright-report",
  "target",
  "test-results",
]);

function repoPath(...segments: string[]): string {
  return path.join(repoRoot, ...segments);
}

function toRepoPath(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

function readRepoFile(relativePath: string): string {
  return readFileSync(repoPath(relativePath), "utf8");
}

function listTextFiles(relativeRoot: string): string[] {
  const absoluteRoot = repoPath(relativeRoot);
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const files: string[] = [];
  const walk = (absoluteDirectory: string) => {
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) {
          walk(absolutePath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (textExtensions.has(path.extname(entry.name))) {
        files.push(toRepoPath(absolutePath));
      }
    }
  };

  walk(absoluteRoot);
  return files.sort();
}

function listTopLevelMarkdownFiles(relativeRoot: string): string[] {
  const absoluteRoot = repoPath(relativeRoot);
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  return readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name) === ".md")
    .map((entry) => `${relativeRoot}/${entry.name}`)
    .sort();
}

describe("chartx2 library split boundary", () => {
  it("keeps active docs and source free of stale pre-split public paths", () => {
    // This is intentionally a repo-level boundary guard, even though it runs in
    // the example package unit suite, so active docs fail with stale split paths.
    const activeBoundaryFiles = [
      "AGENTS.md",
      "README.md",
      ...listTopLevelMarkdownFiles("docs"),
      "examples/tauri-svelte/src/routes/chartx/public/+server.ts",
      "packages/chartx2/src/lib/internal/foundation.ts",
    ];
    const staleFragments = [
      "src/lib/chartx/public",
      "src/lib/chartx/internal",
      "src/lib/demo",
    ];

    for (const relativePath of activeBoundaryFiles) {
      const source = readRepoFile(relativePath);
      for (const staleFragment of staleFragments) {
        expect(
          source,
          `${relativePath} must not contain ${staleFragment}`,
        ).not.toContain(staleFragment);
      }
    }
  });

  it("keeps internal library imports inside example-owned demo controllers", () => {
    const internalImportFiles = listTextFiles("examples/tauri-svelte/src").filter(
      (relativePath) => readRepoFile(relativePath).includes("@chartx2/library/internal"),
    );

    expect(internalImportFiles).toEqual([
      "examples/tauri-svelte/src/lib/example-app/chartx-demo.ts",
      "examples/tauri-svelte/src/lib/example-app/performance-demo.ts",
    ]);
  });
});
