import assert from "node:assert/strict";
import test from "node:test";
import { buildOutpatientRecordText, createHistorySeeds, createSpecialtyRecordSeed, examTemplateCatalog, filterExamTemplates, removeSelectedExam, recommendFollowUpDate, validateSpecialtyRecord } from "./specialty-record-store.ts";

test("recommends the next follow-up from the active treatment rule", () => {
  assert.deepEqual(recommendFollowUpDate("2026-08-02", 3), {
    date: "2026-11-02",
    rule: "上次复诊后3个月",
  });
});

test("history summaries expose the facts doctors scan first", () => {
  const history = createHistorySeeds();
  assert.equal(history[0].visitDate, "2026-02-12");
  assert.match(history[0].complaintSummary, /裸眼.*OD.*OS/);
  assert.match(history[0].examSummary, /角膜/);
  assert.match(history[0].planSummary, /眼轴|复查/);
});

test("outpatient record text follows the South Medical ophthalmology order", () => {
  const record = createSpecialtyRecordSeed();
  const text = buildOutpatientRecordText(record);
  assert.ok(text.indexOf("主诉：") < text.indexOf("现病史："));
  assert.ok(text.indexOf("现病史：") < text.indexOf("专科检查："));
  assert.ok(text.indexOf("专科检查：") < text.indexOf("处理建议："));
  assert.match(text, /复诊安排：2026-11-02/);
});

test("saving requires complaint and specialty assessment", () => {
  const record = createSpecialtyRecordSeed();
  assert.deepEqual(validateSpecialtyRecord({ ...record, complaint: "", assessment: "" }), {
    complaint: "请填写主诉",
    assessment: "请填写专科检查摘要",
  });
});

test("exam template picker searches by code or name", () => {
  assert.deepEqual(filterExamTemplates("TOPO").map((item) => item.name), ["角膜地形图"]);
  assert.deepEqual(filterExamTemplates("眼表").map((item) => item.code), ["EYE_SURFACE"]);
});

test("exam templates do not expose a template-level eye rule", () => {
  assert.equal(examTemplateCatalog.some((item) => "eyes" in item), false);
});

test("only manually added unsaved exams can be removed", () => {
  const selected = [
    { name: "角膜地形图", origin: "本次医嘱" as const, saved: false },
    { name: "眼表综合报告", origin: "医生添加" as const, saved: false },
    { name: "角膜内皮", origin: "医生添加" as const, saved: true },
  ];
  assert.deepEqual(removeSelectedExam(selected, "角膜地形图"), selected);
  assert.deepEqual(removeSelectedExam(selected, "角膜内皮"), selected);
  assert.deepEqual(removeSelectedExam(selected, "眼表综合报告").map((item) => item.name), ["角膜地形图", "角膜内皮"]);
});
