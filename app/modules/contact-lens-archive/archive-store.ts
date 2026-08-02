export type TreatmentMethod = "OK镜" | "RGP" | "软性离焦镜" | "巩膜镜" | "其他";
export type ArchiveStatus = "基本档案待完成" | "治疗中" | "已完成" | "已终止";
export type BaselineStatus = "未开始" | "评估中" | "已完成";
export type DataSource = "护士采集" | "医生查体" | "医技检查";
export type ValueOrigin = "接口自动获取" | "医生手工录入" | "自动获取后人工修订";

export type ArchiveDraft = {
  treatmentPlan: string;
  treatmentMethod: string;
  responsibleDoctor: string;
  createdAt?: string;
  note?: string;
};

export type ReportCandidate = {
  reportId: string;
  checkedAt: string;
  reporterName: string;
  reportedAt: string;
  status: "已报告" | "待审核";
  odSummary: string;
  osSummary: string;
};

export type Baseline = {
  status: BaselineStatus;
  purpose: string;
  lensHistory: string;
  systemicHistory: string;
  eyeHistory: string;
  allergyHistory: string;
  correctionHistory: string;
  workAndLife: string;
  electronicUsage: string;
  doctorConclusion: string;
  completedAt?: string;
};

export type CheckSnapshot = {
  group: string;
  source: DataSource;
  reportId: string;
  reportDate: string;
  snapshotAt: string;
  status: "已获取" | "待返回";
  valueOrigin: ValueOrigin;
  enteredBy: string;
  enteredAt: string;
  reporterName?: string;
  reportTime?: string;
  report?: { kind: "PDF" | "图片" | "报告正文"; name: string; summary: string };
  citationHistory?: Array<{ reportId: string; operator: string; citedAt: string }>;
  rows: Array<{ item: string; od: string; os: string; originalOd?: string; originalOs?: string; unit?: string; reference?: string; revision?: { revisedBy: string; revisedAt: string } }>;
};

export type BaselineTemplateRef = { id: string; name: string; version: string };

export type MethodStage = {
  method: TreatmentMethod;
  startedAt: string;
  endedAt?: string;
  reason?: string;
  doctor: string;
  assessmentStrategy?: string;
};

export type TimelineEvent = {
  date: string;
  title: string;
  detail: string;
  state: "done" | "current" | "future" | "change";
};

export type ContactLensArchive = {
  id: string;
  patientId: string;
  treatmentPlan: string;
  currentTreatmentMethod: TreatmentMethod;
  responsibleDoctor: string;
  institution: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  cycleNumber: number;
  note: string;
  status: ArchiveStatus;
  currentNode: string;
  baselineTemplate: BaselineTemplateRef;
  baseline: Baseline;
  checks: CheckSnapshot[];
  methodHistory: MethodStage[];
  timeline: TimelineEvent[];
};

export type CheckValueRevision = {
  group: string;
  item: string;
  eye: "od" | "os";
  value: string;
  revisedBy: string;
  revisedAt: string;
};

export type MethodChangeInput = {
  nextMethod: TreatmentMethod;
  effectiveDate: string;
  reason: string;
  doctor: string;
  assessmentStrategy: string;
};

export function validateArchiveDraft(draft: ArchiveDraft, existing: ContactLensArchive[] = [], patientId = "") {
  const errors: Partial<Record<keyof ArchiveDraft, string>> = {};
  if (!draft.treatmentPlan.trim()) errors.treatmentPlan = "请选择治疗方案";
  if (!draft.treatmentMethod.trim()) errors.treatmentMethod = "请选择治疗方式";
  if (!draft.responsibleDoctor.trim()) errors.responsibleDoctor = "请选择责任医生";
  if (patientId && existing.some((item) => item.patientId === patientId && item.treatmentPlan === draft.treatmentPlan)) errors.treatmentPlan = "该患者已有该治疗方案档案";
  return errors;
}

