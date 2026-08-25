export type Eye = "OD" | "OS";
export type BrandMode = "same" | "different";
export type LensParameter = { key: string; label: string; unit?: string; value: string };
export type Brand = {
  id: string;
  name: string;
  series: string;
  vendor: string;
  parameters: Array<Omit<LensParameter, "value"> & { defaultOD: string; defaultOS: string }>;
};
export type EyeOrderConfig = { brandId: string; parameters: LensParameter[] };
export type OrderDraft = {
  kind: "initial" | "replacement";
  brandMode: BrandMode;
  selectedEyes: Eye[];
  visitId: string;
  orderId: string;
  eyeOrderIds: Record<Eye, string>;
  replacementReason: string;
  eyeConfigs: Record<Eye, EyeOrderConfig>;
};
export type OrderGroup = { brandId: string; brandName: string; eyes: Eye[]; configs: EyeOrderConfig[] };

export const brands: Brand[] = [
  { id: "crt", name: "CRT", series: "100系列", vendor: "阿尔法", parameters: [
    { key: "bc", label: "BC基弧", unit: "mm", defaultOD: "8.50", defaultOS: "8.55" },
    { key: "dia", label: "DIA直径", unit: "mm", defaultOD: "10.60", defaultOS: "10.60" },
    { key: "power", label: "降幅", unit: "D", defaultOD: "-3.00", defaultOS: "-2.75" },
    { key: "rzd", label: "RZD", unit: "μm", defaultOD: "550", defaultOS: "525" },
    { key: "lza", label: "LZA", unit: "°", defaultOD: "34", defaultOS: "34" },
  ]},
  { id: "dreamlite", name: "梦戴维 DreamLite", series: "Pro系列", vendor: "欧几里德", parameters: [
    { key: "bc", label: "BC基弧", unit: "mm", defaultOD: "8.40", defaultOS: "8.45" },
    { key: "dia", label: "DIA直径", unit: "mm", defaultOD: "10.60", defaultOS: "10.60" },
    { key: "power", label: "目标降幅", unit: "D", defaultOD: "-3.25", defaultOS: "-2.75" },
    { key: "ecc", label: "E值", defaultOD: "0.55", defaultOS: "0.52" },
  ]},
  { id: "advance", name: "欧几里德 advance", series: "Advance", vendor: "欧几里德", parameters: [
    { key: "bc", label: "BC", unit: "mm", defaultOD: "8.45", defaultOS: "8.50" },
    { key: "dia", label: "TD", unit: "mm", defaultOD: "10.50", defaultOS: "10.50" },
    { key: "sag", label: "Sag", unit: "μm", defaultOD: "5350", defaultOS: "5300" },
  ]},
  { id: "essential", name: "欧几里德 Essential", series: "Essential", vendor: "欧几里德", parameters: [
    { key: "bc", label: "BC", unit: "mm", defaultOD: "8.35", defaultOS: "8.40" },
    { key: "dia", label: "TD", unit: "mm", defaultOD: "10.60", defaultOS: "10.60" },
    { key: "ac", label: "AC", unit: "D", defaultOD: "0.75", defaultOS: "0.75" },
    { key: "power", label: "Power", unit: "D", defaultOD: "-3.00", defaultOS: "-2.75" },
  ]},
];

function configFor(brandId: string, eye: Eye): EyeOrderConfig {
  const brand = brands.find((item) => item.id === brandId) ?? brands[0];
  return {
    brandId: brand.id,
    parameters: brand.parameters.map((item) => ({ key: item.key, label: item.label, unit: item.unit, value: eye === "OD" ? item.defaultOD : item.defaultOS })),
  };
}

export function createOrderDraft(): OrderDraft {
  return {
    kind: "initial",
    brandMode: "same",
    selectedEyes: ["OD", "OS"],
    visitId: "VISIT-20260825-1036",
    orderId: "",
    eyeOrderIds: { OD: "", OS: "" },
    replacementReason: "",
    eyeConfigs: { OD: configFor("crt", "OD"), OS: configFor("crt", "OS") },
  };
}

export function setBrandMode(draft: OrderDraft, mode: BrandMode): OrderDraft {
  if (mode === draft.brandMode) return draft;
  if (mode === "different") return { ...draft, brandMode: mode, eyeConfigs: { OD: { ...draft.eyeConfigs.OD, parameters: draft.eyeConfigs.OD.parameters.map((p) => ({ ...p })) }, OS: { ...draft.eyeConfigs.OS, parameters: draft.eyeConfigs.OS.parameters.map((p) => ({ ...p })) } } };
  const brandId = draft.eyeConfigs.OD.brandId;
  return { ...draft, brandMode: mode, eyeConfigs: { OD: draft.eyeConfigs.OD, OS: configFor(brandId, "OS") } };
}

export function updateEyeBrand(draft: OrderDraft, eye: Eye, brandId: string): OrderDraft {
  const next = { ...draft.eyeConfigs, [eye]: configFor(brandId, eye) };
  if (draft.brandMode === "same") {
    const other: Eye = eye === "OD" ? "OS" : "OD";
    next[other] = configFor(brandId, other);
  }
  return { ...draft, eyeConfigs: next };
}

export function updateEyeParameter(draft: OrderDraft, eye: Eye, key: string, value: string): OrderDraft {
  return { ...draft, eyeConfigs: { ...draft.eyeConfigs, [eye]: { ...draft.eyeConfigs[eye], parameters: draft.eyeConfigs[eye].parameters.map((item) => item.key === key ? { ...item, value } : item) } } };
}

export function copyEyeParameters(draft: OrderDraft, from: Eye, to: Eye): OrderDraft {
  const source = draft.eyeConfigs[from];
  return { ...draft, eyeConfigs: { ...draft.eyeConfigs, [to]: { brandId: source.brandId, parameters: source.parameters.map((item) => ({ ...item })) } } };
}

export function groupOrdersByBrand(draft: OrderDraft): OrderGroup[] {
  const groups: OrderGroup[] = [];
  draft.selectedEyes.forEach((eye) => {
    const config = draft.eyeConfigs[eye];
    let group = groups.find((item) => item.brandId === config.brandId);
    if (!group) {
      group = { brandId: config.brandId, brandName: brands.find((item) => item.id === config.brandId)?.name ?? config.brandId, eyes: [], configs: [] };
      groups.push(group);
    }
    group.eyes.push(eye);
    group.configs.push(config);
  });
  return groups;
}

export function createReplacementDraft(scope: Eye | "BOTH", current: Record<Eye, string> = { OD: "crt", OS: "crt" }): OrderDraft {
  const selectedEyes: Eye[] = scope === "BOTH" ? ["OD", "OS"] : [scope];
  return {
    ...createOrderDraft(),
    kind: "replacement",
    brandMode: selectedEyes.length === 2 && current.OD !== current.OS ? "different" : "same",
    selectedEyes,
    replacementReason: scope === "BOTH" ? "常规到期换片" : "单眼镜片参数需调整",
    eyeConfigs: { OD: configFor(current.OD, "OD"), OS: configFor(current.OS, "OS") },
  };
}
