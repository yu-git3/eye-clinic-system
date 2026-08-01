import test from "node:test";
import assert from "node:assert/strict";
import {
  createSeedIndicators,
  filterIndicators,
  paginateIndicators,
  toggleIndicatorStatus,
  validateIndicator,
  type IndicatorDraft,
} from "./indicator-store.ts";

const emptyFilters = {
  name: "",
  code: "",
  type: "",
  source: "",
  status: "",
};

test("seed data only uses the three approved clinical sources", () => {
  const allowed = new Set(["护士采集", "医生录入", "医技检查"]);
  assert.equal(createSeedIndicators().every((item) => allowed.has(item.source)), true);
});

test("filters by name, code, type, source and status", () => {
  const result = filterIndicators(createSeedIndicators(), {
    ...emptyFilters,
    name: "眼压",
    code: "iop",
    type: "数值型",
    source: "医技检查",
    status: "启用",
  });
  assert.deepEqual(result.map((item) => item.code), ["IOP"]);
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
    category: "眼压",
    type: "数值型",
    unit: "mmHg",
    eyeRule: "OD/OS",
    source: "PACS/设备回传",
    status: "启用",
    description: "",
    referenced: false,
    numeric: { decimals: 0, min: 5, max: 40 },
  } as unknown as IndicatorDraft;
  const errors = validateIndicator(draft, createSeedIndicators());
  assert.equal(errors.source, "请选择护士采集、医生录入或医技检查");
});

test("rejects duplicate codes and inverted numeric ranges", () => {
  const draft: IndicatorDraft = {
    name: "重复眼压",
    code: "IOP",
    category: "眼压",
    type: "数值型",
    unit: "mmHg",
    eyeRule: "OD/OS",
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

test("requires an enabled enum item and unique enum codes", () => {
  const draft: IndicatorDraft = {
    name: "角膜状态2",
    code: "CORNEA_STATUS_2",
    category: "眼前节",
    type: "枚举型",
    unit: "",
    eyeRule: "OD/OS",
    source: "医生录入",
    status: "启用",
    description: "",
    referenced: false,
    enumItems: [
      { code: "NORMAL", name: "正常", order: 1, status: "停用" },
      { code: "NORMAL", name: "异常", order: 2, status: "停用" },
    ],
  };
  const errors = validateIndicator(draft, createSeedIndicators());
  assert.equal(Boolean(errors.enumItems), true);
});

test("toggles status without mutating the original collection", () => {
  const original = createSeedIndicators();
  const changed = toggleIndicatorStatus(original, "IOP");
  assert.equal(original.find((item) => item.code === "IOP")?.status, "启用");
  assert.equal(changed.find((item) => item.code === "IOP")?.status, "停用");
});
