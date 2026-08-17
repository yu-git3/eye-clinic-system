"use client";

import { useMemo, useState } from "react";
import { GlobalDrawerLayer } from "../../components/GlobalDrawerLayer";
import type { ContactLensArchive } from "../contact-lens-archive/archive-store";
import { CheckCard } from "../contact-lens-archive/OrderedBaselineEditor";
import { ExamEntryContent } from "../exam-runtime/ExamEntryPanel";
import type { ExamInstance } from "../exam-runtime/exam-engine";
import {
  buildOutpatientRecordText,
  createHistorySeeds,
  createSpecialtyRecordSeed,
  filterExamTemplates,
  removeSelectedExam,
  validateSpecialtyRecord,
  type SelectedExamRef,
  type SpecialtyHistoryItem,
  type SpecialtyRecord,
} from "./specialty-record-store";

type Check = ContactLensArchive["checks"][number];
type Props = {
  archive: ContactLensArchive | null;
  checks: Check[];
  eyeHealthExam: ExamInstance;
  readOnly: boolean;
  onEyeHealthChange: (exam: ExamInstance) => void;
  onRevise: (group: string, item: string, eye: "od" | "os", value: string) => void;
  onReport: (group: Check) => void;
  onCreateArchive: () => void;
  onLoadArchives: () => void;
  onEditBasic: () => void;
  onChangeMethod: () => void;
  onViewMethodHistory: () => void;
  onComplete: () => void;
  onTerminate: () => void;
  onReopen: () => void;
};