export function terminateArchive(archive: ContactLensArchive, input: { endedAt: string; reason: string; operator: string }): ContactLensArchive {
  return { ...archive, status: "已终止", updatedAt: input.endedAt, currentNode: "档案已终止", timeline: [...archive.timeline, { date: input.endedAt, title: "终止档案", detail: `${input.reason}；操作人：${input.operator}`, state: "change" }] };
}

export function reopenArchive(archive: ContactLensArchive, input: { startedAt: string; reason: string; operator: string }): ContactLensArchive {
  return { ...archive, status: "基本档案待完成", updatedAt: input.startedAt, cycleNumber: archive.cycleNumber + 1, currentNode: "基线评估", timeline: [...archive.timeline, { date: input.startedAt, title: `重新开启第${archive.cycleNumber + 1}治疗周期`, detail: `${input.reason}；操作人：${input.operator}`, state: "current" }] };
}

export function referenceCheckReport(archive: ContactLensArchive, group: string, report: ReportCandidate, operator: string, citedAt: string): ContactLensArchive {
  return { ...archive, updatedAt: citedAt, checks: archive.checks.map((item) => item.group !== group ? item : { ...item, reportId: report.reportId, reportDate: report.checkedAt, reporterName: report.reporterName, reportTime: report.reportedAt, status: "已获取", citationHistory: [...(item.citationHistory ?? []), { reportId: report.reportId, operator, citedAt }] }) };
}

export function validateBaseline(baseline: Baseline) {
  const errors: Partial<Record<keyof Baseline, string>> = {};
  if (!baseline.purpose.trim()) errors.purpose = "请填写戴镜目的";
  if (!baseline.doctorConclusion.trim()) errors.doctorConclusion = "请填写医生评估结论";
  return errors;
}

export function changeTreatmentMethod(archive: ContactLensArchive, input: MethodChangeInput): ContactLensArchive {
  const history = archive.methodHistory.map((stage, index) => index === archive.methodHistory.length - 1
    ? { ...stage, endedAt: input.effectiveDate }
    : stage);
  history.push({ method: input.nextMethod, startedAt: input.effectiveDate, reason: input.reason, doctor: input.doctor, assessmentStrategy: input.assessmentStrategy });
  return {
    ...archive,
    status: "治疗中",
    updatedAt: input.effectiveDate,
    currentTreatmentMethod: input.nextMethod,
    currentNode: "治疗方式变更评估",
    methodHistory: history,
    timeline: [...archive.timeline, {
      date: input.effectiveDate,
      title: `治疗方式变更：${archive.currentTreatmentMethod} → ${input.nextMethod}`,
      detail: `${input.reason}；${input.assessmentStrategy}`,
      state: "change",
    }],
  };
}

export function reviseCheckValue(archive: ContactLensArchive, input: CheckValueRevision): ContactLensArchive {
  return {
    ...archive,
    checks: archive.checks.map((group) => group.group !== input.group ? group : {
      ...group,
      valueOrigin: group.valueOrigin === "医生手工录入" ? group.valueOrigin : "自动获取后人工修订",
      rows: group.rows.map((row) => {
        if (row.item !== input.item) return row;
        const originalKey = input.eye === "od" ? "originalOd" : "originalOs";
        return {
          ...row,
          [originalKey]: row[originalKey] ?? row[input.eye],
          [input.eye]: input.value,
          revision: { revisedBy: input.revisedBy, revisedAt: input.revisedAt },
        };
      }),
    }),
  };
}

