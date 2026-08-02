export type Eye = "od" | "os";
export type FindingStatus = "正常" | "异常";

export type EyeFinding = { status: FindingStatus; value: string };
export type ExamResult = { code: string; name: string; normalText: string; abnormalOptions: string[]; od: EyeFinding; os: EyeFinding };
export type ExamInstance = {
  id: string;
  patientId: string;
  visitId: string;
  templateId: "EYE_HEALTH_V1";
  templateName: string;
  templateVersion: string;
  status: "待确认" | "已暂存" | "已完成";
  syncStatus: "未同步" | "已同步" | "同步失败" | "待病历修改";
  results: ExamResult[];
  generatedText: string;
};

export const eyeHealthTemplate = [
  ["EYELID", "眼睑", "眼睑正常", ["上睑倒睫", "下睑倒睫", "内翻", "外翻", "红肿"]],
  ["PALPEBRAL_CONJUNCTIVA", "睑结膜", "睑结膜无明显充血", ["轻度充血", "中度充血", "重度充血", "滤泡", "乳头"]],
  ["BULBAR_CONJUNCTIVA", "球结膜", "球结膜无明显充血", ["轻度充血", "中度充血", "重度充血", "分泌物"]],
  ["UPPER_PUNCTUM", "上泪小点", "上泪小点位置正常", ["狭窄", "闭塞", "外翻"]],
  ["LOWER_PUNCTUM", "下泪小点", "下泪小点位置正常", ["狭窄", "闭塞", "外翻"]],
  ["CORNEA", "角膜", "角膜清亮", ["散在点染", "鼻下方散在点染", "上皮缺损", "混浊", "水肿", "瘢痕"]],
  ["ANTERIOR_CHAMBER", "前房", "前房不浅，周深>1/4CT，未见明显异常", ["前房浅", "炎症细胞", "积脓", "积血"]],
  ["IRIS", "虹膜", "虹膜纹理清", ["纹理不清", "后粘连", "新生血管"]],
  ["PUPIL", "瞳孔", "瞳孔等圆", ["不等大", "不圆", "对光反射迟钝"]],
  ["LENS", "晶体", "晶状体透明", ["混浊", "人工晶体", "无晶体"]],
  ["VITREOUS", "玻璃体", "玻璃体未见明显混浊", ["混浊", "出血"]],
  ["FUNDUS", "眼底", "眼底未见明显异常", ["视盘异常", "黄斑异常", "视网膜异常"]],
  ["EYE_POSITION", "眼位", "眼位正", ["内斜", "外斜", "垂直斜视"]],
  ["EYE_MOVEMENT", "眼球运动", "眼球运动自如", ["受限", "震颤"]],
  ["GLOBE", "眼球大小", "眼球大小基本正常", ["眼球突出", "眼球内陷", "大小异常"]],
] as const;

export function createEyeHealthInstance(patientId: string, visitId: string): ExamInstance {
  const results = eyeHealthTemplate.map(([code, name, normalText, abnormalOptions]) => ({
    code, name, normalText, abnormalOptions: [...abnormalOptions],
    od: { status: "正常" as const, value: normalText },
    os: { status: "正常" as const, value: normalText },
  }));
  const exam: ExamInstance = { id: `EX-${visitId}-EYE`, patientId, visitId, templateId: "EYE_HEALTH_V1", templateName: "眼健康检查", templateVersion: "1.0", status: "待确认", syncStatus: "未同步", results, generatedText: "" };
  return { ...exam, generatedText: generateMedicalRecordText(exam) };
}

export function setFinding(exam: ExamInstance, code: string, eye: Eye, status: FindingStatus, value?: string): ExamInstance {
  const results = exam.results.map((item) => item.code !== code ? item : { ...item, [eye]: { status, value: status === "异常" && value ? `${item.name}${value}` : item.normalText } });
  const next = { ...exam, results };
  return { ...next, generatedText: generateMedicalRecordText(next) };
}

export function setEyeNormal(exam: ExamInstance, eye?: Eye): ExamInstance {
  const results = exam.results.map((item) => ({ ...item,
    od: !eye || eye === "od" ? { status: "正常" as const, value: item.normalText } : item.od,
    os: !eye || eye === "os" ? { status: "正常" as const, value: item.normalText } : item.os,
  }));
  const next = { ...exam, results };
  return { ...next, generatedText: generateMedicalRecordText(next) };
}

export function copyEye(exam: ExamInstance, from: Eye, to: Eye): ExamInstance {
  const results = exam.results.map((item) => ({ ...item, [to]: { ...item[from] } }));
  const next = { ...exam, results };
  return { ...next, generatedText: generateMedicalRecordText(next) };
}

export function generateMedicalRecordText(exam: ExamInstance): string {
  const od = exam.results.map((item) => item.od.value).join("；");
  const os = exam.results.map((item) => item.os.value).join("；");
  return od === os ? `双眼：${od}；` : `右眼：${od}；\n左眼：${os}；`;
}

export function reuseExamInstance(instances: ExamInstance[], patientId: string, visitId: string, templateId: string) {
  return instances.find((item) => item.patientId === patientId && item.visitId === visitId && item.templateId === templateId);
}
