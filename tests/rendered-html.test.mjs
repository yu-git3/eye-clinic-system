import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /指标定义/);
  assert.match(html, /检查模板/);
  assert.match(html, /门诊医生工作台/);
  assert.match(html, /角膜接触镜专科病历/);
  assert.match(html, /基本档案/);
  assert.match(html, /治疗跟踪/);
  assert.match(html, /建立档案/);
  assert.match(html, /电子病历系统/);
  assert.match(html, /专科人群管理/);
  assert.match(html, /临床指标定义/);
  assert.match(html, /检查模板配置/);
  assert.doesNotMatch(html, /医生录入|指标分类/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("baseline supports report-assisted manual editing", async () => {
  const source = await readFile(
    new URL("../app/modules/contact-lens-archive/ContactLensArchiveModule.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /查看原始报告/);
  assert.match(source, /valueOrigin/);
  assert.match(source, /onRevise/);
  assert.match(source, /接口原值/);
  assert.match(source, /档案基线模板|基本档案模板/);
});

test("specialty record exposes the reusable ophthalmology examination component", async () => {
  const source = await readFile(
    new URL("../app/modules/contact-lens-archive/ContactLensArchiveModule.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /添加眼科检查/);
  assert.match(source, /选择检查模板/);
  const panel = await readFile(
    new URL("../app/modules/exam-runtime/ExamEntryPanel.tsx", import.meta.url),
    "utf8",
  );
  assert.match(panel, /双眼全部正常/);
  assert.match(panel, /复制OD到OS/);
  assert.match(panel, /病历描述预览/);
  assert.match(panel, /保存并回传门诊病历/);
});

test("archive prototype covers lifecycle, switching and report citation", async () => {
  const source = await readFile(
    new URL("../app/modules/contact-lens-archive/ContactLensArchiveModule.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /档案切换器/);
  assert.match(source, /终止档案/);
  assert.match(source, /重新开启/);
  assert.match(source, /引用报告结果/);
  assert.match(source, /当前就诊机构 \/ 科室（权限上下文）/);
  assert.match(source, /建档日期/);
  assert.match(source, /备注/);
});

test("doctor-facing archive language and specialty record follow the approved workflow", async () => {
  const archiveSource = await readFile(
    new URL("../app/modules/contact-lens-archive/ContactLensArchiveModule.tsx", import.meta.url),
    "utf8",
  );
  const recordSource = await readFile(
    new URL("../app/modules/specialty-record/SpecialtyRecordModule.tsx", import.meta.url),
    "utf8",
  );
  assert.match(recordSource, /编辑基本档案/);
  assert.match(recordSource, /基本档案待完成/);
  assert.match(recordSource, /当前镜片信息/);
  assert.match(recordSource, /历史专科病历/);
  assert.match(recordSource, /新建专科病历/);
  assert.match(recordSource, /就诊日期/);
  assert.match(recordSource, /sr-record-drawer/);
  assert.match(recordSource, /引用上次记录/);
  assert.match(recordSource, /添加眼科检查/);
  assert.match(recordSource, /搜索检查模板名称或编码/);
  assert.match(recordSource, /添加选中/);
  assert.match(recordSource, /已添加/);
  assert.match(recordSource, /本次医嘱/);
  assert.match(recordSource, /推荐随访时间/);
  assert.match(recordSource, /普通门诊病历回传预览/);
});

test("doctor workspace does not contain the old prototype shortcut bar", async () => {
  const response = await render();
  const html = await response.text();
  assert.doesNotMatch(html, /原型入口|同一份档案，不同角色权限|门诊医生站 · 医生|人群管理 · 配镜师/);
});

test("query conditions omit data type and indicator category", async () => {
  const source = await readFile(
    new URL("../app/modules/clinical-indicator/ClinicalIndicatorModule.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /filters\.type|指标分类/);
  assert.match(source, /placeholder="请输入单位，如 mmHg"/);
  assert.match(source, /\["OD", "OS", "OU", "无眼别"\]/);
  assert.doesNotMatch(source, /hi\.his\.exam\.ind|ctr1/);
  assert.doesNotMatch(source, /配置内容紧随数据类型展示/);
  assert.ok(source.indexOf('label="参考范围"') < source.indexOf('label="眼别"'));
  assert.match(source, /<option>多选枚举<\/option>/);
  assert.match(source, /<option>布尔型<\/option>/);
  assert.match(source, /真值显示名称/);
  assert.match(source, /假值显示名称/);
  assert.match(source, /新增指标/);
  assert.match(source, /护士采集/);
  assert.match(source, /医生查体/);
  assert.match(source, /医技检查/);
});

test("does not expose PACS as a standalone source option", async () => {
  const response = await render();
  const html = await response.text();
  assert.doesNotMatch(html, /<option[^>]*>PACS[^<]*<\/option>/i);
});
