export type TreatmentMethod = "OK镜" | "RGP" | "软性离焦镜" | "巩膜镜" | "其他";
export type ArchiveStatus = "基本档案待完成" | "治疗中" | "已完成" | "已终止";
export type BaselineStatus = "未开始" | "评估中" | "已完成";
export type DataSource = "护士采集" | "医生查体" | "医技检查";
export type ValueOrigin = "接口自动获取" | "医生手工录入" | "自动获取后人工修订";
export type CheckEye = "OD" | "OS" | "OU" | "无眼别";
export type CheckValueKey = "od" | "os" | "ou" | "value";

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
  rows: Array<{ item: string; od: string; os: string; ou?: string; value?: string; eyeRule?: CheckEye[]; options?: string[]; originalOd?: string; originalOs?: string; originalOu?: string; originalValue?: string; unit?: string; reference?: string; revision?: { revisedBy: string; revisedAt: string } }>;
};

export function getCheckRowPresentation(row: CheckSnapshot["rows"][number]): { kind: "multi-eye"; eyes: Array<"OD" | "OS" | "OU"> } | { kind: "single"; eye: "无眼别"; valueKey: "value" } {
  if (row.eyeRule?.includes("无眼别")) return { kind: "single", eye: "无眼别", valueKey: "value" };
  const configured = (row.eyeRule ?? ["OD", "OS"]).filter((eye): eye is "OD" | "OS" | "OU" => eye !== "无眼别");
  return { kind: "multi-eye", eyes: configured };
}

export type BaselineTemplateRef = { id: string; name: string; version: string };

export type BaselineVersion = {
  id: string;
  versionNo: number;
  status: "编辑中" | "已完成" | "历史版本";
  createdReason: "首次建档" | "终止后重新开启";
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  derivedFromId?: string;
  baseline: Baseline;
};

export type TreatmentCycle = {
  id: string;
  cycleNo: number;
  methodCycleNo: number;
  method: TreatmentMethod;
  type: "首次验配" | "到期换片" | "破损换片" | "参数调整" | "重新开启";
  startedAt: string;
  endedAt?: string;
  status: "进行中" | "已完成" | "已终止";
  baselineVersionId: string;
};

export type MethodStage = {
  method: TreatmentMethod;
  startedAt: string;
  endedAt?: string;
  reason?: string;
  doctor: string;
  assessmentStrategy?: string;
};

export type MethodStageDetail = MethodStage & {
  id: string;
  status: "当前使用" | "历史阶段";
  records: Array<{ date: string; department: string; doctor: string; summary: string }>;
  dispositions: Array<{ diagnosis: string; advice: string; order: string; followUp: string }>;
  examinations: Array<{ name: string; date: string; summary: string; hasOriginalReport: boolean }>;
  treatmentEvents: Array<{ date: string; node: string; detail: string }>;
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
  currentBaselineVersionId: string;
  baselineVersions: BaselineVersion[];
  treatmentCycles: TreatmentCycle[];
  checks: CheckSnapshot[];
  methodHistory: MethodStage[];
  timeline: TimelineEvent[];
  cycleClosures: Array<{
    cycleNumber: number;
    result: "已完成" | "已终止";
    endedAt: string;
    operator: string;
    conclusion: string;
  }>;
};

export type CheckValueRevision = {
  group: string;
  item: string;
  eye: CheckValueKey;
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
  return { ...archive, status: "已终止", updatedAt: input.endedAt, currentNode: "档案已终止", treatmentCycles: archive.treatmentCycles.map((item) => item.cycleNo === archive.cycleNumber ? { ...item, status: "已终止" as const, endedAt: input.endedAt } : item), cycleClosures: [...archive.cycleClosures, { cycleNumber: archive.cycleNumber, result: "已终止", endedAt: input.endedAt, operator: input.operator, conclusion: input.reason }], timeline: [...archive.timeline, { date: input.endedAt, title: "终止档案", detail: `${input.reason}；操作人：${input.operator}`, state: "change" }] };
}

