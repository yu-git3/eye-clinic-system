import test from "node:test";
import assert from "node:assert/strict";
import {
  canDeleteIndicator,
  createSeedIndicators,
  filterIndicators,
  paginateIndicators,
  toggleEnumSelection,
  toggleIndicatorStatus,
  validateIndicator,
  type IndicatorDraft,
} from "./indicator-store.ts";
import * as store from "./indicator-store.ts";

const emptyFilters = {
  keyword: "",
  source: "",
  status: "",
};

test("seed data uses the approved sources and has no category field", () => {
  const allowed = new Set(["护士采集", "医生查体", "医技检查"]);
  assert.equal(createSeedIndicators().every((item) => allowed.has(item.source)), true);
  assert.equal(createSeedIndicators().every((item) => !("category" in item)), true);
});

test("filters indicators by a combined name or code keyword", () => {
  const items = createSeedIndicators();
  assert.deepEqual(filterIndicators(items, { ...emptyFilters, keyword: "眼压" }).map((item) => item.code), ["IOP"]);
  assert.deepEqual(filterIndicators(items, { ...emptyFilters, keyword: "iop" }).map((item) => item.code), ["IOP"]);
  assert.deepEqual(filterIndicators(items, { ...emptyFilters, keyword: "眼", source: "医技检查", status: "启用" }).map((item) => item.code), ["IOP", "AL"]);
});

test("derives required source mappings from source and eye rule", () => {
  const requiredMappingKeys = (store as unknown as {
    requiredMappingKeys?: (source: string, eyeRule: string) => string[];
  }).requiredMappingKeys;
  assert.equal(typeof requiredMappingKeys, "function");
  assert.deepEqual(requiredMappingKeys?.("护士采集", ["OD", "OS"]), ["OD", "OS"]);
  assert.deepEqual(requiredMappingKeys?.("护士采集", ["OD", "OS", "OU"]), ["OD", "OS", "OU"]);
  assert.deepEqual(requiredMappingKeys?.("护士采集", ["无眼别"]), ["无眼别"]);
  assert.deepEqual(requiredMappingKeys?.("医技检查", ["OD", "OU"]), ["OD", "OU"]);
  assert.deepEqual(requiredMappingKeys?.("医生查体", ["OD", "OS"]), []);
});

test("paginates results and clamps out-of-range pages", () => {
  const result = paginateIndicators(createSeedIndicators(), 99, 2);
  assert.equal(result.page, result.pageCount);
  assert.equal(result.items.length > 0, true);
  assert.deepEqual(paginateIndicators([], 4, 10), {
    items: [],
    total: 0,
    page: 1,
    pageCount: 1,
  });
});

test("rejects unapproved data sources", () => {
  const draft = {
    name: "眼压2",
    code: "IOP_NEW",
    type: "数值型",
    unit: "mmHg",
    eyeRule: ["OD", "OS"],
    source: "PACS/设备回传",
    status: "启用",
    description: "",
    referenced: false,
    numeric: { decimals: 0, min: 5, max: 40 },
  } as unknown as IndicatorDraft;
  const errors = validateIndicator(draft, createSeedIndicators());
  assert.equal(errors.source, "请选择护士采集、医生查体或医技检查");
});

test("rejects duplicate codes and inverted numeric ranges", () => {
  const draft: IndicatorDraft = {
    name: "重复眼压",
    code: "IOP",
    type: "数值型",
    unit: "mmHg",
    eyeRule: ["OD", "OS"],
    source: "医技检查",
    status: "启用",
    description: "",
    referenced: false,
    numeric: { decimals: 0, min: 40, max: 5 },
  };
  const errors = validateIndicator(draft, createSeedIndicators());
  assert.equal(Boolean(errors.code), true);
  assert.equal(Boolean(errors.numericRange), true);
});

