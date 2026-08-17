import assert from "node:assert/strict";
import test from "node:test";
import { changeTreatmentMethod, completeArchive, createArchiveSeed, createArchiveSeeds, createMethodStageDetails, referenceCheckReport, reopenArchive, reviseCheckValue, startTreatmentCycle, terminateArchive, validateArchiveDraft, validateBaseline } from "./archive-store.ts";

test("archive requires treatment plan, method and responsible doctor", () => {
  assert.deepEqual(validateArchiveDraft({ treatmentPlan: "", treatmentMethod: "", responsibleDoctor: "" }), {
    treatmentPlan: "请选择治疗方案",
    treatmentMethod: "请选择治疗方式",
    responsibleDoctor: "请选择责任医生",
  });
});

test("baseline completion reports missing required sections", () => {
  const archive = createArchiveSeed();
  assert.deepEqual(validateBaseline({ ...archive.baseline, purpose: "", doctorConclusion: "" }), {
    purpose: "请填写戴镜目的",
    doctorConclusion: "请填写医生评估结论",
  });
});

test("changing OK lens to RGP preserves the previous treatment stage", () => {
  const archive = createArchiveSeed();
  const changed = changeTreatmentMethod(archive, {
    nextMethod: "RGP",
    effectiveDate: "2026-08-02",
    reason: "角膜条件变化，调整治疗方式",
    doctor: "方红全",
    assessmentStrategy: "沿用近期检查并补充评估",
  });
  assert.equal(changed.currentTreatmentMethod, "RGP");
  assert.equal(changed.methodHistory.length, 2);
  assert.equal(changed.methodHistory[0].method, "OK镜");
  assert.equal(changed.methodHistory[0].endedAt, "2026-08-02");
  assert.equal(changed.methodHistory[1].method, "RGP");
  assert.match(changed.timeline.at(-1)?.title ?? "", /OK镜 → RGP/);
});

test("treatment stage details are newest first and retain linked clinical records", () => {
  const changed = changeTreatmentMethod(createArchiveSeed(), {
    nextMethod: "RGP",
    effectiveDate: "2026-08-20",
    reason: "治疗效果调整",
    doctor: "方红全",
    assessmentStrategy: "沿用近期检查并补充评估",
  });
  const details = createMethodStageDetails(changed);
  assert.deepEqual(details.map((item) => item.method), ["RGP", "OK镜"]);
  assert.equal(details[0].status, "当前使用");
  assert.equal(details[0].endedAt, undefined);
  assert.equal(details[1].endedAt, "2026-08-20");
  assert.equal(details[1].reason, "建档时确定");
  assert.ok(details.every((item) => item.records.length > 0));
  assert.ok(details.every((item) => item.dispositions.length > 0));
  assert.ok(details.every((item) => item.examinations.length > 0));
  assert.ok(details.every((item) => item.treatmentEvents.length > 0));
});

test("treatment plan retains its baseline template association", () => {
  const archive = createArchiveSeed();
  assert.deepEqual(archive.baselineTemplate, {
    id: "CL_BASELINE_V1",
    name: "角膜接触镜基础档案基线模板",
    version: "1.0",
  });
});

test("editing an imported check value preserves the original and revision trace", () => {
  const archive = createArchiveSeed();
  const changed = reviseCheckValue(archive, {
    group: "眼生物测量",
    item: "眼轴长度",
    eye: "od",
    value: "25.40",
    revisedBy: "方红全",
    revisedAt: "2026-08-02 11:20",
  });
  const row = changed.checks.find((group) => group.group === "眼生物测量")?.rows.find((item) => item.item === "眼轴长度");
  assert.equal(row?.od, "25.40");
  assert.equal(row?.originalOd, "25.34");
  assert.deepEqual(row?.revision, { revisedBy: "方红全", revisedAt: "2026-08-02 11:20" });
  assert.equal(archive.checks.find((group) => group.group === "眼生物测量")?.rows.find((item) => item.item === "眼轴长度")?.od, "25.34");
});

test("OK lens baseline auto-loads the nine confirmed examination components", () => {
  const archive = createArchiveSeed();
  assert.deepEqual(archive.checks.map((item) => item.group), [
    "视力与眼压", "眼健康检查", "眼前节与瞳孔", "角膜地形图", "眼生物测量",
    "角膜内皮", "眼表综合报告", "散瞳医学验光", "小瞳医学验光",
  ]);
  const topo = archive.checks.find((item) => item.group === "角膜地形图")!;
  assert.deepEqual(topo.rows.map((item) => item.item), ["睑裂高度", "眼睑张力", "Ks曲率", "Ks轴位", "MinK曲率", "MinK轴位"]);
  assert.ok(!archive.checks.find((item) => item.group === "眼健康检查")?.rows.some((item) => ["睑裂高度","眼睑张力"].includes(item.item)));
  assert.ok(!topo.rows.some((item) => /K2|ΔK|E值/.test(item.item)));
});

