import { createRequire } from "node:module";

import type { RequestHandler } from "./$types";

const require = createRequire(import.meta.url);
const publicEntryPath = require.resolve("@chartx2/library");

export const GET: RequestHandler = async () => {
  const moduleSource = `export * from "/@fs/${publicEntryPath}";`;

  return new Response(moduleSource, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
