import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runPnpmScript(scriptName) {
  execFileSync("pnpm", [scriptName], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

runPnpmScript("check");
runPnpmScript("test:unit");
runPnpmScript("release:local:failure-test");
runPnpmScript("release:local:verify");
