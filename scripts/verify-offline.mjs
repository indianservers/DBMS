import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile("dist/sw.js", "utf8");
const events = new Map();
const entries = new Map();
const scope = "http://127.0.0.1:13874/";
const cache = {
  async addAll(urls) {
    for (const url of urls) {
      const relative = new URL(url).pathname.slice(1);
      entries.set(new URL(url).href, {
        name: relative,
        body: await readFile(`dist/${relative}`),
      });
    }
  },
  async match(request) {
    return entries.get(
      new URL(
        typeof request === "string" ? request : request.url ?? request.href,
      ).href,
    );
  },
};
const caches = {
  async open() {
    return cache;
  },
  async match(request) {
    return cache.match(request);
  },
  async keys() {
    return ["dbms-studio-test"];
  },
  async delete() {
    return true;
  },
};
const self = {
  registration: { scope },
  location: { origin: new URL(scope).origin },
  clients: { claim: async () => undefined },
  skipWaiting: async () => undefined,
  addEventListener(name, callback) {
    events.set(name, callback);
  },
};
vm.runInNewContext(source, {
  self,
  caches,
  URL,
  fetch: async () => {
    throw new Error("Network disconnected");
  },
  Response: { error: () => ({ name: "error" }) },
});
let pending;
events.get("install")({ waitUntil: (promise) => (pending = promise) });
await pending;
assert(entries.has(`${scope}index.html`));
assert([...entries.keys()].some((key) => key.endsWith(".wasm")));
assert([...entries.keys()].some((key) => key.includes("worker-")));

function offlineFetch(url, mode) {
  let response;
  events.get("fetch")({
    request: { method: "GET", url, mode },
    respondWith: (value) => (response = value),
  });
  return response;
}
const navigation = await offlineFetch(`${scope}some/page`, "navigate");
assert.equal(navigation.name, "index.html");
const assetUrl = [...entries.keys()].find((key) => key.endsWith(".wasm"));
assert.equal((await offlineFetch(assetUrl, "same-origin")).name, assetUrl.slice(scope.length));
console.log(`Offline navigation and asset lookup passed (${entries.size} files cached).`);
