import type { RequestHandler } from "./$types";

const PUBLIC_ENTRY_PATH = "/Users/dev/workspace2/hc_apps/chartx2/src/lib/chartx/public/index.ts";

export const GET: RequestHandler = async () => {
  const moduleSource = `export * from "/@fs/${PUBLIC_ENTRY_PATH}";`;

  return new Response(moduleSource, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
