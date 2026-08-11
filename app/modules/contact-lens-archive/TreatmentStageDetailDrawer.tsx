"use client";

import { GlobalDrawerLayer } from "../../components/GlobalDrawerLayer";
import type { MethodStageDetail } from "./archive-store";

export function TreatmentStageDetailDrawer({ detail, onClose, onReport }: { detail: MethodStageDetail | null; onClose: () => void; onReport: (name: string) => void }) {
  return <GlobalDrawerLayer open={Boolean(detail)} label="治疗阶段详情" onMaskClick={onClose}>{detail && <aside className="drawer cl-stage-drawer">
    <div className="drawer-head"><div><span className="eyebrow">治疗方式历史 · {detail.status}</span><h2>{detail.method} 治疗阶段详情</h2></div><button className="close" onClick={onClose}>×</button></div>
    <div className="drawer-body cl-stage-detail">
      <section><h3>阶段概况</h3><dl><div><dt>治疗方式</dt><dd>{detail.method}</dd></div><div><dt>起止时间</dt><dd>{detail.startedAt} 至 {detail.endedAt || "今"}</dd></div><div><dt>变更原因</dt><dd>{detail.reason}</dd></div><div><dt>操作医生</dt><dd>{detail.doctor}</dd></div></dl></section>
      <section><h3>专科病历</h3>{detail.records.map((record) => <article key={`${record.date}-${record.doctor}`}><b>{record.date}　{record.department}　{record.doctor}</b><p>{record.summary}</p></article>)}</section>
      <section><h3>诊断与处置</h3>{detail.dispositions.map((item, index) => <article key={index}><b>{item.diagnosis}</b><p>处理建议：{item.advice}</p><p>医嘱：{item.order}</p><p>复诊安排：{item.followUp}</p></article>)}</section>
      <section><h3>检查与报告</h3>{detail.examinations.map((exam) => <article className="cl-stage-exam" key={`${exam.name}-${exam.date}`}><div><b>{exam.name}</b><small>{exam.date}</small><p>{exam.summary}</p></div>{exam.hasOriginalReport && <button className="button" onClick={() => onReport(exam.name)}>查看原始报告</button>}</article>)}</section>
      <section><h3>治疗过程</h3>{detail.treatmentEvents.map((event) => <article key={`${event.date}-${event.node}`}><b>{event.date}　{event.node}</b><p>{event.detail}</p></article>)}</section>
    </div>
    <div className="drawer-foot"><button className="button primary" onClick={onClose}>关闭</button></div>
  </aside>}</GlobalDrawerLayer>;
}
