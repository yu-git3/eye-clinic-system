import test from "node:test"; import assert from "node:assert/strict"; import { indicatorDefinition, trendPoints, visibleReports, visits } from "./report-store.ts";
test("filters reports and keeps only structured numeric results in trends", () => { assert.equal(visibleReports(["角膜地形图"], "已出报告").length, 8); assert.equal(trendPoints("角膜地形图", "Ks曲率", "OD").length, 8); assert.equal(trendPoints("眼轴长度", "眼轴长度", "OD").length, 0); });
test("report indicators reuse type and reference metadata", () => { assert.equal(indicatorDefinition({name:"眼压",unit:"mmHg"}).referenceRange,"10～21mmHg"); assert.deepEqual(indicatorDefinition({name:"角膜"}).options?.slice(0,2),["清亮","散在点染"]); });
test("visit records show diagnosis instead of initial or follow-up type", () => {
  assert.ok(visits.every((visit) => visit.diagnosis.length > 0));
  assert.ok(visits.every((visit) => !("type" in visit)));
  assert.ok(visits.every((visit) => !/初诊|复诊/.test(visit.diagnosis)));
});
