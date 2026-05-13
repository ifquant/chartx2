import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = "/Users/dev/workspace2/hc_apps/build/chartx2";

function newestLocalTarball() {
  const tarballs = readdirSync(releaseRoot)
    .filter((entry) => entry.startsWith("chartx2-library-") && entry.endsWith(".tgz"))
    .map((entry) => {
      const tarballPath = path.join(releaseRoot, entry);
      return {
        entry,
        path: tarballPath,
        mtimeMs: statSync(tarballPath).mtimeMs,
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs || left.entry.localeCompare(right.entry));

  if (tarballs.length === 0) {
    throw new Error(`No chartx2 library tarball found in ${releaseRoot}`);
  }

  return tarballs[0].path;
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

const consumerRoot = mkdtempSync(path.join(tmpdir(), "chartx2-release-consumer-"));

try {
  run("node", [path.join(repoRoot, "scripts/pack-chartx2-local-release.mjs")], {
    cwd: repoRoot,
  });

  const tarballPath = newestLocalTarball();

  writeFileSync(
    path.join(consumerRoot, "package.json"),
    JSON.stringify(
      {
        name: "chartx2-local-release-consumer-smoke",
        private: true,
        type: "module",
        dependencies: {
          "@chartx2/library": `file:${tarballPath}`,
          "@sveltejs/vite-plugin-svelte": "5.1.1",
          svelte: "5.55.1",
          typescript: "5.6.3",
          vite: "6.4.1",
        },
      },
      null,
      2,
    ) + "\n",
  );

  // Install from a temp directory outside the workspace so the probe exercises the
  // packaged tarball boundary instead of workspace linking or local source files.
  run("pnpm", ["install", "--ignore-scripts", "--reporter", "append-only"], {
    cwd: consumerRoot,
  });

  writeFileSync(
    path.join(consumerRoot, "probe.mjs"),
    `import { svelte } from "@sveltejs/vite-plugin-svelte";
import { createServer } from "vite";

function assertExport(exportsObject, exportName, packageName) {
  if (!(exportName in exportsObject)) {
    throw new Error(\`\${packageName} does not export \${exportName}\`);
  }
}

const server = await createServer({
  logLevel: "error",
  plugins: [svelte()],
  root: process.cwd(),
  server: { middlewareMode: true },
});

try {
  const rootExports = await server.ssrLoadModule("@chartx2/library");
  const drawingInspectorExports = await server.ssrLoadModule(
    "@chartx2/library/workbench-drawing-inspector",
  );

  assertExport(rootExports, "ChartFrameShell", "@chartx2/library");
  assertExport(
    drawingInspectorExports,
    "WorkbenchDrawingInspectorPanel",
    "@chartx2/library/workbench-drawing-inspector",
  );
} finally {
  await server.close();
}
`,
  );

  writeFileSync(
    path.join(consumerRoot, "type-probe.ts"),
    `import { ChartFrameShell } from "@chartx2/library";
import { WorkbenchDrawingInspectorPanel } from "@chartx2/library/workbench-drawing-inspector";

const rootComponent = ChartFrameShell;
const inspectorComponent = WorkbenchDrawingInspectorPanel;

void rootComponent;
void inspectorComponent;
`,
  );

  writeFileSync(
    path.join(consumerRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          allowJs: true,
          checkJs: false,
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
          types: ["svelte"],
        },
        include: ["type-probe.ts"],
      },
      null,
      2,
    ) + "\n",
  );

  run("node", ["probe.mjs"], { cwd: consumerRoot });
  run("pnpm", ["exec", "tsc", "--noEmit"], { cwd: consumerRoot });
  console.log(`Verified chartx2 local release consumer install: ${tarballPath}`);
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
