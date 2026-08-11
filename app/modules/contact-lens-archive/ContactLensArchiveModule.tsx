"use client";

import { useState } from "react";
import { GlobalDrawerLayer } from "../../components/GlobalDrawerLayer";
import { changeTreatmentMethod, createArchiveSeed, createArchiveSeeds, createMethodStageDetails, referenceCheckReport, reopenArchive, reviseCheckValue, terminateArchive, validateArchiveDraft, validateBaseline, type Baseline, type ContactLensArchive, type MethodStageDetail, type ReportCandidate, type TreatmentMethod } from "./archive-store";
import { ExamEntryPanel } from "../exam-runtime/ExamEntryPanel";
import { createEyeHealthInstance, type ExamInstance } from "../exam-runtime/exam-engine";
import { OrderedBaselineEditor } from "./OrderedBaselineEditor";
import { ArchivePrintPreview } from "./ArchivePrintPreview";
import { SpecialtyRecordModule } from "../specialty-record/SpecialtyRecordModule";
import { TreatmentStageDetailDrawer } from "./TreatmentStageDetailDrawer";

type EntryMode = "doctor" | "population";
type SpecialtyTab = "record" | "tracking" | "overview";

const methodOptions: TreatmentMethod[] = ["OK镜", "RGP", "软性离焦镜", "巩膜镜", "其他"];
const sampleReports: ReportCandidate[] = [
  { reportId: "PACS-20260802-6621", checkedAt: "2026-08-02 09:28", reporterName: "黄雨菲", reportedAt: "2026-08-02 09:40", status: "已报告", odSummary: "Ks 43.83D@83°；MinK 42.79D@179°", osSummary: "Ks 43.60D@159°；MinK 43.10D@63°" },
  { reportId: "PACS-20260801-5501", checkedAt: "2026-08-01 14:20", reporterName: "李明", reportedAt: "2026-08-01 14:38", status: "已报告", odSummary: "Ks 43.70D@82°；MinK 42.65D@178°", osSummary: "Ks 43.51D@158°；MinK 42.98D@62°" },
];

