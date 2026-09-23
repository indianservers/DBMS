import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist");

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(full) : [full];
    }),
  );
  return nested.flat();
}

const files = (await filesIn(output))
  .filter((file) => !file.endsWith(`${path.sep}sw.js`))
  .sort();
const paths = files.map((file) =>
  path.relative(output, file).split(path.sep).join("/"),
);
const hash = createHash("sha256");
hash.update(await readFile(new URL(import.meta.url)));
for (const file of files) {
  hash.update(path.relative(output, file));
  hash.update(await readFile(file));
}
const version = hash.digest("hex").slice(0, 12);
const source = `/* Generated at build time. No server-side application processing. */
const CACHE = "dbms-studio-${version}";
const ASSETS = ${JSON.stringify(paths)};
const scope = self.registration.scope;
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map((asset) => new URL(asset, scope).href));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("dbms-studio-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(scope)) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(new URL("index.html", scope).href)) || Response.error();
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
`;
await writeFile(path.join(output, "sw.js"), source);
console.log(`Generated offline cache for ${paths.length} files (${version}).`);
