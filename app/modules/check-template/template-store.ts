export type TemplateType = "医技检查" | "医生查体";
export type TemplateStatus = "启用" | "停用";

export type CheckTemplateDraft = {
  name: string;
  code: string;
  type: TemplateType;
  serviceItem: string;
  departmentIds: string[];
  indicatorCodes: string[];
  status: TemplateStatus;
  description: string;
};

export type CheckTemplate = CheckTemplateDraft & { updatedAt: string };
export type TemplateFilters = { keyword: string; type: string; status: string };
export type TemplateErrors = Record<string, string>;

export const institutions = [
  { id: "A", name: "南医眼科 A 机构", departments: [{ id: "A-OPH", name: "眼科门诊" }, { id: "A-OPT", name: "视光中心" }, { id: "A-WARD", name: "眼科病区" }] },
  { id: "B", name: "南医眼科 B 机构", departments: [{ id: "B-OPH", name: "眼病中心" }, { id: "B-REF", name: "屈光中心" }, { id: "B-EXAM", name: "医技检查科" }] },
];

export const serviceItems = [
  { code: "IOP_EXAM", name: "眼压检查" },
  { code: "CORNEA_TOPO", name: "角膜地形图" },
  { code: "BIOMETRY", name: "眼生物测量" },
  { code: "FUNDUS_PHOTO", name: "眼底照相" },
  { code: "VISUAL_FIELD", name: "视野检查" },
];

export function blankTemplate(): CheckTemplateDraft {
  return { name: "", code: "", type: "医技检查", serviceItem: "", departmentIds: [], indicatorCodes: [], status: "启用", description: "" };
}

export function createSeedTemplates(): CheckTemplate[] {
  return [
    { ...blankTemplate(), name: "视力检查", code: "VISION_EXAM", type: "医生查体", indicatorCodes: ["UCVA", "CORNEA_STATUS", "SYMPTOMS"], status: "启用", updatedAt: "2026-08-01 15:30" },
    { ...blankTemplate(), name: "角膜地形图", code: "CORNEA_TOPO", serviceItem: "角膜地形图", departmentIds: ["A-OPT", "B-REF"], indicatorCodes: ["IOP", "AL"], status: "启用", updatedAt: "2026-07-30 10:12" },
    { ...blankTemplate(), name: "眼压检查", code: "IOP_EXAM", serviceItem: "眼压检查", departmentIds: ["B-EXAM"], indicatorCodes: ["IOP", "HAS_EDEMA"], status: "停用", updatedAt: "2026-07-28 09:20" },
  ];
}

export function validateTemplate(draft: CheckTemplateDraft, existing: CheckTemplate[], editingCode?: string): TemplateErrors {
  const errors: TemplateErrors = {};
  if (!draft.name.trim()) errors.name = "请输入模板名称";
  if (!draft.code.trim()) errors.code = "请输入模板编码";
  else if (!/^[A-Z0-9_]+$/.test(draft.code)) errors.code = "仅允许大写字母、数字和下划线";
  else if (existing.some((item) => item.code === draft.code && item.code !== editingCode)) errors.code = "模板编码已存在";
  if (draft.type === "医技检查" && !draft.serviceItem) errors.serviceItem = "请选择服务项目";
  if (!draft.indicatorCodes.length) errors.indicatorCodes = "请至少选择一个指标";
  return errors;
}

export function permissionLabel(ids: string[]): string {
  return ids.length ? `已选 ${ids.length} 个科室` : "全部机构 / 全部科室";
}

export function filterTemplates(items: CheckTemplate[], filters: TemplateFilters): CheckTemplate[] {
  const keyword = filters.keyword.trim().toLowerCase();
  return items.filter((item) => (!keyword || item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword)) && (!filters.type || item.type === filters.type) && (!filters.status || item.status === filters.status));
}

export function filterServiceItems(keyword: string) {
  const value = keyword.trim().toLowerCase();
  return serviceItems.filter((item) => !value || item.code.toLowerCase().includes(value) || item.name.toLowerCase().includes(value));
}

export function filterDepartments(keyword: string) {
  const value = keyword.trim().toLowerCase();
  return institutions.flatMap((institution) => institution.departments.map((department) => ({ ...department, institutionId: institution.id, institutionName: institution.name }))).filter((item) => !value || item.id.toLowerCase().includes(value) || item.name.toLowerCase().includes(value) || item.institutionName.toLowerCase().includes(value));
}

export function moveIndicator(codes: string[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= codes.length) return codes;
  const next = [...codes];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
