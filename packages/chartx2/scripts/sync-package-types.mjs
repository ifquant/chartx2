import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
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

function rewriteRelativeJsSpecifiers(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      rewriteRelativeJsSpecifiers(entryPath);
      continue;
    }

    if (!entry.name.endsWith(".js")) {
      continue;
    }

    const source = readFileSync(entryPath, "utf8");
    const rewriteSpecifier = (specifier) => {
      if (path.extname(specifier) || specifier.endsWith("/")) {
        return specifier;
      }

      const absoluteBase = path.resolve(path.dirname(entryPath), specifier);
      if (existsSync(`${absoluteBase}.js`)) {
        return `${specifier}.js`;
      }
      if (existsSync(path.join(absoluteBase, "index.js"))) {
        return `${specifier}/index.js`;
      }
      return `${specifier}.js`;
    };

    const rewritten = source.replace(
      /((?:import|export)\s+(?:[^'"]*?\s+from\s+)?["'])(\.{1,2}\/[^"'?]+)(["'])/g,
      (_match, prefix, specifier, suffix) => {
        return `${prefix}${rewriteSpecifier(specifier)}${suffix}`;
      },
    ).replace(
      /(import\s*\(\s*["'])(\.{1,2}\/[^"'?]+)(["']\s*\))/g,
      (_match, prefix, specifier, suffix) => {
        return `${prefix}${rewriteSpecifier(specifier)}${suffix}`;
      },
    );

    if (rewritten !== source) {
      writeFileSync(entryPath, rewritten);
    }
  }
}

if (statSync(distRoot).isDirectory()) {
  rewriteRelativeJsSpecifiers(distRoot);
}
