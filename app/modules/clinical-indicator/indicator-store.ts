export type IndicatorType = "数值型" | "文本型" | "枚举型" | "多选枚举" | "布尔型";
export type IndicatorSource = "护士采集" | "医生查体" | "医技检查";
export type IndicatorStatus = "启用" | "停用";
export type EyeOption = "OD" | "OS" | "OU" | "无眼别";
export type EyeRule = EyeOption[];

export type NumericConfig = { decimals: number; min?: number; max?: number };
export type TextConfig = { maxLength: number };
export type BooleanConfig = {
  trueLabel: string;
  falseLabel: string;
  trueExternalCode: string;
  falseExternalCode: string;
};
export type EnumItem = {
  code: string;
  name: string;
  externalCode: string;
  order: number;
  status: IndicatorStatus;
};

export type IndicatorDraft = {
  name: string;
  code: string;
  type: IndicatorType;
  unit: string;
  eyeRule: EyeRule;
  source: IndicatorSource;
  status: IndicatorStatus;
  description: string;
  referenceRange: string;
  referenced: boolean;
  numeric?: NumericConfig;
  text?: TextConfig;
  enumItems?: EnumItem[];
  boolean?: BooleanConfig;
  nursingMapping?: SourceMapping;
  externalMapping?: SourceMapping;
};

export type SourceMapping = Partial<Record<EyeOption, string>>;

export type NursingSign = { code: string; name: string; eye: "OD" | "OS" | "OU" | "无" };

export const nursingSigns: NursingSign[] = [
  { code: "NUR_UCVA_OD", name: "右眼裸眼视力", eye: "OD" },
  { code: "NUR_UCVA_OS", name: "左眼裸眼视力", eye: "OS" },
  { code: "NUR_BCVA_OD", name: "右眼矫正视力", eye: "OD" },
  { code: "NUR_BCVA_OS", name: "左眼矫正视力", eye: "OS" },
  { code: "NUR_VISION_OU", name: "双眼视力", eye: "OU" },
  { code: "NUR_GENERAL", name: "眼科通用体征", eye: "无" },
];

export type Indicator = IndicatorDraft & {
  updatedAt: string;
  referencedBy?: string[];
};

export type IndicatorFilters = {
  name: string;
  code: string;
  source: string;
  status: string;
};

export type ValidationErrors = Record<string, string>;

const APPROVED_SOURCES = new Set<IndicatorSource>([
  "护士采集",
  "医生查体",
  "医技检查",
]);

export function requiredMappingKeys(source: IndicatorSource, eyeRule: EyeRule): EyeOption[] {
  if (source === "医生查体") return [];
  return eyeRule;
}