export function ContactLensArchiveModule({ entryMode }: { entryMode: EntryMode }) {
  const [activeTab, setActiveTab] = useState<SpecialtyTab>(entryMode === "population" ? "overview" : "record");
  const [archives, setArchives] = useState<ContactLensArchive[]>(entryMode === "population" ? createArchiveSeeds() : []);
  const [selectedArchiveId, setSelectedArchiveId] = useState(entryMode === "population" ? "CL-20260802-0001" : "");
  const [createOpen, setCreateOpen] = useState(false);
  const [baselineOpen, setBaselineOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [reportGroup, setReportGroup] = useState<ContactLensArchive["checks"][number] | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [examSource, setExamSource] = useState<"档案基线" | "专科病历">("专科病历");
  const [methodHistoryOpen, setMethodHistoryOpen] = useState(false);
  const [stageDetail, setStageDetail] = useState<MethodStageDetail | null>(null);
  const [eyeHealthExam, setEyeHealthExam] = useState<ExamInstance>(() => createEyeHealthInstance("V00000009340", "VISIT-20260802"));
  const [toast, setToast] = useState("");
  const [createDraft, setCreateDraft] = useState({ treatmentPlan: "", treatmentMethod: "", responsibleDoctor: "方红全", createdAt: "2026-08-02T10:42", note: "" });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [baselineDraft, setBaselineDraft] = useState<Baseline>(() => createArchiveSeed().baseline);
  const [baselineInitial, setBaselineInitial] = useState("");
  const [baselineErrors, setBaselineErrors] = useState<Record<string, string>>({});
  const [changeDraft, setChangeDraft] = useState({ nextMethod: "RGP" as TreatmentMethod, effectiveDate: "2026-08-02", reasonType: "患者需求变化", reason: "", assessmentStrategy: "沿用近期检查并补充评估" });
  const [terminateDraft, setTerminateDraft] = useState({ endedAt: "2026-08-02T11:30", reason: "", note: "" });

  const readOnly = entryMode === "population";
  const archive = archives.find((item) => item.id === selectedArchiveId) ?? null;
  const methodStages = archive ? createMethodStageDetails(archive) : [];
  const baselineDirty = baselineOpen && baselineInitial && JSON.stringify(baselineDraft) !== baselineInitial;

  function setArchive(next: ContactLensArchive) {
    setArchives((current) => current.some((item) => item.id === next.id) ? current.map((item) => item.id === next.id ? next : item) : [...current, next]);
    setSelectedArchiveId(next.id);
  }

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2200); }
  function saveArchive() {
    const errors = validateArchiveDraft(createDraft, archives, "V00000009340"); setCreateErrors(errors);
    if (Object.keys(errors).length) return;
    const next = createArchiveSeed();
    next.treatmentPlan = createDraft.treatmentPlan;
    next.currentTreatmentMethod = createDraft.treatmentMethod as TreatmentMethod;
    next.responsibleDoctor = createDraft.responsibleDoctor;
    next.createdAt = createDraft.createdAt.replace("T", " ");
    next.updatedAt = next.createdAt;
    next.note = createDraft.note;
    next.methodHistory = [{ method: next.currentTreatmentMethod, startedAt: "2026-08-02", doctor: next.responsibleDoctor }];
    setArchive(next); setBaselineDraft(next.baseline); setBaselineInitial(JSON.stringify(next.baseline)); setCreateOpen(false); setBaselineOpen(true); notify("基本档案已建立，请完成档案填写");
  }
  function openBaseline() {
    const next = structuredClone(archive?.baseline ?? createArchiveSeed().baseline);
    setBaselineDraft(next); setBaselineInitial(JSON.stringify(next)); setBaselineErrors({}); setBaselineOpen(true);
  }
  function closeBaseline() { if (baselineDirty) setDiscardOpen(true); else setBaselineOpen(false); }
  function saveBaseline(complete: boolean) {
    if (complete) { const errors = validateBaseline(baselineDraft); setBaselineErrors(errors); if (Object.keys(errors).length) return; }
    if (!archive) return;
    const next = { ...baselineDraft, status: complete ? "已完成" as const : "评估中" as const, completedAt: complete ? "2026-08-02 11:18" : undefined };
    setArchive({ ...archive, baseline: next, status: complete ? "治疗中" : archive.status, updatedAt: "2026-08-02 11:18", currentNode: complete ? "待试戴" : "基线评估", timeline: archive.timeline.map((item) => item.title === "基线评估" ? { ...item, detail: complete ? "基线评估已完成，等待进入试戴" : item.detail, state: complete ? "done" : "current" } : item) });
    setBaselineOpen(false); notify(complete ? "基本档案已完成" : "基本档案已暂存");
  }
  function submitMethodChange() {
    if (!archive || (changeDraft.reasonType === "其他" && !changeDraft.reason.trim())) return;
    const reason = changeDraft.reasonType === "其他" ? changeDraft.reason : changeDraft.reasonType;
    setArchive(changeTreatmentMethod(archive, { ...changeDraft, reason, doctor: "方红全" })); setChangeOpen(false); setActiveTab("tracking"); notify("治疗方式已变更，历史阶段已保留");
  }

  function loadExamples() { const next = createArchiveSeeds(); setArchives(next); setSelectedArchiveId(next[0].id); }
  function submitTermination() { if (!archive || !terminateDraft.reason.trim()) return; setArchive(terminateArchive(archive, { endedAt: terminateDraft.endedAt.replace("T", " "), reason: `${terminateDraft.reason}${terminateDraft.note ? `；${terminateDraft.note}` : ""}`, operator: "方红全" })); setTerminateOpen(false); notify("档案已终止，历史记录保持只读"); }
  function submitReopen() { if (!archive) return; setArchive(reopenArchive(archive, { startedAt: "2026-08-02 11:40", reason: "患者重新开展治疗", operator: "方红全" })); notify("已建立新的治疗周期"); }
  function citeReport(report: ReportCandidate) { if (!archive || !reportGroup) return; setArchive(referenceCheckReport(archive, reportGroup.group, report, "方红全", "2026-08-02 11:30")); setReportGroup(null); notify("已引用所选报告结果并保留审计记录"); }

  function reviseValue(group: string, item: string, eye: "od" | "os", value: string) {
    if (!archive || readOnly) return;
    setArchive(reviseCheckValue(archive, { group, item, eye, value, revisedBy: "方红全", revisedAt: "2026-08-02 11:20" }));
  }
  function openEyeHealth(source: "档案基线" | "专科病历") { setExamSource(source); setTemplatePickerOpen(false); setExamOpen(true); }
  function saveEyeHealth(next: ExamInstance) { setEyeHealthExam(next); setExamOpen(false); notify(next.syncStatus === "已同步" ? "眼健康检查已保存并回传门诊病历" : "眼健康检查已暂存"); }

  return <div className="cl-app">
    <div className="cl-commandbar"><button className="cl-next">下一位⌄</button><button>›</button><div className="cl-read-card">输入或空格读卡　▣</div><span>主页</span><div className="cl-visit-tab"><b>10:36　吴四</b>　×</div><div className="cl-queue"><b>患者列表</b><span>● 待诊 0</span><span>● 会诊 111</span><span>● 急危 0</span></div></div>
    <div className="cl-patientbar"><b>吴四</b><span className="cl-self">自费</span><button>＋标签</button><span>男　14岁</span><span>病历号：<b>V00000009340</b></span><span>账户余额：<b>994.01</b></span><span>过敏：<em>无</em></span><span>现住址：北京市市辖区海...</span><span>类别：初诊</span></div>
    <div className="cl-actionbar"><span className="cl-visit-kind">就诊类型：<b>初诊</b></span><div><button>刷新</button><button>门诊日志</button><button>就诊历史</button><button>报告查看</button><button className="blue">一键签署</button><button>取消就诊</button><button>挂起</button><button className="green">诊毕</button></div></div>

    <div className="cl-body"><main className="cl-main">
      {readOnly && <div className="cl-readonly"><b>查看模式</b>　配镜师/视光师从专科人群管理进入，可查看完整档案；基本档案和治疗方式由医生维护。</div>}
      <div className="cl-specialty-head"><span>就诊类型：<b>初诊</b></span><span>首次就诊，可选择通用视光或角膜接触镜病历模板</span></div>
      <nav className="cl-tabs"><button className={activeTab === "record" ? "active" : ""} onClick={() => setActiveTab("record")}>专科病历</button><button className={activeTab === "tracking" ? "active" : ""} onClick={() => setActiveTab("tracking")}>治疗跟踪</button><button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>专科视图</button></nav>

      {archives.length > 0 && <div className="cl-archive-switcher"><b>档案切换器</b><select aria-label="档案切换器" value={selectedArchiveId} onChange={(e) => setSelectedArchiveId(e.target.value)}>{archives.map((item) => <option value={item.id} key={item.id}>{item.treatmentPlan}｜{item.currentTreatmentMethod}｜{item.status}</option>)}</select><span>仅展示当前科室有权限访问的治疗方案档案</span>{archive && <button className="cl-history-entry" onClick={() => setMethodHistoryOpen(true)}>查看历史（{archive.methodHistory.length}）</button>}{!readOnly && <button onClick={() => setCreateOpen(true)}>＋ 新建其他档案</button>}</div>}
      {activeTab === "record" && <RecordTab archive={archive} readOnly={readOnly} eyeHealthExam={eyeHealthExam} onEyeHealthChange={setEyeHealthExam} onRevise={reviseValue} onReport={setReportGroup} onCreate={() => setCreateOpen(true)} onLoad={loadExamples} onBaseline={openBaseline} onChange={() => setChangeOpen(true)} onViewHistory={() => setMethodHistoryOpen(true)} onTerminate={() => setTerminateOpen(true)} onReopen={submitReopen} />}
      {activeTab === "tracking" && <TrackingTab />}
      {activeTab === "overview" && <OverviewTab archive={archive} readOnly={readOnly} onLoad={loadExamples} onBaseline={openBaseline} onChange={() => setChangeOpen(true)} onViewHistory={() => setMethodHistoryOpen(true)} />}
    </main><aside className="cl-rightbar"><b>功能</b><button className="active">▣　眼科</button>{["病历","诊断","医嘱","一键打印","医疗证明","诊间记账","住院证","生命体征","发热登记","手术申请","复诊预约","检查申请预约","检查预约","360视图","科室转介","高危评估"].map((item) => <button key={item}>{item}</button>)}</aside></div>

    <GlobalDrawerLayer open={createOpen} label="建立基础档案" onMaskClick={() => setCreateOpen(false)}>{createOpen && <aside className="drawer cl-drawer"><DrawerHead eyebrow="角膜接触镜档案" title="建立基础档案" onClose={() => setCreateOpen(false)}/><div className="drawer-body"><div className="cl-context"><b>吴四　男　14岁　V00000009340</b><span>当前就诊：2026-08-02　眼视光中心　初诊</span></div><section className="form-section"><h3><span>1</span>选择治疗方案</h3><div className="form-grid"><Field label="治疗方案" required error={createErrors.treatmentPlan}><select value={createDraft.treatmentPlan} onChange={(e) => setCreateDraft({ ...createDraft, treatmentPlan: e.target.value, treatmentMethod: "" })}><option value="">搜索并选择当前科室有权限的治疗方案</option><option>角膜接触镜标准治疗方案</option><option>角膜接触镜加强治疗方案</option></select></Field><Field label="档案基线模板"><input disabled value={createDraft.treatmentPlan ? "角膜接触镜基础档案基线模板 V1.0" : "选择治疗方案后自动带入"}/></Field><Field label="初始治疗方式" required error={createErrors.treatmentMethod}><select disabled={!createDraft.treatmentPlan} value={createDraft.treatmentMethod} onChange={(e) => setCreateDraft({ ...createDraft, treatmentMethod: e.target.value })}><option value="">请选择</option>{methodOptions.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="责任医生" required error={createErrors.responsibleDoctor}><select value={createDraft.responsibleDoctor} onChange={(e) => setCreateDraft({ ...createDraft, responsibleDoctor: e.target.value })}><option value="">搜索医生姓名</option><option>方红全</option><option>张功平</option></select></Field><Field label="建档日期" required><input type="datetime-local" value={createDraft.createdAt} onChange={(e) => setCreateDraft({ ...createDraft, createdAt: e.target.value })}/></Field><Field label="当前就诊机构 / 科室（权限上下文）"><input disabled value="南京医科大学附属眼科医院 / 眼视光中心"/></Field><Field wide label="备注"><textarea maxLength={500} placeholder="选填，最多500字" value={createDraft.note} onChange={(e) => setCreateDraft({ ...createDraft, note: e.target.value })}/></Field></div></section><div className="cl-info-note"><b>唯一性与权限</b><p>档案按患者＋治疗方案唯一；科室仅控制治疗方案使用权限和档案访问权限。</p></div></div><div className="drawer-foot"><button className="button" onClick={() => setCreateOpen(false)}>取消</button><button className="button primary" onClick={saveArchive}>建立档案并进入基线评估</button></div></aside>}</GlobalDrawerLayer>

    <GlobalDrawerLayer open={Boolean(baselineOpen && archive)} label="基本档案" onMaskClick={closeBaseline}>{baselineOpen && archive && <aside className="drawer cl-baseline-drawer">
        <DrawerHead eyebrow={`档案 ${archive.id}`} title="基本档案" onClose={closeBaseline}/>
        <div className="drawer-body">
          <div className="cl-shared-exam-callout"><div><b>9 组眼科检查组件已自动加载</b><span>按“角膜接触镜基本档案模板 V1.0”直接加载，无需再次选择；接口缺少结构化结果时可由医生补录。</span></div><em>45 项临床指标</em></div>
          <OrderedBaselineEditor baseline={baselineDraft} setBaseline={setBaselineDraft} errors={baselineErrors} checks={archive.checks} exam={eyeHealthExam} onExamChange={setEyeHealthExam} readOnly={readOnly} onRevise={reviseValue} onReport={setReportGroup}/>
        </div>
        <div className="drawer-foot"><button className="button" onClick={() => baselineDirty ? notify("请先暂存当前修改后再打印") : setPrintOpen(true)}>打印预览</button><button className="button" onClick={closeBaseline}>{readOnly ? "关闭" : "取消"}</button>{!readOnly && <><button className="button" onClick={() => saveBaseline(false)}>暂存</button><button className="button primary" onClick={() => saveBaseline(true)}>完成基本档案</button></>}</div>
      </aside>}</GlobalDrawerLayer>

    {methodHistoryOpen && archive && <Modal title="治疗方式历史" onClose={() => setMethodHistoryOpen(false)} footer={<button className="button primary" onClick={() => setMethodHistoryOpen(false)}>关闭</button>}><div className="cl-method-stage-list">{methodStages.map((stage) => <article key={stage.id}><div><span className={stage.status === "当前使用" ? "current" : "history"}>{stage.status}</span><h4>{stage.method}</h4><p>{stage.startedAt} 至 {stage.endedAt || "今"}</p></div><dl><div><dt>变更原因</dt><dd>{stage.reason}</dd></div><div><dt>操作医生</dt><dd>{stage.doctor}</dd></div><div><dt>关联内容</dt><dd>病历 {stage.records.length} 份 · 检查 {stage.examinations.length} 项 · 处置 {stage.dispositions.length} 条</dd></div></dl><button className="button" onClick={() => { setMethodHistoryOpen(false); setStageDetail(stage); }}>查看阶段详情</button></article>)}</div></Modal>}

    {changeOpen && archive && <Modal title="变更治疗方式" onClose={() => setChangeOpen(false)} footer={<><button className="button" onClick={() => setChangeOpen(false)}>取消</button><button className="button primary" disabled={changeDraft.reasonType === "其他" && !changeDraft.reason.trim()} onClick={submitMethodChange}>确认变更</button></>}><div className="cl-info-note"><b>治疗方案</b><p>{archive.treatmentPlan}（档案内不可修改）</p></div><div className="cl-change-summary"><span>当前方式</span><b>{archive.currentTreatmentMethod}</b><i>→</i><span>新治疗方式</span><select value={changeDraft.nextMethod} onChange={(e) => setChangeDraft({ ...changeDraft, nextMethod: e.target.value as TreatmentMethod })}>{methodOptions.filter((item) => item !== archive.currentTreatmentMethod).map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-grid"><Field label="变更日期" required><input type="date" value={changeDraft.effectiveDate} min={archive.methodHistory.at(-1)?.startedAt} max="2026-08-02" onChange={(e) => setChangeDraft({ ...changeDraft, effectiveDate: e.target.value })}/></Field><Field label="变更原因" required><select value={changeDraft.reasonType} onChange={(e) => setChangeDraft({ ...changeDraft, reasonType: e.target.value })}><option>患者需求变化</option><option>治疗效果调整</option><option>不耐受原治疗方式</option><option>其他</option></select></Field>{changeDraft.reasonType === "其他" && <Field wide label="补充说明" required><textarea maxLength={500} value={changeDraft.reason} onChange={(e) => setChangeDraft({ ...changeDraft, reason: e.target.value })}/></Field>}</div><div className="cl-baseline-rule"><b>基线处理提示</b><span>角膜地形图、眼生物测量可沿用</span><span>眼表综合报告需补充评估</span><span>医生查体需重新确认</span></div><div className="cl-warning">确认后原治疗阶段结束并形成快照，新阶段生效；历史记录不会被覆盖。</div></Modal>}
    {discardOpen && <Modal title="放弃未保存的基线修改？" onClose={() => setDiscardOpen(false)} footer={<><button className="button" onClick={() => setDiscardOpen(false)}>继续编辑</button><button className="button danger" onClick={() => { setDiscardOpen(false); setBaselineOpen(false); }}>放弃修改</button></>}><p>关闭后本次尚未暂存的修改将丢失。</p></Modal>}
    {terminateOpen && archive && <Modal title="终止档案" onClose={() => setTerminateOpen(false)} footer={<><button className="button" onClick={() => setTerminateOpen(false)}>取消</button><button className="button danger" disabled={!terminateDraft.reason.trim()} onClick={submitTermination}>确认终止档案</button></>}><div className="cl-warning">终止后档案转为只读，但不会影响该患者的其他治疗方案档案。</div><div className="form-grid"><Field label="终止日期" required><input type="datetime-local" value={terminateDraft.endedAt} onChange={(e) => setTerminateDraft({ ...terminateDraft, endedAt: e.target.value })}/></Field><Field label="终止原因" required><select value={terminateDraft.reason} onChange={(e) => setTerminateDraft({ ...terminateDraft, reason: e.target.value })}><option value="">请选择</option><option>患者主动停止</option><option>转其他治疗方案</option><option>医学原因终止</option></select></Field><Field wide label="终止说明"><textarea maxLength={500} value={terminateDraft.note} onChange={(e) => setTerminateDraft({ ...terminateDraft, note: e.target.value })}/></Field></div></Modal>}
    {templatePickerOpen && <Modal title="选择检查模板" onClose={() => setTemplatePickerOpen(false)} footer={<button className="button" onClick={() => setTemplatePickerOpen(false)}>取消</button>}><input className="picker-search" placeholder="按检查模板名称搜索"/><div className="cl-exam-template-list">{["眼健康检查","角膜地形图","眼表综合报告","眼生物测量","散瞳医学验光"].map((name) => <button key={name} onClick={() => { if (name === "眼健康检查") openEyeHealth("专科病历"); else { setTemplatePickerOpen(false); notify(`${name}组件已加载到本次病历`); } }}><b>{name}</b><span>检查模板驱动 · 可复用检查实例</span><em>加载</em></button>)}</div></Modal>}
    {reportGroup && <Modal title="引用报告结果" onClose={() => setReportGroup(null)} footer={<button className="button" onClick={() => setReportGroup(null)}>取消</button>}><div className="cl-report-current"><b>{reportGroup.group}</b><span>当前引用：{reportGroup.reportId}</span></div><p>存在多次检查时，选择一份报告预览并引用；替换引用将保留历史审计记录。</p><div className="cl-report-candidates">{sampleReports.map((report) => <button key={report.reportId} onClick={() => citeReport(report)}><span><b>{report.checkedAt}</b><small>{report.reportId}　报告人：{report.reporterName}　{report.reportedAt}</small></span><em>{report.status}</em><strong>引用报告结果</strong></button>)}</div><div className="cl-report-page"><b>{reportGroup.group}报告结果预览</b><p>OD：{sampleReports[0].odSummary}</p><p>OS：{sampleReports[0].osSummary}</p></div></Modal>}
    {printOpen && archive && <ArchivePrintPreview archive={archive} onClose={() => setPrintOpen(false)}/>} 
    {examOpen && <ExamEntryPanel exam={eyeHealthExam} source={examSource} onChange={setEyeHealthExam} onClose={() => setExamOpen(false)} onSave={saveEyeHealth}/>} 
    <TreatmentStageDetailDrawer detail={stageDetail} onClose={() => setStageDetail(null)} onReport={(name) => notify(`${name}原始报告预览已打开`)} />
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;
}

function RecordTab({ archive, readOnly, eyeHealthExam, onEyeHealthChange, onRevise, onReport, onCreate, onLoad, onBaseline, onChange, onViewHistory, onTerminate, onReopen }: { archive: ContactLensArchive | null; readOnly: boolean; eyeHealthExam: ExamInstance; onEyeHealthChange: (exam: ExamInstance) => void; onRevise: (group: string, item: string, eye: "od" | "os", value: string) => void; onReport: (group: ContactLensArchive["checks"][number]) => void; onCreate: () => void; onLoad: () => void; onBaseline: () => void; onChange: () => void; onViewHistory: () => void; onTerminate: () => void; onReopen: () => void }) {
    return <SpecialtyRecordModule archive={archive} checks={archive?.checks ?? createArchiveSeed().checks} readOnly={readOnly} eyeHealthExam={eyeHealthExam} onEyeHealthChange={onEyeHealthChange} onRevise={onRevise} onReport={onReport} onCreateArchive={onCreate} onLoadArchives={onLoad} onEditBasic={onBaseline} onChangeMethod={onChange} onViewMethodHistory={onViewHistory} onTerminate={onTerminate} onReopen={onReopen}/>;
    /* Legacy form retained temporarily as an implementation reference; no longer rendered. */
    const locked = archive?.status === "已完成" || archive?.status === "已终止";
    return <div className="cl-record-page"><div className={`cl-archive-strip ${archive ? "has" : ""}`}>{archive ? <><div><span className="cl-status-dot"/><b>治疗方案档案</b><code>{archive.id}</code><span>{archive.treatmentPlan}</span><strong>{archive.currentTreatmentMethod}</strong><em>{archive.status}</em><small>责任医生：{archive.responsibleDoctor}　建档：{archive.createdAt}　第{archive.cycleNumber}周期　更新：{archive.updatedAt}</small></div><div><button onClick={onBaseline}>{readOnly || locked ? "查看基线评估" : "编辑基线评估"}</button>{!readOnly && !locked && <><button onClick={onChange}>变更治疗方式</button><button className="danger-text" onClick={onTerminate}>终止档案</button></>}{!readOnly && locked && <button onClick={onReopen}>重新开启</button>}</div></> : <><div><span>当前患者暂无专科档案</span><small>可新建角膜接触镜档案或其他治疗方案档案</small></div><div><button className="ghost" onClick={onLoad}>载入多档案示例</button>{!readOnly && <button className="primary" onClick={onCreate}>▣ 新建档案</button>}</div></>}</div>
    <section className="cl-medical-record"><header><b>✎ 视光专科病历</b><div>模板：<button className="active">通用视光</button><button>角膜接触镜初诊</button></div></header><div className="cl-record-form"><h3>主诉与现病史</h3><label>主诉<textarea defaultValue=""/></label><label>现病史<textarea defaultValue=""/></label><h3>既往史与家族史</h3><textarea defaultValue="无"/><div className="cl-aux-head"><h3>专科检查</h3>{!readOnly && <button onClick={onEyeHealth}>＋ 添加眼科检查</button>}</div><div className="cl-exam-instance"><div><b>眼健康检查</b><span>眼科检查组件 · 检查模板 V1.0 · 本次就诊共享</span></div><em className={eyeHealthExam.status === "已完成" ? "done" : ""}>{eyeHealthExam.status}</em><button onClick={onEyeHealth}>{readOnly ? "查看" : "继续录入"}</button></div><div className="cl-aux-head"><h3>辅助检查</h3><button>＋添加</button></div><div className="cl-check-tabs"><button className="active">裸眼视力</button><button>矫正视力</button><button>电脑验光</button><button>小瞳验光</button><button>散瞳验光</button><button>视功能检查</button><button>验光处方</button></div>{!archive && <p className="cl-baseline-tip">新建治疗方案档案后进入基线评估，形成健康背景和配前检查快照。</p>}</div></section>
  </div>;
}

function TrackingTab() {
  return <section className="legacy-module-page treatment-legacy-page" aria-label="OK镜治疗管理"><iframe title="OK镜治疗管理" src="/legacy/ok-lens-treatment.html" /></section>;
}

function OverviewTab({ archive, readOnly, onLoad, onBaseline, onChange, onViewHistory }: { archive: ContactLensArchive | null; readOnly: boolean; onLoad: () => void; onBaseline: () => void; onChange: () => void; onViewHistory: () => void }) {
  if (!archive) return <EmptyState title="暂无角膜接触镜档案" detail="从门诊医生站建立档案后，可在此查看患者全景信息。" action="载入示例档案" onAction={onLoad}/>;
  return <div className="cl-overview"><div className="cl-overview-head"><div><span>角膜接触镜档案</span><h2>{archive.id}</h2><p>{archive.treatmentPlan}</p></div><div className="cl-current-method"><span>当前治疗方式</span><b>{archive.currentTreatmentMethod}</b><small>第 {archive.methodHistory.length} 个治疗阶段</small></div><div className="cl-overview-actions"><button onClick={onBaseline}>{readOnly ? "查看基线" : "编辑基线"}</button>{!readOnly && <button className="primary" onClick={onChange}>变更治疗方式</button>}</div></div><div className="cl-summary-grid"><Summary label="档案状态" value={archive.status}/><Summary label="当前节点" value={archive.currentNode}/><Summary label="责任医生" value={archive.responsibleDoctor}/><Summary label="基线评估" value={archive.baseline.status}/></div><div className="cl-overview-columns"><section className="cl-panel"><div className="cl-panel-head"><div><h2>健康与戴镜背景</h2><p>基线评估快照</p></div></div><dl className="cl-detail-list"><dt>戴镜目的</dt><dd>{archive.baseline.purpose}</dd><dt>既往戴镜史</dt><dd>{archive.baseline.lensHistory}</dd><dt>全身疾病史</dt><dd>{archive.baseline.systemicHistory}</dd><dt>眼部病史</dt><dd>{archive.baseline.eyeHistory}</dd><dt>原矫正方式</dt><dd>{archive.baseline.correctionHistory}</dd><dt>电子产品使用</dt><dd>{archive.baseline.electronicUsage}</dd></dl></section><section className="cl-panel"><div className="cl-panel-head"><div><h2>配前检查</h2><p>{archive.checks.filter((item) => item.status === "已获取").length}/{archive.checks.length}组已获取</p></div></div><div className="cl-check-summary">{archive.checks.map((group) => <div key={group.group}><span className={`cl-source ${group.source}`}>{group.source}</span><b>{group.group}</b><em className={group.status === "待返回" ? "pending" : ""}>{group.status}</em><small>{group.reportId}</small></div>)}</div></section></div></div>;
}

function BaselineEditor({ baseline, setBaseline, errors, checks, readOnly, onRevise, onReport }: { baseline: Baseline; setBaseline: (next: Baseline) => void; errors: Record<string, string>; checks: ContactLensArchive["checks"]; readOnly: boolean; onRevise: (group: string, item: string, eye: "od" | "os", value: string) => void; onReport: (group: ContactLensArchive["checks"][number]) => void }) {
  const set = (key: keyof Baseline, value: string) => setBaseline({ ...baseline, [key]: value });
  return <><div className="cl-baseline-status"><div><b>基线评估状态：{baseline.status}</b><span>模板：角膜接触镜基础档案基线模板 V1.0</span></div><em>完成后保存模板、指标和原始报告快照</em></div><section className="form-section"><h3><span>1</span>健康与戴镜背景</h3><div className="form-grid"><Field label="戴镜目的" required error={errors.purpose}><textarea disabled={readOnly} value={baseline.purpose} onChange={(e) => set("purpose", e.target.value)}/></Field><Field label="既往戴镜史"><textarea disabled={readOnly} value={baseline.lensHistory} onChange={(e) => set("lensHistory", e.target.value)}/></Field><Field label="全身疾病史"><textarea disabled={readOnly} value={baseline.systemicHistory} onChange={(e) => set("systemicHistory", e.target.value)}/></Field><Field label="眼部疾病、手术及用药史"><textarea disabled={readOnly} value={baseline.eyeHistory} onChange={(e) => set("eyeHistory", e.target.value)}/></Field><Field label="药物过敏史"><textarea disabled={readOnly} value={baseline.allergyHistory} onChange={(e) => set("allergyHistory", e.target.value)}/></Field><Field label="原视力矫正方式"><input disabled={readOnly} value={baseline.correctionHistory} onChange={(e) => set("correctionHistory", e.target.value)}/></Field><Field label="工作与生活情况"><textarea disabled={readOnly} value={baseline.workAndLife} onChange={(e) => set("workAndLife", e.target.value)}/></Field><Field label="电子产品使用情况"><textarea disabled={readOnly} value={baseline.electronicUsage} onChange={(e) => set("electronicUsage", e.target.value)}/></Field></div></section><section className="form-section"><h3><span>2</span>配前检查指标</h3><div className="cl-snapshot-list">{checks.map((group) => <details key={group.group} open><summary><span className={`cl-source ${group.source}`}>{group.source}</span><b>{group.group}</b><em className={group.status === "待返回" ? "pending" : ""}>{group.status}</em><i className={`cl-origin ${group.valueOrigin === "医生手工录入" ? "manual" : ""}`}>{group.valueOrigin}</i><small>报告：{group.reportId}　{group.reportDate}</small>{group.report && <button type="button" onClick={(event) => { event.preventDefault(); onReport(group); }}>查看原始报告</button>}</summary><table><thead><tr><th>检查指标</th><th>OD</th><th>OS</th><th>单位</th><th>参考范围</th></tr></thead><tbody>{group.rows.map((row) => <tr key={row.item}><td><b>{row.item}</b>{row.revision && <small className="cl-revision">已由{row.revision.revisedBy}于{row.revision.revisedAt}修订</small>}</td><td><input aria-label={`${group.group}-${row.item}-OD`} disabled={readOnly} value={row.od} onChange={(e) => onRevise(group.group, row.item, "od", e.target.value)}/>{row.originalOd && <small className="cl-original">接口原值：{row.originalOd}</small>}</td><td><input aria-label={`${group.group}-${row.item}-OS`} disabled={readOnly} value={row.os} onChange={(e) => onRevise(group.group, row.item, "os", e.target.value)}/>{row.originalOs && <small className="cl-original">接口原值：{row.originalOs}</small>}</td><td>{row.unit || "—"}</td><td>{row.reference || "—"}</td></tr>)}</tbody></table><footer><span>{group.report ? `${group.report.kind}报告已关联` : "无外部报告"}</span><span>快照时间：{group.snapshotAt}</span></footer></details>)}</div></section><section className="form-section"><h3><span>3</span>医生评估</h3><Field label="评估结论" required error={errors.doctorConclusion}><textarea disabled={readOnly} value={baseline.doctorConclusion} onChange={(e) => set("doctorConclusion", e.target.value)}/></Field></section></>;
}

function CompositeEditors({ checks, readOnly, onRevise, onReport }: { checks: ContactLensArchive["checks"]; readOnly: boolean; onRevise: (group: string, item: string, eye: "od" | "os", value: string) => void; onReport: (group: ContactLensArchive["checks"][number]) => void }) {
  const names = ["角膜地形图","眼表综合报告","散瞳医学验光","小瞳医学验光"];
  return <section className="form-section"><h3><span>3</span>组合检查录入</h3><div className="cl-composite-list">{names.map((name) => { const group=checks.find((item)=>item.group===name); if(!group) return null; return <details key={name} open><summary><span className="cl-source 医技检查">医技检查</span><b>{name}</b><small>{group.reportId}</small>{group.report&&<button onClick={(e)=>{e.preventDefault();onReport(group);}}>查看原始报告</button>}</summary>{(["od","os"] as const).map((eye)=><div className="cl-composite-eye" key={eye}><strong>{eye.toUpperCase()}</strong>{group.rows.map((row)=><label key={row.item}><span>{row.item}</span><input disabled={readOnly} value={row[eye]} onChange={(e)=>onRevise(group.group,row.item,eye,e.target.value)}/><i>{row.unit}</i></label>)}</div>)}{name==="角膜地形图"&&<div className="cl-composite-summary"><b>临床摘要</b>{(["od","os"] as const).map((eye)=><span key={eye}>{eye.toUpperCase()}：Ks {group.rows.find(r=>r.item==="Ks曲率")?.[eye]}D@{group.rows.find(r=>r.item==="Ks轴位")?.[eye]}°；MinK {group.rows.find(r=>r.item==="MinK曲率")?.[eye]}D@{group.rows.find(r=>r.item==="MinK轴位")?.[eye]}°</span>)}</div>}</details>})}</div></section>;
}

function PrintPreview({ archive, onClose }: { archive: ContactLensArchive; onClose: () => void }) {
  const topo = archive.checks.find((item) => item.group === "角膜地形图");
  const v = (name: string, eye: "od" | "os") => topo?.rows.find((row) => row.item === name)?.[eye] || "";
  const summary = (eye: "od" | "os") => `Ks ${v("Ks曲率",eye)}D@${v("Ks轴位",eye)}°；MinK ${v("MinK曲率",eye)}D@${v("MinK轴位",eye)}°`;
  const rows = archive.checks.filter((group) => group.group !== "眼健康检查").flatMap((group) => group.rows);
  return <><div className="overlay print-overlay"/><div className="cl-print-dialog" role="dialog" aria-label="角膜接触镜档案打印预览"><header><div><b>打印预览</b><span>南医角膜接触镜档案 · 固定版式</span></div><button onClick={onClose}>×</button></header><main className="cl-print-scroll"><article className="cl-print-page"><h1>南京医科大学附属眼科医院</h1><h2>角膜接触镜档案</h2><div className="cl-print-patient"><span>姓名：吴四</span><span>性别：男</span><span>年龄：14岁</span><span>档案号：{archive.id}</span></div><h3>一、健康与戴镜背景</h3><dl><dt>戴镜目的</dt><dd>{archive.baseline.purpose}</dd><dt>既往戴镜史</dt><dd>{archive.baseline.lensHistory}</dd><dt>全身疾病史</dt><dd>{archive.baseline.systemicHistory}</dd><dt>眼部疾病、手术及用药史</dt><dd>{archive.baseline.eyeHistory}</dd><dt>药物过敏史</dt><dd>{archive.baseline.allergyHistory}</dd><dt>原视力矫正方式</dt><dd>{archive.baseline.correctionHistory}</dd></dl><h3>二、基线检查</h3><table><thead><tr><th>检查项目</th><th>OD</th><th>OS</th></tr></thead><tbody>{rows.slice(0,14).map((row) => <tr key={row.item}><td>{row.item}</td><td>{row.od} {row.unit}</td><td>{row.os} {row.unit}</td></tr>)}</tbody></table><footer>第 1 页 / 共 2 页</footer></article><article className="cl-print-page"><h1>南京医科大学附属眼科医院</h1><h2>角膜接触镜档案（续）</h2><h3>三、角膜地形图摘要</h3><p><b>OD：</b>{summary("od")}</p><p><b>OS：</b>{summary("os")}</p><table><thead><tr><th>检查项目</th><th>OD</th><th>OS</th></tr></thead><tbody>{rows.slice(14).map((row, index) => <tr key={`${row.item}-${index}`}><td>{row.item}</td><td>{row.od} {row.unit}</td><td>{row.os} {row.unit}</td></tr>)}</tbody></table><h3>四、医生评估</h3><p>{archive.baseline.doctorConclusion}</p><div className="cl-print-sign"><span>责任医生：{archive.responsibleDoctor}</span><span>日期：{archive.baseline.completedAt || archive.createdAt}</span></div><footer>第 2 页 / 共 2 页</footer></article></main><div className="cl-print-actions"><button onClick={onClose}>关闭</button><button className="primary" onClick={() => window.print()}>打印</button></div></div></>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b>{value}</b></div>; }
function EmptyState({ title, detail, action, onAction }: { title: string; detail: string; action: string; onAction: () => void }) { return <div className="cl-empty"><div>◫</div><h2>{title}</h2><p>{detail}</p><button onClick={onAction}>{action}</button></div>; }
function DrawerHead({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) { return <div className="drawer-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="close" onClick={onClose}>×</button></div>; }
function Field({ label, required, error, wide, children }: { label: string; required?: boolean; error?: string; wide?: boolean; children: React.ReactNode }) { return <label className={`field ${wide ? "wide" : ""}`}><span className="field-label">{required && <b>*</b>}{label}</span>{children}{error && <span className="error">{error}</span>}</label>; }
function Modal({ title, onClose, footer, children }: { title: string; onClose: () => void; footer: React.ReactNode; children: React.ReactNode }) { return <><div className="overlay dialog-layer"/><div className="picker-modal cl-modal" role="dialog"><div className="picker-head"><h3>{title}</h3><button onClick={onClose}>×</button></div><div className="picker-body">{children}</div><div className="picker-foot">{footer}</div></div></>; }