export function completeArchive(archive: ContactLensArchive, input: { completedAt: string; conclusion: string; operator: string }): ContactLensArchive {
  return { ...archive, status: "已完成", updatedAt: input.completedAt, currentNode: "治疗已完成", treatmentCycles: archive.treatmentCycles.map((item) => item.cycleNo === archive.cycleNumber ? { ...item, status: "已完成" as const, endedAt: input.completedAt } : item), cycleClosures: [...archive.cycleClosures, { cycleNumber: archive.cycleNumber, result: "已完成", endedAt: input.completedAt, operator: input.operator, conclusion: input.conclusion }], timeline: [...archive.timeline, { date: input.completedAt, title: `第${archive.cycleNumber}周期治疗完成`, detail: `${input.conclusion}；完成人：${input.operator}`, state: "done" }] };
}

export function startTreatmentCycle(archive: ContactLensArchive, input: { startedAt: string; type: TreatmentCycle["type"] }): ContactLensArchive {
  const nextNo = archive.cycleNumber + 1;
  const methodCycleNo = archive.treatmentCycles.filter((item) => item.method === archive.currentTreatmentMethod).length + 1;
  return { ...archive, status: "治疗中", updatedAt: input.startedAt, cycleNumber: nextNo, currentNode: input.type, treatmentCycles: [...archive.treatmentCycles, { id: `${archive.id}-C${nextNo}`, cycleNo: nextNo, methodCycleNo, method: archive.currentTreatmentMethod, type: input.type, startedAt: input.startedAt, status: "进行中", baselineVersionId: archive.currentBaselineVersionId }], timeline: [...archive.timeline, { date: input.startedAt, title: `开始第${nextNo}治疗周期`, detail: `${input.type}；沿用基础档案V${archive.baselineVersions.find((item) => item.id === archive.currentBaselineVersionId)?.versionNo ?? 1}`, state: "current" }] };
}

