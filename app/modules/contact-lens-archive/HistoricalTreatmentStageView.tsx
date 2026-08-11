"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { MethodStageDetail } from "./archive-store";

type Tab = "record" | "tracking" | "overview";

export function HistoricalTreatmentStageView({ detail, onBack, onReport }: { detail: MethodStageDetail | null; onBack: () => void; onReport: (name: string) => void }) {
  const [tab, setTab] = useState<Tab>("record");
  if (!detail) return null;
  return createPortal(<section className="cl-history-workspace-layer" aria-label="历史治疗阶段">
    <header className="cl-history-stage-banner"><div><span>历史治疗阶段 · 只读</span><h2>{detail.method}</h2><p>{detail.startedAt} 至 {detail.endedAt || "今"}　操作医生：{detail.doctor}　原因：{detail.reason}</p></div><button className="button primary" onClick={onBack}>← 返回当前治疗阶段</button></header>
    <nav className="cl-tabs"><button className={tab === "record" ? "active" : ""} onClick={() => setTab("record")}>专科病历</button><button className={tab === "tracking" ? "active" : ""} onClick={() => setTab("tracking")}>治疗跟踪</button><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>专科视图</button></nav>
    <main className="cl-history-stage-body">
      {tab === "record" && <section className="sr-history-page"><header><div><h2>{detail.method}阶段专科病历</h2><p>按就诊时间倒序，展示该治疗阶段内全部专科病历</p></div><span>共 {detail.records.length} 份</span></header><div className="sr-history-table-wrap"><table className="sr-history-table"><thead><tr><th>就诊日期</th><th>科室 / 接诊医生</th><th>主诉及现病史摘要</th><th>专科检查摘要</th><th>诊断、处理及医嘱</th></tr></thead><tbody>{detail.records.map((record, index) => <tr key={`${record.date}-${index}`}><td><b>{record.date}</b><small>{index === 0 ? "阶段最近一次" : "复诊"}</small></td><td>{record.department}<small>{record.doctor}</small></td><td>{record.summary}</td><td>{detail.examinations.slice(0, 2).map((item) => item.name).join("、")}</td><td>{detail.dispositions[0]?.diagnosis}<small>{detail.dispositions[0]?.advice}</small></td></tr>)}</tbody></table></div></section>}
      {tab === "tracking" && <section className="cl-panel"><div className="cl-panel-head"><div><h2>{detail.method}阶段治疗跟踪</h2><p>复用当前治疗跟踪结构，展示阶段内试戴、定片、订单、交付、复查与处置</p></div><span className="cl-plan-badge">历史阶段 · 只读</span></div><div className="cl-history-treatment-list">{detail.treatmentEvents.map((event, index) => <article key={`${event.date}-${index}`}><time>{event.date}</time><span>{index + 1}</span><div><h3>{event.node}</h3><p>{event.detail}</p></div><em>已归档</em></article>)}</div></section>}
      {tab === "overview" && <div className="cl-overview"><div className="cl-overview-head"><div><span>历史治疗阶段</span><h2>{detail.method}</h2><p>{detail.startedAt} 至 {detail.endedAt || "今"}</p></div><div className="cl-current-method"><span>阶段状态</span><b>{detail.status}</b><small>{detail.reason}</small></div></div><div className="cl-summary-grid"><div><span>专科病历</span><b>{detail.records.length} 份</b></div><div><span>检查记录</span><b>{detail.examinations.length} 项</b></div><div><span>诊断处置</span><b>{detail.dispositions.length} 条</b></div><div><span>治疗节点</span><b>{detail.treatmentEvents.length} 条</b></div></div><section className="cl-panel"><div className="cl-panel-head"><div><h2>阶段检查与报告</h2><p>该阶段保存的检查结果与原始报告</p></div></div><div className="cl-history-exams">{detail.examinations.map((exam) => <article key={`${exam.name}-${exam.date}`}><div><b>{exam.name}</b><small>{exam.date}</small><p>{exam.summary}</p></div>{exam.hasOriginalReport && <button className="button" onClick={() => onReport(exam.name)}>查看原始报告</button>}</article>)}</div></section></div>}
    </main>
  </section>, document.body);
}
