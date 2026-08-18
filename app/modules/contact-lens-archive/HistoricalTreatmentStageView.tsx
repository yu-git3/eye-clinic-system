"use client";

import { useMemo, useState } from "react";
import type { ContactLensArchive, MethodStageDetail } from "./archive-store";
import { SpecialtyRecordModule } from "../specialty-record/SpecialtyRecordModule";
import { createSpecialtyRecordSeed, type SpecialtyHistoryItem } from "../specialty-record/specialty-record-store";
import { createEyeHealthInstance } from "../exam-runtime/exam-engine";

type Tab = "record" | "tracking" | "overview";

export function HistoricalTreatmentStageView({ archive, detail, onBack, onReport }: { archive: ContactLensArchive | null; detail: MethodStageDetail | null; onBack: () => void; onReport: (name: string) => void }) {
  const [tab, setTab] = useState<Tab>("record");
  const stageHistory = useMemo<SpecialtyHistoryItem[]>(() => detail?.records.map((record, index) => ({
    ...createSpecialtyRecordSeed(),
    id: `${detail.id}-RECORD-${index + 1}`,
    visitDate: record.date,
    department: record.department,
    doctor: record.doctor,
    treatmentPlan: archive?.treatmentPlan ?? "",
    treatmentMethod: detail.method,
    archiveId: archive?.id ?? "",
    complaintSummary: record.summary,
    examSummary: detail.examinations.map((item) => item.name).join("、"),
    planSummary: `${detail.dispositions[0]?.diagnosis ?? "—"}；${detail.dispositions[0]?.advice ?? "—"}`,
    status: "已保存",
  })) ?? [], [archive?.id, archive?.treatmentPlan, detail]);
  const stageArchive = useMemo<ContactLensArchive | null>(() => archive && detail ? {
    ...structuredClone(archive),
    currentTreatmentMethod: detail.method,
    status: "已完成",
    currentNode: "历史阶段已归档",
    updatedAt: detail.endedAt || detail.startedAt,
    methodHistory: [{ method: detail.method, startedAt: detail.startedAt, endedAt: detail.endedAt, reason: detail.reason, doctor: detail.doctor }],
  } : null, [archive, detail]);
  const stageExam = useMemo(() => createEyeHealthInstance(archive?.patientId ?? "HISTORY", detail?.id ?? "HISTORY"), [archive?.patientId, detail?.id]);
  if (!detail || !stageArchive) return null;
  const noOp = () => undefined;
  return <section className="cl-history-workspace-inline" aria-label="历史治疗阶段">
    <header className="cl-history-stage-banner"><div><span>历史治疗阶段 · 只读</span><h2>{detail.method}</h2><p>{detail.startedAt} 至 {detail.endedAt || "今"}　操作医生：{detail.doctor}　原因：{detail.reason}</p></div><button className="button primary" onClick={onBack}>← 返回当前治疗阶段</button></header>
    <nav className="cl-tabs"><button className={tab === "record" ? "active" : ""} onClick={() => setTab("record")}>专科病历</button><button className={tab === "tracking" ? "active" : ""} onClick={() => setTab("tracking")}>治疗跟踪</button><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>专科视图</button></nav>
    <main className="cl-history-stage-body">
      {tab === "record" && <SpecialtyRecordModule archive={stageArchive} checks={stageArchive.checks} eyeHealthExam={stageExam} readOnly historyOverride={stageHistory} historicalStageLabel={`${detail.method}阶段`} onEyeHealthChange={noOp} onRevise={noOp} onReport={(group) => onReport(group.group)} onCreateArchive={noOp} onLoadArchives={noOp} onEditBasic={noOp} onViewBaselineHistory={noOp} onChangeMethod={noOp} onViewMethodHistory={noOp} onComplete={noOp} onTerminate={noOp} onReopen={noOp}/>}
      {tab === "tracking" && <section className="cl-panel"><div className="cl-panel-head"><div><h2>{detail.method}阶段治疗跟踪</h2><p>复用当前治疗跟踪结构，展示阶段内试戴、定片、订单、交付、复查与处置</p></div><span className="cl-plan-badge">历史阶段 · 只读</span></div><div className="cl-history-treatment-list">{detail.treatmentEvents.map((event, index) => <article key={`${event.date}-${index}`}><time>{event.date}</time><span>{index + 1}</span><div><h3>{event.node}</h3><p>{event.detail}</p></div><em>已归档</em></article>)}</div></section>}
      {tab === "overview" && <div className="cl-overview"><div className="cl-overview-head"><div><span>历史治疗阶段</span><h2>{detail.method}</h2><p>{detail.startedAt} 至 {detail.endedAt || "今"}</p></div><div className="cl-current-method"><span>阶段状态</span><b>{detail.status}</b><small>{detail.reason}</small></div></div><div className="cl-summary-grid"><div><span>专科病历</span><b>{detail.records.length} 份</b></div><div><span>检查记录</span><b>{detail.examinations.length} 项</b></div><div><span>诊断处置</span><b>{detail.dispositions.length} 条</b></div><div><span>治疗节点</span><b>{detail.treatmentEvents.length} 条</b></div></div><section className="cl-panel"><div className="cl-panel-head"><div><h2>阶段检查与报告</h2><p>该阶段保存的检查结果与原始报告</p></div></div><div className="cl-history-exams">{detail.examinations.map((exam) => <article key={`${exam.name}-${exam.date}`}><div><b>{exam.name}</b><small>{exam.date}</small><p>{exam.summary}</p></div>{exam.hasOriginalReport && <button className="button" onClick={() => onReport(exam.name)}>查看原始报告</button>}</article>)}</div></section></div>}
    </main>
  </section>;
}