export function SpecialtyRecordModule(props: Props) {
  const [record, setRecord] = useState<SpecialtyRecord>(() => createSpecialtyRecordSeed());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [selectedExams, setSelectedExams] = useState<SelectedExamRef[]>([
    { name: "眼健康检查", origin: "医生添加", saved: false },
    { name: "角膜地形图", origin: "本次医嘱", saved: false },
    { name: "眼生物测量", origin: "本次医嘱", saved: false },
  ]);
  const [selectedHistory, setSelectedHistory] = useState<SpecialtyHistoryItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const history = useMemo(() => createHistorySeeds().sort((a, b) => b.visitDate.localeCompare(a.visitDate)), []);
  const archive = props.archive;
  const locked = archive?.status === "已完成" || archive?.status === "已终止";
  const filteredTemplates = filterExamTemplates(pickerQuery);
  const update = (key: keyof SpecialtyRecord, value: string) => setRecord((current) => ({ ...current, [key]: value }));
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };

  function referenceHistory(item: SpecialtyHistoryItem) {
    setRecord((current) => ({ ...current, complaint: item.complaintSummary, presentIllness: item.presentIllness, plan: item.plan }));
    setSelectedHistory(null);
    setDrawerOpen(true);
    notify(`已引用${item.visitDate}记录，可继续修改`);
  }

  function save(complete: boolean) {
    if (complete) {
      const next = validateSpecialtyRecord(record);
      setErrors(next);
      if (Object.keys(next).length) return;
    }
    setRecord((current) => ({ ...current, status: complete ? "已保存" : "草稿" }));
    if (complete) setSelectedExams((items) => items.map((item) => ({ ...item, saved: true })));
    notify(complete ? "专科病历已保存并回传普通门诊病历" : "专科病历已暂存");
  }

  function addSelected() {
    setSelectedExams((items) => [...items, ...pending.filter((name) => !items.some((item) => item.name === name)).map((name) => ({ name, origin: "医生添加" as const, saved: false }))]);
    setPending([]);
    setPickerOpen(false);
  }

  const archiveBar = archive ? <div className="sr-archive-bar"><div><span className="sr-dot"/><b>治疗方案档案</b><code>{archive.id}</code><span>{archive.treatmentPlan}</span><span className="sr-method" tabIndex={0}>{archive.currentTreatmentMethod}<span className="sr-lens-pop"><b>当前镜片信息</b><small>梦戴维 DreamLite · 已交付使用</small><em>OD　BC 8.50 / DIA 10.6 / -3.00D</em><em>OS　BC 8.55 / DIA 10.6 / -2.75D</em><small>订单：ORD-20260718-026　交付：2026-07-25</small></span></span><button className="sr-history-link" onClick={props.onViewMethodHistory}>查看历史（{archive.methodHistory.length}）</button><em>{archive.status === "基本档案待完成" ? "基本档案待完成" : archive.status}</em><small>责任医生：{archive.responsibleDoctor}　建档：{archive.createdAt}　第{archive.cycleNumber}周期</small></div><div><button onClick={props.onEditBasic}>{props.readOnly || locked ? "查看基本档案" : "编辑基本档案"}</button>{!props.readOnly && !locked && <><button onClick={props.onChangeMethod}>变更治疗方式</button>{archive.status === "治疗中" && <button onClick={props.onComplete}>完成治疗</button>}<button className="danger" onClick={props.onTerminate}>终止档案</button></>}{!props.readOnly && locked && <button onClick={props.onReopen}>重新开启</button>}</div></div> : <div className="sr-archive-empty"><div><b>当前未关联治疗方案档案</b><span>可先完成本次初诊病历，确定治疗方案后再关联基本档案。</span></div><button onClick={props.onLoadArchives}>载入复诊示例</button>{!props.readOnly && <button className="primary" onClick={props.onCreateArchive}>＋ 建立档案</button>}</div>;

  return <div className="sr-page">
    {archiveBar}
    <section className="sr-history-page">
      <header><div><h2>角膜接触镜专科病历</h2><p>历史专科病历默认按就诊时间倒序，共 {history.length} 次就诊</p></div>{!props.readOnly && <button className="primary" onClick={() => setDrawerOpen(true)}>＋ 新建专科病历</button>}</header>
      <div className="sr-history-table-wrap"><table className="sr-history-table" style={{ minWidth: 1280 }}><thead><tr><th>就诊日期</th><th>就诊类型</th><th>科室 / 接诊医生</th><th>主诉及现病史摘要</th><th>专科检查摘要</th><th>诊断、处理及医嘱</th><th>操作</th></tr></thead><tbody>{history.map((item, index) => <tr key={item.id}><td><b>{item.visitDate}</b><small>{index === 0 ? "最近一次" : "复诊"}</small></td><td>复诊</td><td>{item.department}<small>{item.doctor}</small></td><td>{item.complaintSummary}</td><td>{item.examSummary}</td><td>{item.planSummary}<small>治疗方式：{item.treatmentMethod}</small></td><td><button onClick={() => setSelectedHistory(item)}>查看详情</button>{!props.readOnly && <button onClick={() => referenceHistory(item)}>引用上次记录</button>}</td></tr>)}</tbody></table></div>
    </section>

    <GlobalDrawerLayer open={drawerOpen} label="新建角膜接触镜专科病历" onMaskClick={() => setDrawerOpen(false)}>{drawerOpen && <div className="sr-record-drawer"><header className="sr-drawer-head"><div><span>南医眼科固定版</span><h2>新建角膜接触镜专科病历</h2><small>本次就诊：{record.visitDate}　{record.department}　{record.doctor}</small></div><button onClick={() => setDrawerOpen(false)}>×</button></header><div className="sr-drawer-body">
      <section className="sr-basic"><h3>本次治疗信息</h3><dl><div><dt>治疗方案</dt><dd>{archive?.treatmentPlan || "尚未确定"}</dd></div><div><dt>当前治疗方式</dt><dd>{archive?.currentTreatmentMethod || "尚未确定"}</dd></div><div><dt>当前镜片</dt><dd>{archive ? "梦戴维 DreamLite（悬停治疗方式查看参数）" : "暂无当前镜片信息"}</dd></div><div><dt>关联档案</dt><dd>{archive?.id || "未关联"}</dd></div></dl></section>
      {!props.readOnly && <div className="sr-reference"><span>可引用最近一次病史与处理内容，检查结果不会复制。</span><button onClick={() => referenceHistory(history[0])}>引用上次记录</button></div>}
      <section className="sr-section"><h3>主诉与现病史</h3><label>主诉 <i>*</i>{errors.complaint && <em>{errors.complaint}</em>}<textarea disabled={props.readOnly} value={record.complaint} onChange={(e) => update("complaint", e.target.value)}/></label><label>现病史<textarea disabled={props.readOnly} value={record.presentIllness} onChange={(e) => update("presentIllness", e.target.value)}/></label></section>
      <section className="sr-section"><div className="sr-section-head"><div><h3>眼科检查组件</h3><p>医嘱检查自动加载，医生可搜索并批量添加其他检查；添加后直接录入指标。</p></div>{!props.readOnly && <button onClick={() => setPickerOpen(true)}>＋ 添加眼科检查</button>}</div><div className="sr-inline-exams">{selectedExams.map((selection) => {
        const removable = selection.origin === "医生添加" && !selection.saved && !props.readOnly;
        const removeButton = removable ? <button className="sr-remove-exam" onClick={() => setSelectedExams((items) => removeSelectedExam(items, selection.name))}>移除</button> : undefined;
        if (selection.name === "眼健康检查") return <div className="cl-ordered-card" key={selection.name}><div className="sr-check-header-wrap"><header className="cl-check-head"><div><span className="cl-source 医生查体">{selection.origin}</span><b>眼健康检查</b></div><span>录入人：方红全　录入时间：2026-08-02 10:35</span></header>{removeButton}</div><ExamEntryContent exam={props.eyeHealthExam} onChange={props.onEyeHealthChange} embedded/></div>;
        return <CheckCard key={selection.name} group={props.checks.find((group) => group.group === selection.name)} readOnly={props.readOnly} onRevise={props.onRevise} onReport={props.onReport} headerAction={removeButton}/>;
      })}</div></section>
      <section className="sr-section"><h3>专科检查摘要</h3><label>{errors.assessment && <em>{errors.assessment}</em>}<textarea disabled={props.readOnly} value={record.assessment} onChange={(e) => update("assessment", e.target.value)}/><small>由已完成检查组件生成候选文本，医生确认后可修改。</small></label></section>
      <section className="sr-section"><div className="sr-section-head"><div><h3>检查报告与处理建议</h3><p>支持常用语快速插入。</p></div><div className="sr-phrases"><button onClick={() => update("plan", `${record.plan} 继续戴镜随访。`)}>戴镜随访</button><button onClick={() => update("plan", `${record.plan} 强调规范护理。`)}>规范护理</button><button onClick={() => update("plan", `${record.plan} 如有不适立即停戴就诊。`)}>停戴提醒</button></div></div><textarea disabled={props.readOnly} value={record.plan} onChange={(e) => update("plan", e.target.value)}/></section>
      <section className="sr-section"><h3>复诊安排</h3><div className="sr-followup"><div><span>推荐随访时间</span><b>{record.followUpDate}</b><small>依据：{record.followUpRule}</small></div><label>实际复诊日期<input disabled={props.readOnly} type="date" value={record.followUpDate} onChange={(e) => update("followUpDate", e.target.value)}/></label><label>调整说明<input disabled={props.readOnly} placeholder="修改推荐日期时填写" value={record.followUpNote} onChange={(e) => update("followUpNote", e.target.value)}/></label></div></section>
      <section className="sr-section"><h3>备注</h3><textarea disabled={props.readOnly} value={record.note} onChange={(e) => update("note", e.target.value)}/></section>
    </div><footer className="sr-actions"><button onClick={() => setPreviewOpen(true)}>普通门诊病历回传预览</button>{!props.readOnly && <><button onClick={() => save(false)}>暂存</button><button className="primary" onClick={() => save(true)}>保存并回传</button></>}</footer></div>}</GlobalDrawerLayer>

    {pickerOpen && <div className="sr-modal-layer"><div className="sr-modal sr-exam-picker"><header><div><b>添加眼科检查</b><span>支持模板名称或编码模糊搜索，可多选后一次添加</span></div><button onClick={() => setPickerOpen(false)}>×</button></header><div className="sr-picker-search"><input autoFocus placeholder="搜索检查模板名称或编码" value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)}/></div><div className="sr-picker-list">{filteredTemplates.map((item) => { const added = selectedExams.some((exam) => exam.name === item.name); const checked = pending.includes(item.name); return <label className={added ? "added" : ""} key={item.code}><input type="checkbox" disabled={added} checked={added || checked} onChange={() => setPending((names) => names.includes(item.name) ? names.filter((name) => name !== item.name) : [...names, item.name])}/><span><b>{item.name}</b><small>{item.code}　{item.type}　{item.eyes}　{item.indicatorCount}项指标</small></span><em>{added ? "已添加" : checked ? "已选择" : "可添加"}</em></label>; })}</div><footer><span>已选 {pending.length} 项</span><button onClick={() => setPickerOpen(false)}>取消</button><button className="primary" disabled={!pending.length} onClick={addSelected}>添加选中</button></footer></div></div>}
    {selectedHistory && <div className="sr-modal-layer"><div className="sr-modal"><header><div><b>{selectedHistory.visitDate} 专科病历</b><span>{selectedHistory.department}　{selectedHistory.doctor}</span></div><button onClick={() => setSelectedHistory(null)}>×</button></header><article><h4>主诉/现病史</h4><p>{selectedHistory.complaintSummary}</p><h4>专科检查</h4><p>{selectedHistory.examSummary}</p><h4>检查及处理</h4><p>{selectedHistory.planSummary}</p></article><footer><button onClick={() => setSelectedHistory(null)}>关闭</button>{!props.readOnly && <button className="primary" onClick={() => referenceHistory(selectedHistory)}>引用此记录</button>}</footer></div></div>}
    {previewOpen && <div className="sr-modal-layer"><div className="sr-modal preview"><header><div><b>普通门诊病历回传预览</b><span>保存后回传“专科查体及处理建议”</span></div><button onClick={() => setPreviewOpen(false)}>×</button></header><pre>{buildOutpatientRecordText(record)}</pre><footer><button onClick={() => setPreviewOpen(false)}>关闭</button></footer></div></div>}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;
}