export function createSeedIndicators(): Indicator[] {
  return [
    {
      name: "眼压",
      code: "IOP",
      type: "数值型",
      unit: "mmHg",
      eyeRule: ["OD", "OS"],
      source: "医技检查",
      status: "启用",
      description: "记录双眼眼压测量值，用于青光眼筛查与随访。",
      referenceRange: "10～21 mmHg",
      referenced: true,
      externalMapping: { OD: "IOP_RIGHT", OS: "IOP_LEFT" },
      referencedBy: ["眼压检查模板", "青光眼复查模板"],
      numeric: { decimals: 0, min: 5, max: 60 },
      updatedAt: "2026-07-30 14:32",
    },
    {
      name: "眼轴长度",
      code: "AL",
      type: "数值型",
      unit: "mm",
      eyeRule: ["OD", "OS"],
      source: "医技检查",
      status: "启用",
      description: "眼轴测量结果，用于屈光与近视进展评估。",
      referenceRange: "22～26 mm",
      referenced: true,
      externalMapping: { OD: "AL_RIGHT", OS: "AL_LEFT" },
      referencedBy: ["眼生物测量模板"],
      numeric: { decimals: 2, min: 15, max: 40 },
      updatedAt: "2026-07-29 10:18",
    },
    {
      name: "裸眼视力",
      code: "UCVA",
      type: "文本型",
      unit: "",
      eyeRule: ["OD", "OS"],
      source: "护士采集",
      status: "启用",
      description: "患者未矫正状态下的远视力。",
      referenceRange: "0.8～1.5",
      referenced: true,
      referencedBy: ["视力检查模板"],
      text: { maxLength: 50 },
      nursingMapping: { OD: "NUR_UCVA_OD", OS: "NUR_UCVA_OS" },
      updatedAt: "2026-07-28 09:45",
    },
    {
      name: "角膜状态",
      code: "CORNEA_STATUS",
      type: "枚举型",
      unit: "",
      eyeRule: ["OD", "OS"],
      source: "医生查体",
      status: "启用",
      description: "医生检查后记录角膜整体状态。",
      referenceRange: "透明",
      referenced: false,
      enumItems: [
        { code: "NORMAL", name: "透明", externalCode: "N", order: 1, status: "启用" },
        { code: "EDEMA", name: "水肿", externalCode: "E", order: 2, status: "启用" },
        { code: "OPACITY", name: "混浊", externalCode: "O", order: 3, status: "启用" },
      ],
      updatedAt: "2026-07-26 16:20",
    },
    {
      name: "检查结论",
      code: "EXAM_CONCLUSION",
      type: "文本型",
      unit: "",
      eyeRule: ["无眼别"],
      source: "医技检查",
      status: "停用",
      description: "承载医技检查报告中的文字结论。",
      referenceRange: "",
      referenced: false,
      externalMapping: { 无眼别: "EXAM_CONCLUSION" },
      text: { maxLength: 1000 },
      updatedAt: "2026-07-22 11:08",
    },
    {
      name: "伴随症状",
      code: "SYMPTOMS",
      type: "多选枚举",
      unit: "",
      eyeRule: ["无眼别"],
      source: "医生查体",
      status: "启用",
      description: "记录患者同时存在的多项眼部伴随症状。",
      referenceRange: "",
      referenced: false,
      enumItems: [
        { code: "ITCH", name: "眼痒", externalCode: "ITCH", order: 1, status: "启用" },
        { code: "PAIN", name: "眼痛", externalCode: "PAIN", order: 2, status: "启用" },
        { code: "TEAR", name: "流泪", externalCode: "TEAR", order: 3, status: "启用" },
      ],
      updatedAt: "2026-08-01 11:20",
    },
    {
      name: "是否水肿",
      code: "HAS_EDEMA",
      type: "布尔型",
      unit: "",
      eyeRule: ["OD", "OS"],
      source: "医技检查",
      status: "启用",
      description: "接收医技检查返回的角膜水肿判断。",
      referenceRange: "否",
      referenced: false,
      externalMapping: { OD: "EDEMA_OD", OS: "EDEMA_OS" },
      boolean: { trueLabel: "是", falseLabel: "否", trueExternalCode: "1", falseExternalCode: "0" },
      updatedAt: "2026-08-01 11:30",
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
  if (!APPROVED_SOURCES.has(draft.source)) {
    errors.source = "请选择护士采集、医生查体或医技检查";
  }
  if (!draft.eyeRule.length) errors.eyeRule = "请至少选择一个眼别";
  if (draft.eyeRule.includes("无眼别") && draft.eyeRule.length > 1) {
    errors.eyeRule = "无眼别不能与其他眼别同时选择";
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
  if (draft.type === "枚举型" || draft.type === "多选枚举") {
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
    if (draft.source === "医技检查") {
      const externalCodes = rows.map((item) => item.externalCode?.trim()).filter(Boolean);
      if (!externalCodes.length) errors.enumExternalCode = "请至少配置一个外部映射编码";
      else if (new Set(externalCodes).size !== externalCodes.length) {
        errors.enumExternalCode = "外部映射编码不能重复";
      }
    }
  }
  if (draft.type === "布尔型") {
    const config = draft.boolean;
    if (!config?.trueLabel.trim() || !config?.falseLabel.trim()) {
      errors.booleanLabels = "请填写真值和假值显示名称";
    }
    if (draft.source === "医技检查") {
      const trueCode = config?.trueExternalCode.trim() ?? "";
      const falseCode = config?.falseExternalCode.trim() ?? "";
      if (!trueCode || !falseCode) errors.booleanExternalCodes = "请填写真假外部映射编码";
      else if (trueCode === falseCode) errors.booleanExternalCodes = "真假外部映射编码不能重复";
    }
  }
  const mappingKeys = requiredMappingKeys(draft.source, draft.eyeRule);
  if (draft.source === "护士采集") {
    if (mappingKeys.some((key) => !draft.nursingMapping?.[key]?.trim())) {
      errors.nursingMapping = "请按眼别关联护理体征字典";
    }
  }
  if (draft.source === "医技检查") {
    const values = mappingKeys.map((key) => draft.externalMapping?.[key]?.trim() ?? "");
    if (values.some((value) => !value)) errors.externalMapping = "请按眼别填写外部字段";
    else if (values.some((value) => !/^[A-Z0-9_.]+$/.test(value))) {
      errors.externalMapping = "外部字段仅允许大写字母、数字、下划线和点号";
    } else if (new Set(values).size !== values.length) {
      errors.externalMapping = "同一指标的外部字段不能重复";
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
