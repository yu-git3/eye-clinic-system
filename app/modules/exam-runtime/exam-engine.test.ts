import assert from "node:assert/strict";
import test from "node:test";
import { createEyeHealthInstance, generateMedicalRecordText, reuseExamInstance, setFinding } from "./exam-engine.ts";

test("new eye health exam loads normal values but remains pending confirmation", () => {
  const exam = createEyeHealthInstance("V00000009340", "VISIT-20260802");
  assert.equal(exam.status, "待确认");
  assert.equal(exam.results.every((item) => item.od.status === "正常" && item.os.status === "正常"), true);
});

test("normal bilateral findings generate one concise bilateral description", () => {
  const text = generateMedicalRecordText(createEyeHealthInstance("P1", "V1"));
  assert.match(text, /^双眼：/);
  assert.match(text, /睑结膜无明显充血/);
  assert.match(text, /角膜清亮/);
});

test("a unilateral abnormality generates separate right and left descriptions", () => {
  const exam = setFinding(createEyeHealthInstance("P1", "V1"), "CORNEA", "od", "异常", "鼻下方散在点染");
  const text = generateMedicalRecordText(exam);
  assert.match(text, /右眼：.*角膜鼻下方散在点染/);
  assert.match(text, /左眼：.*角膜清亮/);
});

test("same visit and template reuses the existing exam instance", () => {
  const existing = createEyeHealthInstance("P1", "V1");
  assert.equal(reuseExamInstance([existing], "P1", "V1", "EYE_HEALTH_V1")?.id, existing.id);
  assert.equal(reuseExamInstance([existing], "P1", "V2", "EYE_HEALTH_V1"), undefined);
});
