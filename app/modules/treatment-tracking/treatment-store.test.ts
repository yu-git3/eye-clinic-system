import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrderDraft,
  createReplacementDraft,
  groupOrdersByBrand,
  setBrandMode,
  updateEyeBrand,
} from "./treatment-store.ts";

test("默认双眼同品牌并生成一张订单", () => {
  const draft = createOrderDraft();
  assert.equal(draft.brandMode, "same");
  assert.deepEqual(draft.selectedEyes, ["OD", "OS"]);
  assert.equal(groupOrdersByBrand(draft).length, 1);
  assert.deepEqual(groupOrdersByBrand(draft)[0].eyes, ["OD", "OS"]);
});

test("切换左右眼不同品牌时复制原品牌参数", () => {
  const draft = setBrandMode(createOrderDraft(), "different");
  assert.equal(draft.eyeConfigs.OD.brandId, draft.eyeConfigs.OS.brandId);
  assert.notEqual(draft.eyeConfigs.OD, draft.eyeConfigs.OS);
});

test("左右眼不同品牌自动拆成两张订单", () => {
  let draft = setBrandMode(createOrderDraft(), "different");
  draft = updateEyeBrand(draft, "OS", "dreamlite");
  assert.equal(groupOrdersByBrand(draft).length, 2);
  assert.deepEqual(groupOrdersByBrand(draft).map((item) => item.eyes), [["OD"], ["OS"]]);
});

test("单眼换片只生成被选眼订单", () => {
  const draft = createReplacementDraft("OD");
  assert.deepEqual(draft.selectedEyes, ["OD"]);
  assert.equal(groupOrdersByBrand(draft).length, 1);
  assert.deepEqual(groupOrdersByBrand(draft)[0].eyes, ["OD"]);
});

test("双眼异品牌换片默认保留当前各眼品牌", () => {
  const draft = createReplacementDraft("BOTH", {
    OD: "crt",
    OS: "dreamlite",
  });
  assert.equal(draft.brandMode, "different");
  assert.equal(draft.eyeConfigs.OD.brandId, "crt");
  assert.equal(draft.eyeConfigs.OS.brandId, "dreamlite");
  assert.equal(groupOrdersByBrand(draft).length, 2);
});
