import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import * as builtChartxPackage from "../../dist/index.js";
import * as builtFocusedInspectorPackage from "../../dist/workbench-drawing-inspector.js";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

type PackageExport = {
  types?: string;
  svelte?: string;
  default?: string;
};

type PackageJson = {
  svelte?: string;
  types?: string;
  exports?: Record<string, PackageExport>;
};

describe("built package contract", () => {
  it("ships dist entrypoints for the root barrel and focused inspector seam", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(packageRoot, "package.json"), "utf8"),
    ) as PackageJson;

    expect(packageJson.svelte).toBe("./dist/index.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports?.["."]?.default).toBe("./dist/index.js");
    expect(packageJson.exports?.["."]?.svelte).toBe("./dist/index.js");
    expect(packageJson.exports?.["."]?.types).toBe("./dist/index.d.ts");
    expect(packageJson.exports?.["./workbench-drawing-inspector"]?.default).toBe(
      "./dist/workbench-drawing-inspector.js",
    );
    expect(packageJson.exports?.["./workbench-drawing-inspector"]?.svelte).toBe(
      "./dist/workbench-drawing-inspector.js",
    );
    expect(
      packageJson.exports?.["./workbench-drawing-inspector"]?.types,
    ).toBe("./dist/workbench-drawing-inspector.d.ts");

    expect(existsSync(path.join(packageRoot, "dist/index.js"))).toBe(true);
    expect(existsSync(path.join(packageRoot, "dist/index.d.ts"))).toBe(true);
    expect(
      existsSync(path.join(packageRoot, "dist/workbench-drawing-inspector.js")),
    ).toBe(true);
    expect(
      existsSync(path.join(packageRoot, "dist/workbench-drawing-inspector.d.ts")),
    ).toBe(true);

    expect(builtChartxPackage).toHaveProperty("ScriptExpressionBuilder");
    expect(builtChartxPackage).toHaveProperty("WorkbenchDrawingInspectorPanel");
    expect(builtFocusedInspectorPackage).toHaveProperty(
      "WorkbenchDrawingInspectorPanel",
    );
    expect(builtFocusedInspectorPackage).not.toHaveProperty("ReplayPanel");
  });
});