function createBaselineChecks(): CheckSnapshot[] {
  const common = { reportDate: "2026-08-02 10:05", snapshotAt: "2026-08-02 10:44", status: "已获取" as const, enteredBy: "方红全", enteredAt: "2026-08-02 10:44" };
  return [
    { ...common, group: "视力与眼压", source: "护士采集", enteredBy: "王丽", enteredAt: "2026-08-02 10:26", reportId: "VS-20260802-1026", valueOrigin: "接口自动获取", rows: [
      { item: "裸眼视力", od: "CF-50cm", os: "1.0" }, { item: "矫正视力", od: "1.0", os: "1.0" }, { item: "眼压", od: "19", os: "18", unit: "mmHg", reference: "10–21" }, { item: "主视眼", od: "—", os: "主视眼" },
    ] },
    { ...common, group: "眼健康检查", source: "医生查体", reportId: "EX-20260802-0018", valueOrigin: "医生手工录入", rows: [
      { item: "睑结膜", od: "正常", os: "正常" }, { item: "球结膜", od: "正常", os: "正常" }, { item: "角膜", od: "基质层散在白色颗粒混浊", os: "基质层散在白色颗粒混浊" }, { item: "前房", od: "不浅，周深>1/4CT", os: "不浅，周深>1/4CT" }, { item: "瞳孔", od: "等圆", os: "等圆" }, { item: "晶体", od: "透明", os: "透明" }, { item: "玻璃体", od: "未见明显混浊", os: "未见明显混浊" }, { item: "散瞳眼底", od: "未见明显异常", os: "未见明显异常" }, { item: "眼位", od: "正", os: "正" }, { item: "眼球运动", od: "自如", os: "自如" }, { item: "眼球", od: "大小基本正常", os: "大小基本正常" }, { item: "其他眼部情况", od: "", os: "" },
    ] },
    { ...common, group: "眼前节与瞳孔", source: "医生查体", reportId: "EX-20260802-0019", valueOrigin: "医生手工录入", rows: [
      { item: "角膜横径", od: "11.5", os: "11.7", unit: "mm" }, { item: "暗光下瞳孔直径", od: "5.2", os: "6.6", unit: "mm" }, { item: "角膜厚度（最薄点）", od: "607", os: "592", unit: "μm" },
    ] },
    { ...common, group: "角膜地形图", source: "医技检查", reporterName: "黄雨菲", reportTime: "2026-07-22 09:28", reportId: "PACS-20260802-6621", valueOrigin: "接口自动获取", report: { kind: "PDF", name: "角膜地形图报告.pdf", summary: "PACS 回传报告及部分结构化指标。" }, rows: [
      { item: "睑裂高度", od: "10", os: "10", unit: "mm" }, { item: "眼睑张力", od: "正常", os: "正常" }, { item: "Ks曲率", od: "43.83", os: "43.60", unit: "D" }, { item: "Ks轴位", od: "83", os: "159", unit: "°", reference: "0–180" }, { item: "MinK曲率", od: "42.79", os: "43.10", unit: "D" }, { item: "MinK轴位", od: "179", os: "63", unit: "°", reference: "0–180" },
    ] },
    { ...common, group: "眼生物测量", source: "医技检查", reporterName: "徐英男", reportTime: "2026-08-02 09:45", reportId: "PACS-20260802-6630", valueOrigin: "接口自动获取", report: { kind: "PDF", name: "眼生物测量报告.pdf", summary: "眼轴测量原始报告。" }, rows: [{ item: "眼轴长度", od: "25.34", os: "24.25", unit: "mm" }] },
    { ...common, group: "角膜内皮", source: "医技检查", reporterName: "徐英男", reportTime: "2026-08-02 09:50", reportId: "PACS-20260802-6642", valueOrigin: "接口自动获取", report: { kind: "图片", name: "角膜内皮报告.jpg", summary: "角膜内皮检查原始报告。" }, rows: [{ item: "角膜内皮细胞密度 CD", od: "3371", os: "3244", unit: "个/mm²" }] },
    { ...common, group: "眼表综合报告", source: "医技检查", reporterName: "张功平", reportTime: "2026-08-02 10:05", reportId: "PACS-20260802-6688", valueOrigin: "医生手工录入", report: { kind: "图片", name: "眼表综合报告.jpg", summary: "PACS 仅返回报告图片，医生据报告补录。" }, rows: [
      { item: "NIBUT First", od: "9.05", os: "7.31", unit: "s", reference: ">10" }, { item: "NIBUT Average", od: "18.03", os: "24.92", unit: "s", reference: ">14" }, { item: "泪河高度 TMH", od: "0.25", os: "0.26", unit: "mm", reference: ">0.20" },
    ] },
    { ...common, group: "散瞳医学验光", source: "医技检查", reportId: "OPT-20260802-0907", valueOrigin: "接口自动获取", report: { kind: "报告正文", name: "散瞳医学验光报告", summary: "结构化结果及报告正文。" }, rows: [
      { item: "球镜", od: "-5.00", os: "-4.75", unit: "D" }, { item: "柱镜", od: "-0.75", os: "-0.50", unit: "D" }, { item: "轴位", od: "10", os: "175", unit: "°", reference: "0–180" }, { item: "矫正视力", od: "1.0", os: "1.0" }, { item: "棱镜（选填）", od: "", os: "", unit: "△" },
    ] },
    { ...common, group: "小瞳医学验光", source: "医技检查", reportId: "OPT-20260802-0910", valueOrigin: "接口自动获取", report: { kind: "报告正文", name: "小瞳医学验光报告", summary: "结构化结果及报告正文。" }, rows: [
      { item: "球镜", od: "-5.25", os: "-5.00", unit: "D" }, { item: "柱镜", od: "-0.75", os: "-0.50", unit: "D" }, { item: "轴位", od: "10", os: "175", unit: "°", reference: "0–180" }, { item: "矫正视力", od: "1.0", os: "1.0" }, { item: "棱镜（选填）", od: "", os: "", unit: "△" },
    ] },
  ];
}

