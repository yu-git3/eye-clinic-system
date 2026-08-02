export type SpecialtyRecordStatus = "草稿" | "已保存" | "回传失败";

export interface SpecialtyRecord {
  id: string;
  visitDate: string;
  department: string;
  doctor: string;
  treatmentPlan: string;
  treatmentMethod: string;
  archiveId: string;
  complaint: string;
  presentIllness: string;
  assessment: string;
  plan: string;
  followUpDate: string;
  followUpRule: string;
  followUpNote: string;
  note: string;
  status: SpecialtyRecordStatus;
}

export interface SpecialtyHistoryItem extends SpecialtyRecord {
  complaintSummary: string;
  examSummary: string;
  planSummary: string;
}

export type ExamTemplateOption = {
  code: string;
  name: string;
  type: "医生查体" | "医技检查";
  indicatorCount: number;
  eyes: string;
};

export type SelectedExamRef = {
  name: string;
  origin: "本次医嘱" | "医生添加";
  saved: boolean;
};

export const examTemplateCatalog: ExamTemplateOption[] = [
  { code: "EYE_HEALTH", name: "眼健康检查", type: "医生查体", indicatorCount: 15, eyes: "OD/OS" },
  { code: "TOPO", name: "角膜地形图", type: "医技检查", indicatorCount: 6, eyes: "OD/OS" },
  { code: "BIOMETRY", name: "眼生物测量", type: "医技检查", indicatorCount: 4, eyes: "OD/OS" },
  { code: "EYE_SURFACE", name: "眼表综合报告", type: "医技检查", indicatorCount: 3, eyes: "OD/OS" },
  { code: "ENDOTHELIUM", name: "角膜内皮", type: "医技检查", indicatorCount: 3, eyes: "OD/OS" },
  { code: "CYCLO_REFRACTION", name: "散瞳医学验光", type: "医技检查", indicatorCount: 4, eyes: "OD/OS" },
  { code: "REFRACTION", name: "小瞳医学验光", type: "医技检查", indicatorCount: 4, eyes: "OD/OS" },
  { code: "ANTERIOR", name: "眼前节与瞳孔", type: "医生查体", indicatorCount: 4, eyes: "OD/OS" },
  { code: "VISION_IOP", name: "视力与眼压", type: "医生查体", indicatorCount: 3, eyes: "OD/OS" },
];

export function filterExamTemplates(query: string) {
  const keyword = query.trim().toLocaleLowerCase();
  if (!keyword) return examTemplateCatalog;
  return examTemplateCatalog.filter((item) =>
    `${item.code} ${item.name}`.toLocaleLowerCase().includes(keyword),
  );
}

export function removeSelectedExam(items: SelectedExamRef[], name: string) {
  const target = items.find((item) => item.name === name);
  if (!target || target.origin !== "医生添加" || target.saved) return items;
  return items.filter((item) => item.name !== name);
}

export function recommendFollowUpDate(from: string, months: number) {
  const [year, month, day] = from.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return { date: date.toISOString().slice(0, 10), rule: `上次复诊后${months}个月` };
}

export function createSpecialtyRecordSeed(): SpecialtyRecord {
  return {
    id: "SR-20260802-001",
    visitDate: "2026-08-02",
    department: "眼视光中心",
    doctor: "方红全",
    treatmentPlan: "角膜接触镜标准治疗方案",
    treatmentMethod: "OK镜",
    archiveId: "CL-20260802-0001",
    complaint: "双眼近视，配戴角膜塑形镜近1年，今日复查",
    presentIllness: "近期戴镜约8小时/晚，白天裸眼视力尚可，无明显眼红、眼痛及畏光流泪。",
    assessment: "裸眼视力OD 1.0、OS 0.8；双眼结膜无明显充血，角膜清；眼轴OD 24.37mm、OS 24.30mm。",
    plan: "继续戴镜随访，强调规范护理；复查角膜地形图及眼轴，有不适及时停戴就诊。",
    followUpDate: "2026-11-02",
    followUpRule: "上次复诊后3个月",
    followUpNote: "",
    note: "",
    status: "草稿",
  };
}

export function createHistorySeeds(): SpecialtyHistoryItem[] {
  return [
    { ...createSpecialtyRecordSeed(), id: "SR-20260212-006", visitDate: "2026-02-12", doctor: "徐珊珊", complaintSummary: "裸眼OD 1.0、OS 0.8；戴塑形镜1年8个月，要求重订开备用检查", examSummary: "双眼角膜清，眼睑及结膜未见明显异常", planSummary: "眼轴OD 24.37mm、OS 24.30mm；裸眼小瞳验光；3个月复查", status: "已保存" },
    { ...createSpecialtyRecordSeed(), id: "SR-20250828-005", visitDate: "2025-08-28", doctor: "徐英男", complaintSummary: "裸眼OD 1.0、OS 0.6；戴塑形镜1年4个月", examSummary: "双眼角膜清", planSummary: "地形图；眼轴OD 24.32mm、OS 24.22mm；双眼戴镜观察", status: "已保存" },
    { ...createSpecialtyRecordSeed(), id: "SR-20250510-004", visitDate: "2025-05-10", doctor: "颜丽娜", complaintSummary: "裸眼OD 0.8、OS 0.8；戴塑形镜1年", examSummary: "双眼角膜清", planSummary: "眼轴OD 24.24mm、OS 24.15mm；双眼戴镜观察", status: "已保存" },
  ];
}

export function buildOutpatientRecordText(record: SpecialtyRecord) {
  return [
    `主诉：${record.complaint}`,
    `现病史：${record.presentIllness}`,
    `专科检查：${record.assessment}`,
    `处理建议：${record.plan}`,
    `复诊安排：${record.followUpDate}（${record.followUpRule}）${record.followUpNote ? `；${record.followUpNote}` : ""}`,
    record.note ? `备注：${record.note}` : "",
  ].filter(Boolean).join("\n");
}

export function validateSpecialtyRecord(record: SpecialtyRecord) {
  const errors: Partial<Record<"complaint" | "assessment", string>> = {};
  if (!record.complaint.trim()) errors.complaint = "请填写主诉";
  if (!record.assessment.trim()) errors.assessment = "请填写专科检查摘要";
  return errors;
}
