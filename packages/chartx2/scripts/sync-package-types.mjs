import { cpSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = path.join(packageRoot, ".svelte-kit/__package__");
const distRoot = path.join(packageRoot, "dist");

function copyTypes(sourceDirectory, targetDirectory) {
  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const targetPath = path.join(targetDirectory, entry.name);

    if (entry.isDirectory()) {
      copyTypes(sourcePath, targetPath);
      continue;
    }

    if (
      entry.name.endsWith(".d.ts") ||
      entry.name.endsWith(".d.ts.map") ||
      entry.name.endsWith(".svelte.d.ts")
    ) {
      mkdirSync(path.dirname(targetPath), { recursive: true });
      cpSync(sourcePath, targetPath);
    }
  }
}

copyTypes(generatedRoot, distRoot);