export function createArchiveSeed(): ContactLensArchive {
  return {
    id: "CL-20260802-0001",
    patientId: "V00000009340",
    treatmentPlan: "角膜接触镜标准治疗方案",
    currentTreatmentMethod: "OK镜",
    responsibleDoctor: "方红全",
    institution: "南京医科大学附属眼科医院",
    department: "眼视光中心",
    createdAt: "2026-08-02 10:42",
    updatedAt: "2026-08-02 10:44",
    cycleNumber: 1,
    note: "",
    status: "基本档案待完成",
    currentNode: "基线评估",
    baselineTemplate: { id: "CL_BASELINE_V1", name: "角膜接触镜基础档案基线模板", version: "1.0" },
    baseline: {
      status: "评估中",
      purpose: "控制近视进展，改善白天裸眼视力",
      lensHistory: "曾配戴框架眼镜3年，未配戴角膜接触镜",
      systemicHistory: "否认全身系统性疾病",
      eyeHistory: "否认眼部手术及外伤史；无长期眼部用药",
      allergyHistory: "否认药物过敏史",
      correctionHistory: "框架眼镜",
      workAndLife: "学生；每日户外活动约1小时",
      electronicUsage: "手机及平板约3小时/日",
      doctorConclusion: "配前检查基本符合角膜接触镜验配条件，待眼表综合报告返回后完成评估。",
    },
    checks: createBaselineChecks(),
    /* legacy sample retained below for reference
      { group: "视力与眼压", source: "护士采集", reportId: "VS-20260802-1026", reportDate: "2026-08-02 10:26", snapshotAt: "2026-08-02 10:43", status: "已获取", valueOrigin: "接口自动获取", rows: [
        { item: "裸眼视力", od: "CF-50cm", os: "1.0" }, { item: "矫正视力", od: "1.0", os: "1.0" }, { item: "眼压", od: "19", os: "18", unit: "mmHg", reference: "10–21" }, { item: "主视眼", od: "—", os: "主视眼" },
      ] },
      { group: "眼部健康", source: "医生查体", reportId: "EX-20260802-0018", reportDate: "2026-08-02 10:35", snapshotAt: "2026-08-02 10:44", status: "已获取", valueOrigin: "医生手工录入", rows: [
        { item: "睑裂高度", od: "9.0", os: "9.0", unit: "mm" }, { item: "结膜", od: "（-）", os: "（-）" }, { item: "角膜", od: "基质层散在白色颗粒混浊", os: "基质层散在白色颗粒混浊" }, { item: "晶体", od: "（-）", os: "（-）" }, { item: "散瞳眼底", od: "（-）", os: "（-）" },
      ] },
      { group: "角膜与生物测量", source: "医技检查", reportId: "PACS-20260802-6621", reportDate: "2026-08-02 09:58", snapshotAt: "2026-08-02 10:44", status: "已获取", valueOrigin: "接口自动获取", report: { kind: "PDF", name: "角膜地形图及眼生物测量报告.pdf", summary: "PACS 已回传 PDF 报告及部分结构化指标。" }, rows: [
        { item: "角膜横径", od: "11.5", os: "11.7", unit: "mm" }, { item: "暗光瞳孔直径", od: "5.2", os: "6.6", unit: "mm" }, { item: "角膜地形图 Ks曲率", od: "43.83", os: "43.60", unit: "D" }, { item: "角膜地形图 Ks轴位", od: "83", os: "159", unit: "°" }, { item: "角膜地形图 MinK曲率", od: "42.79", os: "43.10", unit: "D" }, { item: "角膜地形图 MinK轴位", od: "179", os: "63", unit: "°" }, { item: "眼轴", od: "25.34", os: "24.25", unit: "mm" }, { item: "角膜厚度（最薄点）", od: "607", os: "592", unit: "μm" }, { item: "角膜内皮计数 CD", od: "3371", os: "3244", unit: "个/mm²" },
      ] },
      { group: "眼表综合报告", source: "医技检查", reportId: "PACS-20260802-6688", reportDate: "2026-08-02 10:05", snapshotAt: "—", status: "已获取", valueOrigin: "医生手工录入", report: { kind: "图片", name: "眼表综合报告.jpg", summary: "PACS 仅返回报告图片，指标由医生查看报告后录入。" }, rows: [
        { item: "NIBUT First / Average", od: "9.05 / 18.03", os: "7.31 / 24.92", unit: "s", reference: "First >10s；Average >14s" }, { item: "泪河高度 TMH", od: "0.25", os: "0.26", unit: "mm", reference: ">0.20" },
      ] },
      { group: "医学验光", source: "医技检查", reportId: "OPT-20260802-0907", reportDate: "2026-08-02 09:07", snapshotAt: "2026-08-02 10:44", status: "已获取", valueOrigin: "接口自动获取", report: { kind: "报告正文", name: "医学验光报告", summary: "验光系统返回结构化结果及报告正文。" }, rows: [
        { item: "散瞳验光", od: "-5.00DS/-0.75DC×10", os: "-4.75DS/-0.50DC×175" }, { item: "小瞳验光", od: "-5.25DS/-0.75DC×10", os: "-5.00DS/-0.50DC×175" },
      ] },
    ], */
    methodHistory: [{ method: "OK镜", startedAt: "2026-08-02", doctor: "方红全" }],
    timeline: [
      { date: "2026-08-02 10:42", title: "建立角膜接触镜档案", detail: "角膜接触镜标准治疗方案 · 初始治疗方式：OK镜", state: "done" },
      { date: "当前", title: "基线评估", detail: "健康背景已填写，眼表综合报告待返回", state: "current" },
      { date: "待开始", title: "试戴", detail: "基线评估完成后按治疗方案进入", state: "future" },
      { date: "待开始", title: "定片、交付与复查", detail: "后续治疗节点，本轮暂不开放表单", state: "future" },
    ],
  };
}

export function createArchiveSeeds(): ContactLensArchive[] {
  const contactLens = createArchiveSeed();
  const visualTraining: ContactLensArchive = {
    ...structuredClone(contactLens),
    id: "VT-20260718-0003",
    treatmentPlan: "视功能训练方案",
    currentTreatmentMethod: "其他",
    responsibleDoctor: "张功平",
    createdAt: "2026-07-18 15:20",
    updatedAt: "2026-08-01 16:05",
    status: "治疗中",
    currentNode: "训练第3阶段",
    baselineTemplate: { id: "VT_BASELINE_V1", name: "视功能训练基线模板", version: "1.0" },
    methodHistory: [{ method: "其他", startedAt: "2026-07-18", doctor: "张功平" }],
    timeline: [{ date: "2026-07-18 15:20", title: "建立视功能治疗档案", detail: "完成初次评估", state: "done" }, { date: "当前", title: "训练第3阶段", detail: "每周训练2次", state: "current" }],
  };
  return [contactLens, visualTraining];
}
