import { execFileSync } from "node:child_process";

const rootDeclarationEntry = "package/dist/index.d.ts";
const rootRuntimeEntry = "package/dist/index.js";
const publicDeclarationEntry = "package/dist/public/index.d.ts";
const publicRuntimeEntry = "package/dist/public/index.js";
const lifecycleDeclarationEntry = "package/dist/public/market-chart-lifecycle.d.ts";

function readTarballEntry(tarballPath, entry) {
  try {
    return execFileSync("tar", ["-xOzf", tarballPath, entry], { encoding: "utf8" });
  } catch (error) {
    throw new Error(`Packed chartx2 artifact is missing ${entry}: ${error.message}`, { cause: error });
  }
}

function requireExport(source, expectedExport, entry) {
  if (!source.includes(expectedExport)) {
    throw new Error(
      `Packed chartx2 ${entry} is missing required public export ${expectedExport}`,
    );
  }
}

/**
 * Verify the declarations and runtime barrels actually placed in a tarball.
 *
 * `svelte-package` creates declarations in a generated tree and this project then
 * copies them into dist. Checking only src would therefore let an old same-name
 * tgz masquerade as a release of the current public seam.
 */
export function assertPackedChartx2LifecycleBarrel(tarballPath) {
  const rootDeclaration = readTarballEntry(tarballPath, rootDeclarationEntry);
  const rootRuntime = readTarballEntry(tarballPath, rootRuntimeEntry);
  const publicDeclaration = readTarballEntry(tarballPath, publicDeclarationEntry);
  const publicRuntime = readTarballEntry(tarballPath, publicRuntimeEntry);
  const lifecycleDeclaration = readTarballEntry(tarballPath, lifecycleDeclarationEntry);

  requireExport(rootDeclaration, 'export * from "./public/index.js";', rootDeclarationEntry);
  requireExport(rootRuntime, 'export * from "./public/index.js";', rootRuntimeEntry);
  requireExport(
    publicDeclaration,
    'export * from "./market-chart-lifecycle";',
    publicDeclarationEntry,
  );
  requireExport(
    publicRuntime,
    'export * from "./market-chart-lifecycle.js";',
    publicRuntimeEntry,
  );
  requireExport(
    publicDeclaration,
    'export * from "./market-chart-surface";',
    publicDeclarationEntry,
  );
  requireExport(
    publicRuntime,
    'export * from "./market-chart-surface.js";',
    publicRuntimeEntry,
  );
  requireExport(
    lifecycleDeclaration,
    "export type PhaseOneMarketChartTimeFocusCommandV1",
    lifecycleDeclarationEntry,
  );
  requireExport(
    lifecycleDeclaration,
    "export type PhaseOneMarketChartTimeFocusCompletionV1",
    lifecycleDeclarationEntry,
  );

  return {
    publicDeclaration,
    publicRuntime,
  };
}

/**
 * Keep the missing-export failure shape executable as a negative check. The
 * assertion must reject a declaration barrel with the lifecycle re-export removed.
 */
export function assertLifecycleDeclarationOmissionIsRejected(publicDeclaration) {
  const staleDeclaration = publicDeclaration.replace(
    'export * from "./market-chart-lifecycle";\n',
    "",
  );

  if (staleDeclaration === publicDeclaration) {
    throw new Error("Lifecycle barrel negative fixture did not remove its expected export");
  }

  let rejected = false;
  try {
    requireExport(
      staleDeclaration,
      'export * from "./market-chart-lifecycle";',
      publicDeclarationEntry,
    );
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error("Lifecycle barrel checker accepted the missing-export shape");
  }
}
