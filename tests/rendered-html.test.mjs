import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the ophthalmology prototype shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>眼科专科系统高保真原型<\/title>/i);
  assert.match(html, /眼科专科系统/);
  assert.match(html, /临床指标定义/);
  assert.match(html, /新增指标/);
  assert.match(html, /护士采集/);
  assert.match(html, /医生录入/);
  assert.match(html, /医技检查/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("does not expose PACS as a standalone source option", async () => {
  const response = await render();
  const html = await response.text();
  assert.doesNotMatch(html, /<option[^>]*>PACS[^<]*<\/option>/i);
});
