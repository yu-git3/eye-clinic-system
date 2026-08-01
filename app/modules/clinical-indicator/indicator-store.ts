export type IndicatorType = "数值型" | "文本型" | "枚举型";
export type IndicatorSource = "护士采集" | "医生录入" | "医技检查";
export type IndicatorStatus = "启用" | "停用";
export type EyeRule = "无眼别" | "OD/OS" | "OU";

export type NumericConfig = { decimals: number; min?: number; max?: number };
export type TextConfig = { maxLength: number };
export type EnumItem = {
  code: string;
  name: string;
  order: number;
  status: IndicatorStatus;
};

export type IndicatorDraft = {
  name: string;
  code: string;
  category: string;
  type: IndicatorType;
  unit: string;
  eyeRule: EyeRule;
  source: IndicatorSource;
  status: IndicatorStatus;
  description: string;
  referenced: boolean;
  numeric?: NumericConfig;
  text?: TextConfig;
  enumItems?: EnumItem[];
};

export type Indicator = IndicatorDraft & {
  updatedAt: string;
  referencedBy?: string[];
};

export type IndicatorFilters = {
  name: string;
  code: string;
  type: string;
  source: string;
  status: string;
};

export type ValidationErrors = Record<string, string>;

const APPROVED_SOURCES = new Set<IndicatorSource>([
  "护士采集",
  "医生录入",
  "医技检查",
]);

export function createSeedIndicators(): Indicator[] {
  return [
    {
      name: "眼压",
      code: "IOP",
      category: "眼压",
      type: "数值型",
      unit: "mmHg",
      eyeRule: "OD/OS",
      source: "医技检查",
      status: "启用",
      description: "记录双眼眼压测量值，用于青光眼筛查与随访。",
      referenced: true,
      referencedBy: ["眼压检查模板", "青光眼复查模板"],
      numeric: { decimals: 0, min: 5, max: 60 },
      updatedAt: "2026-07-30 14:32",
    },
    {
      name: "眼轴长度",
      code: "AL",
      category: "眼生物测量",
      type: "数值型",
      unit: "mm",
      eyeRule: "OD/OS",
      source: "医技检查",
      status: "启用",
      description: "眼轴测量结果，用于屈光与近视进展评估。",
      referenced: true,
      referencedBy: ["眼生物测量模板"],
      numeric: { decimals: 2, min: 15, max: 40 },
      updatedAt: "2026-07-29 10:18",
    },
    {
      name: "裸眼视力",
      code: "UCVA",
      category: "视力",
      type: "数值型",
      unit: "",
      eyeRule: "OD/OS",
      source: "护士采集",
      status: "启用",
      description: "患者未矫正状态下的远视力。",
      referenced: true,
      referencedBy: ["视力检查模板"],
      numeric: { decimals: 2, min: 0, max: 2 },
      updatedAt: "2026-07-28 09:45",
    },
    {
      name: "角膜状态",
      code: "CORNEA_STATUS",
      category: "眼前节",
      type: "枚举型",
      unit: "",
      eyeRule: "OD/OS",
      source: "医生录入",
      status: "启用",
      description: "医生检查后记录角膜整体状态。",
      referenced: false,
      enumItems: [
        { code: "NORMAL", name: "透明", order: 1, status: "启用" },
        { code: "EDEMA", name: "水肿", order: 2, status: "启用" },
        { code: "OPACITY", name: "混浊", order: 3, status: "启用" },
      ],
      updatedAt: "2026-07-26 16:20",
    },
    {
      name: "检查结论",
      code: "EXAM_CONCLUSION",
      category: "通用",
      type: "文本型",
      unit: "",
      eyeRule: "无眼别",
      source: "医技检查",
      status: "停用",
      description: "承载医技检查报告中的文字结论。",
      referenced: false,
      text: { maxLength: 1000 },
      updatedAt: "2026-07-22 11:08",
    },
  ];
}

export function filterIndicators(
  items: Indicator[],
  filters: IndicatorFilters,
): Indicator[] {
  const name = filters.name.trim().toLowerCase();
  const code = filters.code.trim().toLowerCase();
  return items.filter((item) =>
    (!name || item.name.toLowerCase().includes(name)) &&
    (!code || item.code.toLowerCase().includes(code)) &&
    (!filters.type || item.type === filters.type) &&
    (!filters.source || item.source === filters.source) &&
    (!filters.status || item.status === filters.status),
  );
}

export function paginateIndicators(items: Indicator[], page: number, pageSize: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
  };
}

export function validateIndicator(
  draft: IndicatorDraft,
  existing: Indicator[],
  editingCode?: string,
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!draft.name.trim()) errors.name = "请输入指标名称";
  if (draft.name.trim().length > 50) errors.name = "指标名称不能超过50个字符";
  if (!draft.code.trim()) errors.code = "请输入指标编码";
  else if (!/^[A-Z0-9_]+$/.test(draft.code.trim())) {
    errors.code = "仅允许大写字母、数字和下划线";
  } else if (existing.some((item) => item.code === draft.code && item.code !== editingCode)) {
    errors.code = "指标编码已存在";
  }
  if (!draft.category) errors.category = "请选择指标分类";
  if (!APPROVED_SOURCES.has(draft.source)) {
    errors.source = "请选择护士采集、医生录入或医技检查";
  }
  if (draft.type === "数值型") {
    const decimals = draft.numeric?.decimals;
    if (decimals === undefined || decimals < 0 || decimals > 4) {
      errors.decimals = "小数位数须为0至4";
    }
    const min = draft.numeric?.min;
    const max = draft.numeric?.max;
    if (min !== undefined && max !== undefined && min >= max) {
      errors.numericRange = "最小值必须小于最大值";
    }
  }
  if (draft.type === "文本型") {
    const maxLength = draft.text?.maxLength;
    if (!maxLength || maxLength < 1 || maxLength > 2000) {
      errors.maxLength = "最大长度须为1至2000";
    }
  }
  if (draft.type === "枚举型") {
    const rows = draft.enumItems ?? [];
    const codes = rows.map((item) => item.code.trim()).filter(Boolean);
    if (!rows.length) errors.enumItems = "请至少添加一个枚举项";
    else if (rows.some((item) => !item.code.trim() || !item.name.trim())) {
      errors.enumItems = "请完整填写枚举编码和名称";
    } else if (new Set(codes).size !== codes.length) {
      errors.enumItems = "枚举编码不能重复";
    } else if (!rows.some((item) => item.status === "启用")) {
      errors.enumItems = "至少保留一个启用的枚举项";
    }
  }
  return errors;
}

export function toggleIndicatorStatus(items: Indicator[], code: string): Indicator[] {
  return items.map((item) =>
    item.code === code
      ? {
          ...item,
          status: item.status === "启用" ? "停用" : "启用",
          updatedAt: "2026-08-01 10:00",
        }
      : item,
  );
}