test("the same patient cannot create the same treatment-plan archive twice", () => {
  const archives = createArchiveSeeds();
  const errors = validateArchiveDraft({
    treatmentPlan: "角膜接触镜标准治疗方案",
    treatmentMethod: "OK镜",
    responsibleDoctor: "方红全",
    createdAt: "2026-08-02 10:42",
    note: "",
  }, archives, "V00000009340");
  assert.equal(errors.treatmentPlan, "该患者已有该治疗方案档案");
});

test("different treatment plans can coexist for one patient", () => {
  const archives = createArchiveSeeds();
  assert.equal(archives.length, 3);
  assert.deepEqual(archives.map((item) => item.treatmentPlan), ["角膜接触镜标准治疗方案", "视功能训练方案", "近视综合干预方案"]);
});

test("prototype examples cover active completed and terminated-then-reopened plans", () => {
  const archives = createArchiveSeeds();
  assert.equal(archives[0].status, "治疗中");
  assert.equal(archives[1].status, "已完成");
  assert.equal(archives[2].status, "治疗中");
  assert.ok(archives[2].cycleClosures.some((item) => item.result === "已终止"));
  assert.equal(archives[2].cycleNumber, 2);
  assert.equal(archives[2].baselineVersions.length, 2);
});

test("population example contains a previous and current treatment method", () => {
  const archive = createArchiveSeeds()[0];
  assert.deepEqual(archive.methodHistory.map((item) => item.method), ["软性离焦镜", "OK镜"]);
  assert.equal(archive.methodHistory[0].endedAt, "2026-08-02");
});

test("termination and reopening preserve the archive while creating a new cycle", () => {
  const archive = createArchiveSeed();
  const terminated = terminateArchive(archive, { endedAt: "2026-08-20 10:00", reason: "患者暂停治疗", operator: "方红全" });
  assert.equal(terminated.status, "已终止");
  const reopened = reopenArchive(terminated, { startedAt: "2026-09-01 09:00", reason: "患者恢复治疗", operator: "方红全", baselineAction: "重新建立基础档案", rebuildMode: "复制上一版本" });
  assert.equal(reopened.status, "基本档案待完成");
  assert.equal(reopened.cycleNumber, 2);
  assert.equal(reopened.id, archive.id);
  assert.match(reopened.timeline.at(-1)?.title ?? "", /重新开启/);
  assert.equal(reopened.baseline.status, "评估中");
  assert.equal(reopened.baselineVersions.length, 2);
  assert.equal(reopened.baselineVersions[0].status, "历史版本");
  assert.equal(reopened.treatmentCycles.at(-1)?.baselineVersionId, reopened.currentBaselineVersionId);
  assert.equal(reopened.cycleClosures[0].result, "已终止");
});

test("completion records date operator and conclusion before reopening", () => {
  const archive = createArchiveSeed();
  archive.status = "治疗中";
  archive.baseline.status = "已完成";
  const completed = completeArchive(archive, { completedAt: "2026-08-20 10:00", conclusion: "治疗目标已达到", operator: "方红全" });
  assert.equal(completed.status, "已完成");
  assert.deepEqual(completed.cycleClosures[0], { cycleNumber: 1, result: "已完成", endedAt: "2026-08-20 10:00", operator: "方红全", conclusion: "治疗目标已达到" });
  const reopened = reopenArchive(completed, { startedAt: "2026-09-01 09:00", reason: "再次开展治疗", operator: "方红全", baselineAction: "沿用当前基础档案" });
  assert.equal(reopened.status, "治疗中");
  assert.equal(reopened.baseline.status, "已完成");
  assert.equal(reopened.baselineVersions.length, 1);
  assert.equal(reopened.treatmentCycles.at(-1)?.baselineVersionId, archive.currentBaselineVersionId);
});

test("normal lens replacement creates a cycle and keeps the same baseline version", () => {
  const archive = createArchiveSeed();
  const next = startTreatmentCycle(archive, { startedAt: "2027-08-02 09:00", type: "到期换片" });
  assert.equal(next.cycleNumber, 2);
  assert.equal(next.currentBaselineVersionId, archive.currentBaselineVersionId);
  assert.equal(next.baselineVersions.length, 1);
  assert.equal(next.treatmentCycles[1].baselineVersionId, archive.currentBaselineVersionId);
});

test("referencing another report updates the result and keeps citation audit", () => {
  const archive = createArchiveSeed();
  const changed = referenceCheckReport(archive, "角膜地形图", {
    reportId: "PACS-20260801-5501",
    checkedAt: "2026-08-01 14:20",
    reporterName: "李明",
    reportedAt: "2026-08-01 14:38",
    status: "已报告",
    odSummary: "Ks 43.70D@82°",
    osSummary: "Ks 43.51D@158°",
  }, "方红全", "2026-08-02 11:30");
  const topo = changed.checks.find((item) => item.group === "角膜地形图")!;
  assert.equal(topo.reportId, "PACS-20260801-5501");
  assert.equal(topo.citationHistory?.at(-1)?.operator, "方红全");
});