export function reopenArchive(archive: ContactLensArchive, input: { startedAt: string; reason: string; operator: string; baselineAction: "沿用当前基础档案" | "重新建立基础档案"; rebuildMode?: "复制上一版本" | "使用空白模板" }): ContactLensArchive {
  const nextNo = archive.cycleNumber + 1;
  let baseline = archive.baseline;
  let currentBaselineVersionId = archive.currentBaselineVersionId;
  let baselineVersions = archive.baselineVersions;
  if (input.baselineAction === "重新建立基础档案") {
    const previous = archive.baselineVersions.find((item) => item.id === archive.currentBaselineVersionId)!;
    const versionNo = Math.max(...archive.baselineVersions.map((item) => item.versionNo)) + 1;
    baseline = input.rebuildMode === "使用空白模板" ? { status: "未开始", purpose: "", lensHistory: "", systemicHistory: "", eyeHistory: "", allergyHistory: "", correctionHistory: "", workAndLife: "", electronicUsage: "", doctorConclusion: "" } : { ...structuredClone(previous.baseline), status: "评估中", completedAt: undefined };
    currentBaselineVersionId = `${archive.id}-BASE-V${versionNo}`;
    baselineVersions = [...archive.baselineVersions.map((item) => item.id === previous.id ? { ...item, status: "历史版本" as const } : item), { id: currentBaselineVersionId, versionNo, status: "编辑中", createdReason: "终止后重新开启", createdAt: input.startedAt, derivedFromId: previous.id, baseline: structuredClone(baseline) }];
  }
  const requiresBaseline = input.baselineAction === "重新建立基础档案";
  const methodCycleNo = archive.treatmentCycles.filter((item) => item.method === archive.currentTreatmentMethod).length + 1;
  return { ...archive, baseline, currentBaselineVersionId, baselineVersions, status: requiresBaseline ? "基本档案待完成" : "治疗中", updatedAt: input.startedAt, cycleNumber: nextNo, currentNode: requiresBaseline ? "重新建立基础档案" : "治疗计划恢复", treatmentCycles: [...archive.treatmentCycles, { id: `${archive.id}-C${nextNo}`, cycleNo: nextNo, methodCycleNo, method: archive.currentTreatmentMethod, type: "重新开启", startedAt: input.startedAt, status: "进行中", baselineVersionId: currentBaselineVersionId }], timeline: [...archive.timeline, { date: input.startedAt, title: `重新开启第${nextNo}治疗周期`, detail: `${input.reason}；操作人：${input.operator}；${input.baselineAction}${requiresBaseline ? `（${input.rebuildMode}）` : ""}`, state: "current" }] };
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

export function createMethodStageDetails(archive: ContactLensArchive): MethodStageDetail[] {
  return archive.methodHistory.map((stage, index) => {
    const current = index === archive.methodHistory.length - 1;
    const date = stage.startedAt.slice(0, 10);
    return {
      ...stage,
      id: `${archive.id}-METHOD-${index + 1}`,
      status: current ? "当前使用" : "历史阶段",
      reason: stage.reason || "建档时确定",
      records: current
        ? [{ date, department: archive.department, doctor: stage.doctor, summary: "复诊评估，确认当前治疗方式及随访计划。" }]
        : [
            { date: "2026-02-12", department: archive.department, doctor: "徐珊珊", summary: "复诊评估戴镜效果，裸眼视力稳定，建议继续随访。" },
            { date: "2025-08-28", department: archive.department, doctor: "徐英男", summary: "复查角膜与眼轴变化，调整护理与复诊安排。" },
            { date: stage.startedAt, department: archive.department, doctor: stage.doctor, summary: "初诊建档，完成配前评估并确定治疗方式。" },
          ],
      dispositions: [{ diagnosis: "屈光不正（近视）", advice: current ? "继续当前治疗方式，按计划复查。" : "完成配前检查，规范开展接触镜治疗。", order: current ? "角膜地形图、眼表综合检查" : "验光、角膜地形图、眼生物测量", followUp: current ? "1个月后复诊" : "试戴后复诊" }],
      examinations: archive.checks.slice(0, current ? 3 : 4).map((check) => ({ name: check.group, date: check.reportDate, summary: check.rows.slice(0, 2).map((row) => `${row.item} OD ${row.od} / OS ${row.os}`).join("；"), hasOriginalReport: Boolean(check.report) })),
      treatmentEvents: current
        ? [{ date, node: archive.currentNode, detail: `${stage.method}治疗进行中` }]
        : [
            { date: stage.startedAt, node: "试戴评估", detail: `完成${stage.method}试戴与配适评估` },
            { date: "2025-05-16", node: "定片下单", detail: "确认镜片参数并完成订单" },
            { date: "2025-05-24", node: "镜片交付", detail: "完成验片、交付与护理指导" },
            { date: "2025-08-28", node: "阶段复查", detail: "完成角膜地形图、眼轴及眼表复查" },
            { date: stage.endedAt || date, node: "阶段已结束", detail: `${stage.method}阶段资料已归档` },
          ],
    };
  }).reverse();
}

export function reviseCheckValue(archive: ContactLensArchive, input: CheckValueRevision): ContactLensArchive {
  return {
    ...archive,
    checks: archive.checks.map((group) => group.group !== input.group ? group : {
      ...group,
      valueOrigin: group.valueOrigin === "医生手工录入" ? group.valueOrigin : "自动获取后人工修订",
      rows: group.rows.map((row) => {
        if (row.item !== input.item) return row;
        const originalKey = input.eye === "od" ? "originalOd" : input.eye === "os" ? "originalOs" : input.eye === "ou" ? "originalOu" : "originalValue";
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
      { item: "裸眼视力", od: "CF-50cm", os: "1.0", ou: "0.8", eyeRule: ["OD", "OS", "OU"] }, { item: "矫正视力", od: "1.0", os: "1.0", eyeRule: ["OD", "OS"] }, { item: "眼压", od: "19", os: "18", unit: "mmHg", reference: "10–21", eyeRule: ["OD", "OS"] }, { item: "主视眼", od: "", os: "", value: "右眼", eyeRule: ["无眼别"], options: ["右眼", "左眼"] },
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
  const archive: ContactLensArchive = {
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
    currentBaselineVersionId: "CL-20260802-0001-BASE-V1",
    baselineVersions: [],
    treatmentCycles: [{ id: "CL-20260802-0001-C1", cycleNo: 1, methodCycleNo: 1, method: "OK镜", type: "首次验配", startedAt: "2026-08-02 10:42", status: "进行中", baselineVersionId: "CL-20260802-0001-BASE-V1" }],
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
    cycleClosures: [],
  };
  archive.baselineVersions = [{ id: archive.currentBaselineVersionId, versionNo: 1, status: "已完成", createdReason: "首次建档", createdAt: archive.createdAt, completedAt: "2026-08-02 11:18", completedBy: "方红全", baseline: structuredClone(archive.baseline) }];
  return archive;
}

export function createArchiveSeeds(): ContactLensArchive[] {
  const contactLens = createArchiveSeed();
  contactLens.status = "治疗中";
  contactLens.currentNode = "复查随访";
  contactLens.baseline = { ...contactLens.baseline, status: "已完成", completedAt: "2026-08-02 11:18" };
  contactLens.methodHistory = [
    { method: "软性离焦镜", startedAt: "2025-05-10", endedAt: "2026-08-02", reason: "治疗效果调整", doctor: "徐英男" },
    { method: "OK镜", startedAt: "2026-08-02", reason: "患者需求变化", doctor: "方红全", assessmentStrategy: "沿用近期检查并补充评估" },
  ];
  let visualTraining: ContactLensArchive = {
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
    currentBaselineVersionId: "VT-20260718-0003-BASE-V1",
    baselineVersions: [{ id: "VT-20260718-0003-BASE-V1", versionNo: 1, status: "已完成", createdReason: "首次建档", createdAt: "2026-07-18 15:20", completedAt: "2026-07-18 16:05", completedBy: "张功平", baseline: structuredClone(contactLens.baseline) }],
    treatmentCycles: [{ id: "VT-20260718-0003-C1", cycleNo: 1, methodCycleNo: 1, method: "其他", type: "首次验配", startedAt: "2026-07-18 15:20", status: "进行中", baselineVersionId: "VT-20260718-0003-BASE-V1" }],
    methodHistory: [{ method: "其他", startedAt: "2026-07-18", doctor: "张功平" }],
    timeline: [{ date: "2026-07-18 15:20", title: "建立视功能治疗档案", detail: "完成初次评估", state: "done" }, { date: "当前", title: "训练第3阶段", detail: "每周训练2次", state: "current" }],
    cycleClosures: [],
  };
  visualTraining = completeArchive(visualTraining, { completedAt: "2026-08-12 16:30", operator: "张功平", conclusion: "本阶段视功能训练目标已完成，转入家庭训练并定期复查。" });

  const reopenedBase: ContactLensArchive = {
    ...structuredClone(contactLens),
    id: "MY-20260410-0008",
    treatmentPlan: "近视综合干预方案",
    currentTreatmentMethod: "软性离焦镜",
    responsibleDoctor: "徐英男",
    createdAt: "2026-04-10 09:20",
    updatedAt: "2026-07-01 10:00",
    cycleNumber: 1,
    currentBaselineVersionId: "MY-20260410-0008-BASE-V1",
    baselineVersions: [{ id: "MY-20260410-0008-BASE-V1", versionNo: 1, status: "已完成", createdReason: "首次建档", createdAt: "2026-04-10 09:20", completedAt: "2026-04-10 10:05", completedBy: "徐英男", baseline: structuredClone(contactLens.baseline) }],
    treatmentCycles: [{ id: "MY-20260410-0008-C1", cycleNo: 1, methodCycleNo: 1, method: "软性离焦镜", type: "首次验配", startedAt: "2026-04-10 09:20", status: "进行中", baselineVersionId: "MY-20260410-0008-BASE-V1" }],
    methodHistory: [{ method: "软性离焦镜", startedAt: "2026-04-10", doctor: "徐英男" }],
    cycleClosures: [],
  };
  const terminated = terminateArchive(reopenedBase, { endedAt: "2026-07-01 10:00", reason: "患者暑期暂缓治疗", operator: "徐英男" });
  const reopened = reopenArchive(terminated, { startedAt: "2026-08-15 09:30", reason: "患者返院继续治疗", operator: "徐英男", baselineAction: "重新建立基础档案", rebuildMode: "复制上一版本" });
  reopened.baseline = { ...reopened.baseline, status: "已完成", completedAt: "2026-08-15 10:10" };
  reopened.baselineVersions = reopened.baselineVersions.map((item) => item.id === reopened.currentBaselineVersionId ? { ...item, status: "已完成", completedAt: "2026-08-15 10:10", completedBy: "徐英男", baseline: structuredClone(reopened.baseline) } : item);
  reopened.status = "治疗中";
  reopened.currentNode = "重新开启后复查";

  return [contactLens, visualTraining, reopened];
}
