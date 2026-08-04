import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function readAppSources(directory = new URL("../app/", import.meta.url)) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(entries.map(async (entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return readAppSources(url);
    return /\.(tsx?|css)$/.test(entry.name) ? readFile(url, "utf8") : "";
  }));
  return sources.join("\n");
}

test("the Vite entry and app sources expose the ophthalmology prototype shell", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const source = await readAppSources();
  assert.match(html, /<title>眼科专科系统高保真原型<\/title>/i);
  assert.match(source, /眼科专科系统/);
  assert.match(source, /指标定义/);
  assert.match(source, /检查模板/);
  assert.match(source, /门诊医生工作台/);
  assert.match(source, /角膜接触镜专科病历/);
  assert.match(source, /基本档案/);
  assert.match(source, /治疗跟踪/);
  assert.match(source, /建立档案/);
  assert.match(source, /电子病历系统/);
  assert.match(source, /专科人群管理/);
  assert.match(source, /临床指标定义/);
  assert.match(source, /检查模板配置/);
  assert.match(source, /检查报告/);
  assert.doesNotMatch(source, /医生录入|指标分类/);
  assert.doesNotMatch(source, /Your site is taking shape|codex-preview|react-loading-skeleton/);
});

test("exam reports are embedded in the doctor workspace instead of a standalone menu", async () => {
  const shell = await readFile(new URL("../app/OphthalmologyPrototype.tsx", import.meta.url), "utf8");
  const report = await readFile(new URL("../app/modules/exam-report/ExamReportModule.tsx", import.meta.url), "utf8");
  assert.match(shell, /doctor-report-float/);
  assert.match(shell, /当前患者报告/);
  assert.doesNotMatch(shell, /report: \{ label: "检查报告查询"/);
  assert.match(report, /当前接诊患者/);
  assert.doesNotMatch(report, /患者<input/);
  assert.match(report, /按就诊时间倒序/);
  assert.match(report, /按报告时间倒序/);
  assert.match(report, /搜索检查项目名称或编码/);
  assert.match(report, /已选检查项目/);
  assert.match(report, /默认全选/);
  assert.match(report, /全选/);
  assert.doesNotMatch(report, /选择项目|确认选择/);
  assert.match(report, /er-status-options/);
  assert.match(report, /本次就诊医嘱/);
  assert.match(report, /本次医生查体/);
  assert.match(report, /当日护士采集/);
  assert.match(report, /护士采集只读/);
  assert.match(report, /er-nursing-table/);
  assert.match(report, /采集人/);
  assert.match(report, /采集时间/);
  assert.match(report, /报告时间/);
  assert.match(report, /报告人/);
  assert.match(report, /执行科室/);
  assert.match(report, /指标结果/);
  assert.match(report, /查看原始报告/);
  assert.match(report, /er-pdf-viewer/);
  assert.match(report, /报告文件/);
  assert.match(report, /默认展示全部数值型指标/);
  assert.match(report, /point-value/);
  assert.match(report, /indicatorDefinition/);
  assert.doesNotMatch(report, /er-indicator-result-row/);
  assert.match(report, /er-card-meta-inline/);
  assert.match(report, /er-component-entry/);
  assert.match(report, /meta\.type===\"枚举型\"/);
  assert.match(report, /参考范围、单位及枚举值来自临床指标定义/);
  assert.match(report, /data-series-key/);
  assert.match(report, /er-trend-data/);
  assert.match(report, /编辑/);
  assert.doesNotMatch(report, /报告编号/);
  assert.doesNotMatch(report, /选择引用|引用此报告|当前引用候选/);
  assert.doesNotMatch(report, /er-project-filter/);
});

test("product documents expose the latest PRDs as online-only reading pages", async () => {
  const shell = await readFile(new URL("../app/OphthalmologyPrototype.tsx", import.meta.url), "utf8");
  const docs = await readFile(new URL("../app/modules/product-docs/ProductDocsModule.tsx", import.meta.url), "utf8");
  assert.match(shell, /产品文档/);
  assert.match(docs, /临床指标定义.*V1\.3/s);
  assert.match(docs, /检查模板配置.*V1\.2/s);
  assert.match(docs, /检查报告查询.*V1\.3/s);
  assert.match(docs, /治疗方案基础档案.*V1\.4/s);
  assert.match(docs, /角膜接触镜专科病历.*V1\.0/s);
  assert.match(docs, /在线阅读/);
  assert.match(docs, /<iframe/);
  assert.doesNotMatch(docs, /download|下载 DOCX|下载文档/);
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
  const source = await readFile(new URL("../app/OphthalmologyPrototype.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /原型入口|同一份档案，不同角色权限|门诊医生站 · 医生|人群管理 · 配镜师/);
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
  assert.doesNotMatch(source, /护士采集固定为文本型/);
  assert.doesNotMatch(source, /draft\.source === "护士采集"\}/);
  assert.match(source, /护理体征关联/);
  assert.match(source, />2<\/span>取值方式/);
  assert.match(source, />3<\/span>管理信息/);
  assert.ok(source.indexOf('label="眼别"') < source.indexOf('label="数据来源"'));
  assert.ok(source.indexOf('label="数据来源"') < source.indexOf('label="状态"'));
});

test("does not expose PACS as a standalone source option", async () => {
  const source = await readAppSources();
  assert.doesNotMatch(source, /<option[^>]*>PACS[^<]*<\/option>/i);
});
