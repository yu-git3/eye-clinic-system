import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteTemplate,
  blankTemplate,
  createSeedTemplates,
  filterTemplates,
  filterDepartments,
  filterServiceItems,
  moveIndicator,
  permissionLabel,
  validateTemplate,
  type CheckTemplate,
} from "./template-store.ts";

test("medical template requires an order service item", () => {
  const draft = { ...blankTemplate(), name: "角膜地形图", code: "CORNEA_TOPO" };
  assert.equal(validateTemplate(draft, []).serviceItem, "请选择服务项目");
});

test("a service item can only be linked to one medical template", () => {
  const existing = createSeedTemplates();
  const duplicate = { ...blankTemplate(), name: "角膜地形图复查", code: "CORNEA_TOPO_RECHECK", serviceItem: "角膜地形图", indicatorCodes: ["IOP"] };
  assert.equal(validateTemplate(duplicate, existing).serviceItem, "该服务项目已关联检查模板“角膜地形图”");
  assert.equal(validateTemplate(existing[1], existing, existing[1].code).serviceItem, undefined);
});

test("searches service items and departments by code or name", () => {
  assert.deepEqual(filterServiceItems("TOPO").map((item) => item.code), ["CORNEA_TOPO"]);
  assert.deepEqual(filterServiceItems("眼压").map((item) => item.code), ["IOP_EXAM"]);
  assert.deepEqual(filterDepartments("B-REF").map((item) => item.id), ["B-REF"]);
  assert.deepEqual(filterDepartments("视光").map((item) => item.id), ["A-OPT"]);
});

test("reorders selected indicators", () => {
  assert.deepEqual(moveIndicator(["IOP", "AL", "UCVA"], 1, -1), ["AL", "IOP", "UCVA"]);
  assert.deepEqual(moveIndicator(["IOP", "AL"], 0, -1), ["IOP", "AL"]);
});

test("doctor examination template does not require a service item", () => {
  const draft = { ...blankTemplate(), name: "裂隙灯检查", code: "SLIT_LAMP", type: "医生查体" as const };
  assert.equal(validateTemplate(draft, []).serviceItem, undefined);
});

test("empty department permissions means tenant-wide availability", () => {
  assert.equal(permissionLabel([]), "全部机构 / 全部科室");
  assert.equal(permissionLabel(["A-OPH", "B-OPT"]), "已选 2 个科室");
});

test("filters templates by name, type and status", () => {
  const item: CheckTemplate = { ...blankTemplate(), name: "眼压检查", code: "IOP_EXAM", serviceItem: "眼压检查", status: "启用", updatedAt: "2026-08-02" };
  assert.equal(filterTemplates([item], { keyword: "眼压", type: "医技检查", status: "启用" }).length, 1);
  assert.equal(filterTemplates([item], { keyword: "裂隙灯", type: "", status: "" }).length, 0);
});

test("only unused templates without historical instances can be deleted", () => {
  const items = createSeedTemplates();
  assert.equal(canDeleteTemplate(items[0]), false);
  assert.equal(canDeleteTemplate(items[2]), true);
  assert.equal(canDeleteTemplate({ ...items[2], hasHistoricalData: true }), false);
});