test("accepts hierarchical indicator codes and rejects malformed dots", () => {
  const base = { ...createSeedIndicators()[0], name: "Ks轴位", code: "OPH.TOPO.KS.AXIS", referenced: false } as IndicatorDraft;
  assert.equal(validateIndicator(base, createSeedIndicators()).code, undefined);
  assert.equal(Boolean(validateIndicator({ ...base, code: "OPH..KS" }, createSeedIndicators()).code), true);
  assert.equal(Boolean(validateIndicator({ ...base, code: "OPH.KS." }, createSeedIndicators()).code), true);
});

test("rejects combining no-eye with a specific eye", () => {
  const draft = {
    ...createSeedIndicators()[0],
    code: "INVALID_EYE_RULE",
    eyeRule: ["无眼别", "OD"],
  } as IndicatorDraft;
  assert.equal(validateIndicator(draft, createSeedIndicators()).eyeRule, "无眼别不能与其他眼别同时选择");
});

test("requires an enabled enum item and unique enum codes", () => {
  const draft: IndicatorDraft = {
    name: "角膜状态2",
    code: "CORNEA_STATUS_2",
    type: "枚举型",
    unit: "",
    eyeRule: ["OD", "OS"],
    source: "医生查体",
    status: "启用",
    description: "",
    referenced: false,
    enumItems: [
      { code: "NORMAL", name: "正常", externalCode: "N", order: 1, status: "停用" },
      { code: "NORMAL", name: "异常", externalCode: "A", order: 2, status: "停用" },
    ],
  };
  const errors = validateIndicator(draft, createSeedIndicators());
  assert.equal(Boolean(errors.enumItems), true);
});

test("requires nurse dictionary mappings for each selected eye", () => {
  const errors = validateIndicator({
    name: "裸眼视力2",
    code: "UCVA_2",
    type: "文本型",
    unit: "",
    eyeRule: ["OD", "OS"],
    source: "护士采集",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "0.8～1.5",
    text: { maxLength: 50 },
    nursingMapping: { OD: "VS_UCVA_OD", OS: "" },
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(Boolean(errors.nursingMapping), true);
});

test("limits text indicators to 200 characters", () => {
  const base = {
    name: "检查备注2", code: "EXAM_NOTE_2", type: "文本型", unit: "", eyeRule: ["无眼别"],
    source: "医生查体", status: "启用", description: "", referenced: false,
  } as IndicatorDraft;
  assert.equal(validateIndicator({ ...base, text: { maxLength: 200 } }, createSeedIndicators()).maxLength, undefined);
  assert.equal(validateIndicator({ ...base, text: { maxLength: 201 } }, createSeedIndicators()).maxLength, "最大长度须为1至200");
});

test("switching to nurse collection preserves the selected data type", () => {
  const transitionSource = (store as unknown as {
    transitionIndicatorSource?: (draft: IndicatorDraft, source: IndicatorDraft["source"]) => IndicatorDraft;
  }).transitionIndicatorSource;
  assert.equal(typeof transitionSource, "function");
  const numeric = createSeedIndicators()[0];
  const changed = transitionSource?.(numeric, "护士采集");
  assert.equal(changed?.type, "数值型");
  assert.deepEqual(changed?.numeric, numeric.numeric);
  assert.deepEqual(changed?.nursingMapping, {});
  assert.equal(changed?.externalMapping, undefined);
});

test("rejects duplicate medical fields for OD and OS", () => {
  const errors = validateIndicator({
    name: "眼压2",
    code: "IOP_2",
    type: "数值型",
    unit: "mmHg",
    eyeRule: ["OD", "OS"],
    source: "医技检查",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "10～21",
    numeric: { decimals: 0, min: 5, max: 60 },
    externalMapping: { OD: "IOP_VALUE", OS: "IOP_VALUE" },
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(Boolean(errors.externalMapping), true);
});

test("allows medical indicators to omit eye field mappings", () => {
  const draft = createSeedIndicators()[0];
  const errors = validateIndicator({ ...draft, externalMapping: { OD: "", OS: "" } }, []);
  assert.equal(errors.externalMapping, undefined);
});

test("rejects duplicate enum external mapping codes for medical indicators", () => {
  const errors = validateIndicator({
    name: "检查状态",
    code: "EXAM_STATUS",
    type: "枚举型",
    unit: "",
    eyeRule: ["无眼别"],
    source: "医技检查",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "",
    externalMapping: { 无眼别: "EXAM_STATUS" },
    enumItems: [
      { code: "NORMAL", name: "正常", externalCode: "N", order: 1, status: "启用" },
      { code: "ABNORMAL", name: "异常", externalCode: "N", order: 2, status: "启用" },
    ],
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(Boolean(errors.enumExternalCode), true);
});

test("allows medical enum and boolean value mappings to be left blank", () => {
  const enumErrors = validateIndicator({
    name: "检查状态",
    code: "OPH.EXAM.STATUS",
    type: "枚举型",
    unit: "",
    eyeRule: ["无眼别"],
    source: "医技检查",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "",
    externalMapping: { 无眼别: "" },
    enumItems: [
      { code: "NORMAL", name: "正常", externalCode: "", order: 1, status: "启用", nature: 0, isDefault: true, allowsText: false },
      { code: "ABNORMAL", name: "异常", externalCode: "", order: 2, status: "启用", nature: 1, isDefault: false, allowsText: false },
    ],
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(enumErrors.enumExternalCode, undefined);

  const booleanErrors = validateIndicator({
    name: "是否水肿",
    code: "OPH.HAS_EDEMA",
    type: "布尔型",
    unit: "",
    eyeRule: ["OD"],
    source: "医技检查",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "",
    externalMapping: { OD: "" },
    boolean: { trueLabel: "是", falseLabel: "否", trueExternalCode: "", falseExternalCode: "" },
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(booleanErrors.booleanExternalCodes, undefined);
});

test("applies enum validation to multi-select enum indicators", () => {
  const errors = validateIndicator({
    name: "伴随症状",
    code: "SYMPTOMS",
    type: "多选枚举",
    unit: "",
    eyeRule: ["无眼别"],
    source: "医生查体",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "",
    enumItems: [],
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(errors.enumItems, "请至少添加一个枚举项");
});

test("derives normal-abnormal quick entry from enum value nature", () => {
  const mode = (store as unknown as {
    enumInteractionMode?: (items: IndicatorDraft["enumItems"]) => string;
  }).enumInteractionMode;
  assert.equal(typeof mode, "function");
  assert.equal(mode?.([
    { code: "NORMAL", name: "清亮", externalCode: "", order: 1, status: "启用", nature: 0, isDefault: true, allowsText: false },
    { code: "STAIN", name: "点染", externalCode: "", order: 2, status: "启用", nature: 1, isDefault: false, allowsText: false },
  ]), "正常/异常快捷录入");
});

test("multi-select enum makes any concrete result and no-nature mutually exclusive", () => {
  const items = [
    { code: "NORMAL", name: "正常", externalCode: "", order: 1, status: "启用", nature: 0, isDefault: false, allowsText: false },
    { code: "ABNORMAL", name: "异常", externalCode: "", order: 2, status: "启用", nature: 1, isDefault: false, allowsText: false },
    { code: "NONE", name: "无", externalCode: "", order: 3, status: "启用", nature: 2, isDefault: false, allowsText: false },
  ] as IndicatorDraft["enumItems"];
  assert.deepEqual(toggleEnumSelection(["NONE"], "NORMAL", items, true), ["NORMAL"]);
  assert.deepEqual(toggleEnumSelection(["NONE"], "ABNORMAL", items, true), ["ABNORMAL"]);
  assert.deepEqual(toggleEnumSelection(["NORMAL", "ABNORMAL"], "NONE", items, true), ["NONE"]);
});

test("enum definition rejects combining any concrete result and no-nature items", () => {
  const errors = validateIndicator({
    name: "角膜状态", code: "CORNEA_STATE", type: "多选枚举", unit: "", eyeRule: ["OD", "OS"],
    source: "医生查体", status: "启用", description: "", referenced: false, referenceRange: "",
    enumItems: [
      { code: "NORMAL", name: "正常", externalCode: "", order: 1, status: "启用", nature: 0, isDefault: true, allowsText: false },
      { code: "NONE", name: "无", externalCode: "", order: 2, status: "启用", nature: 2, isDefault: false, allowsText: false },
      { code: "EDEMA", name: "水肿", externalCode: "", order: 3, status: "启用", nature: 1, isDefault: false, allowsText: false },
    ],
  }, createSeedIndicators());
  assert.equal(errors.enumNature, "正常或异常不能与无同时配置");
});

test("enum definition rejects combining abnormal and no-nature without a normal item", () => {
  const errors = validateIndicator({
    name: "症状", code: "SYMPTOM", type: "多选枚举", unit: "", eyeRule: ["OD", "OS"],
    source: "医生查体", status: "启用", description: "", referenced: false, referenceRange: "",
    enumItems: [
      { code: "NONE", name: "无", externalCode: "", order: 1, status: "启用", nature: 2, isDefault: true, allowsText: false },
      { code: "PAIN", name: "疼痛", externalCode: "", order: 2, status: "启用", nature: 1, isDefault: false, allowsText: false },
    ],
  }, createSeedIndicators());
  assert.equal(errors.enumNature, "正常或异常不能与无同时配置");
});

test("validates enum default flags with fixed supplemental text length", () => {
  const base = {
    name: "角膜", code: "CORNEA_EXAM", type: "多选枚举", unit: "", eyeRule: ["OD", "OS"],
    source: "医生查体", status: "启用", description: "", referenced: false, referenceRange: "清亮",
  } as IndicatorDraft;
  const errors = validateIndicator({ ...base, enumItems: [
    { code: "NORMAL", name: "清亮", externalCode: "", order: 1, status: "启用", nature: 0, isDefault: true, allowsText: false },
    { code: "OTHER", name: "其他", externalCode: "", order: 2, status: "启用", nature: 1, isDefault: true, allowsText: true },
  ] }, createSeedIndicators());
  assert.equal(Boolean(errors.enumDefault), true);
  assert.equal("enumNormalExclusive" in errors, false);
  assert.equal("enumTextLength" in errors, false);
});

test("validates boolean labels and medical value mappings", () => {
  const errors = validateIndicator({
    name: "是否水肿",
    code: "HAS_EDEMA",
    type: "布尔型",
    unit: "",
    eyeRule: ["OD"],
    source: "医技检查",
    status: "启用",
    description: "",
    referenced: false,
    referenceRange: "",
    externalMapping: { OD: "HAS_EDEMA_OD" },
    boolean: { trueLabel: "", falseLabel: "否", trueExternalCode: "1", falseExternalCode: "1" },
  } as IndicatorDraft, createSeedIndicators());
  assert.equal(Boolean(errors.booleanLabels), true);
  assert.equal(Boolean(errors.booleanExternalCodes), true);
});

test("toggles status without mutating the original collection", () => {
  const original = createSeedIndicators();
  const changed = toggleIndicatorStatus(original, "IOP");
  assert.equal(original.find((item) => item.code === "IOP")?.status, "启用");
  assert.equal(changed.find((item) => item.code === "IOP")?.status, "停用");
});

test("only unused indicators without historical data can be deleted", () => {
  const items = createSeedIndicators();
  assert.equal(canDeleteIndicator(items.find((item) => item.code === "IOP")!), false);
  assert.equal(canDeleteIndicator({ ...items.find((item) => item.code === "EXAM_CONCLUSION")!, referenced: false, hasHistoricalData: false }), true);
  assert.equal(canDeleteIndicator({ ...items.find((item) => item.code === "EXAM_CONCLUSION")!, referenced: false, hasHistoricalData: true }), false);
});
