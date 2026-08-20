"use client";
import { ExamEntryContent } from "../exam-runtime/ExamEntryPanel";
import type { ExamInstance } from "../exam-runtime/exam-engine";
import { getCheckRowPresentation, type Baseline, type CheckValueKey, type ContactLensArchive } from "./archive-store";

type Check = ContactLensArchive["checks"][number];
const composite = new Set(["角膜地形图","眼表综合报告","散瞳医学验光","小瞳医学验光"]);

export function OrderedBaselineEditor({ baseline,setBaseline,checks,exam,onExamChange,readOnly,onRevise,onReport,errors }:{baseline:Baseline;setBaseline:(v:Baseline)=>void;checks:Check[];exam:ExamInstance;onExamChange:(v:ExamInstance)=>void;readOnly:boolean;onRevise:(g:string,i:string,e:CheckValueKey,v:string)=>void;onReport:(g:Check)=>void;errors:Record<string,string>}){
 const set=(k:keyof Baseline,v:string)=>setBaseline({...baseline,[k]:v});
 const before=["视力与眼压"];
 const after=["眼生物测量","角膜内皮"];
 return <><div className="cl-baseline-status"><div><b>基本档案状态：{baseline.status}</b><span>角膜接触镜基本档案模板 V1.0</span></div><em>按档案打印顺序录入并保存快照</em></div>
 <section className="form-section"><h3><span>1</span>健康与戴镜背景</h3><div className="form-grid">{[["purpose","戴镜目的"],["lensHistory","既往戴镜史"],["systemicHistory","全身疾病史"],["eyeHistory","眼部疾病、手术及用药史"],["allergyHistory","药物过敏史"],["correctionHistory","原视力矫正方式"],["workAndLife","工作与生活情况"],["electronicUsage","电子产品使用情况"]].map(([k,n])=><label className="field" key={k}><span className="field-label">{n}</span><textarea disabled={readOnly} value={String(baseline[k as keyof Baseline]||"")} onChange={e=>set(k as keyof Baseline,e.target.value)}/>{errors[k]&&<span className="error">{errors[k]}</span>}</label>)}</div></section>
 <section className="form-section"><h3><span>2</span>基线检查</h3><div className="cl-ordered-checks">
 {before.map(n=><CheckCard key={n} group={checks.find(g=>g.group===n)} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>) }
 <CheckCard group={(()=>{const g=checks.find(x=>x.group==="角膜地形图");return g?{...g,rows:g.rows.filter(r=>["睑裂高度","眼睑张力"].includes(r.item))}:undefined})()} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>
 <div className="cl-ordered-card"><CheckHeader title="眼健康检查" meta="录入人：方红全　录入时间：2026-08-02 10:35"/><ExamEntryContent exam={exam} onChange={onExamChange} embedded/></div>
 <CheckCard group={checks.find(g=>g.group==="眼前节与瞳孔")} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>
 <CheckCard group={(()=>{const g=checks.find(x=>x.group==="角膜地形图");return g?{...g,rows:g.rows.filter(r=>!["睑裂高度","眼睑张力"].includes(r.item))}:undefined})()} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>
 {after.map(n=><CheckCard key={n} group={checks.find(g=>g.group===n)} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>) }
 <CheckCard group={checks.find(g=>g.group==="眼表综合报告")} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>
 <CheckCard group={checks.find(g=>g.group==="散瞳医学验光")} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>
 <CheckCard group={checks.find(g=>g.group==="小瞳医学验光")} readOnly={readOnly} onRevise={onRevise} onReport={onReport}/>
 <label className="field"><span className="field-label">基线检查备注</span><textarea disabled={readOnly} placeholder="补充报告质量、患者配合或其他说明"/></label>
 </div></section>
 <section className="form-section"><h3><span>3</span>医生评估</h3><label className="field"><span className="field-label">评估结论</span><textarea disabled={readOnly} value={baseline.doctorConclusion} onChange={e=>set("doctorConclusion",e.target.value)}/>{errors.doctorConclusion&&<span className="error">{errors.doctorConclusion}</span>}</label></section></>;
}

function CheckHeader({title,meta,group,onReport}:{title:string;meta:string;group?:Check;onReport?:(g:Check)=>void}){return <header className="cl-check-head"><div><span className={`cl-source ${group?.source||"医生查体"}`}>{group?.source||"医生查体"}</span><b>{title}</b></div><span>{meta}</span>{group?.reportId&&<code>{group.reportId}</code>}{group?.report&&onReport&&<button onClick={()=>onReport(group)}>查看原始报告</button>}</header>}

export function CheckCard({group,readOnly,onRevise,onReport,headerAction}:{group?:Check;readOnly:boolean;onRevise:(g:string,i:string,e:CheckValueKey,v:string)=>void;onReport:(g:Check)=>void;headerAction?:React.ReactNode}){
 if(!group)return null;
 const meta=group.source==="医技检查"&&group.reporterName?`报告人：${group.reporterName}　报告时间：${group.reportTime}`:`${group.source==="护士采集"?"采集人":"录入人"}：${group.enteredBy}　${group.source==="护士采集"?"采集时间":"录入时间"}：${group.enteredAt}`;
 const hasOu=group.rows.some(row=>row.eyeRule?.includes("OU"));
 return <div className="cl-ordered-card"><div className="sr-check-header-wrap"><CheckHeader title={group.group} meta={meta} group={group} onReport={onReport}/>{headerAction}</div>{composite.has(group.group)?<>{(["od","os"] as const).map(eye=><div className="cl-composite-eye" key={eye}><strong>{eye.toUpperCase()}</strong>{group.rows.map(row=><label key={row.item}><span>{row.item}</span><input disabled={readOnly} value={row[eye]} onChange={e=>onRevise(group.group,row.item,eye,e.target.value)}/><i>{row.unit}</i></label>)}</div>)}{group.group==="角膜地形图"&&<div className="cl-composite-summary">{(["od","os"] as const).map(eye=><span key={eye}>{eye.toUpperCase()}：Ks {group.rows.find(r=>r.item==="Ks曲率")?.[eye]}D@{group.rows.find(r=>r.item==="Ks轴位")?.[eye]}°；MinK {group.rows.find(r=>r.item==="MinK曲率")?.[eye]}D@{group.rows.find(r=>r.item==="MinK轴位")?.[eye]}°</span>)}</div>}</>:<table className="cl-mixed-eye-table"><thead><tr><th>检查指标</th><th>OD</th><th>OS</th>{hasOu&&<th>OU</th>}<th>单位</th></tr></thead><tbody>{group.rows.map(row=>{const presentation=getCheckRowPresentation(row);if(presentation.kind==="multi-eye")return <tr key={row.item}><td>{row.item}</td>{(["OD","OS",...(hasOu?["OU" as const]:[])] as const).map(eye=>{const configured=presentation.eyes.includes(eye);const key=eye.toLowerCase() as "od"|"os"|"ou";return <td key={eye}>{configured?<input disabled={readOnly} value={String(row[key]||"")} onChange={e=>onRevise(group.group,row.item,key,e.target.value)}/>:<span className="cl-not-applicable">—</span>}</td>})}<td>{row.unit||"—"}</td></tr>;const currentValue=String(row.value||"");return <tr className="cl-single-eye-row" key={row.item}><td>{row.item}</td><td colSpan={hasOu?3:2}><div className="cl-single-result"><span className="general">通用结果</span>{row.options?.length?<select disabled={readOnly} value={currentValue} onChange={e=>onRevise(group.group,row.item,"value",e.target.value)}>{row.options.map(option=><option key={option}>{option}</option>)}</select>:<input disabled={readOnly} value={currentValue} onChange={e=>onRevise(group.group,row.item,"value",e.target.value)}/>}</div></td><td>{row.unit||"—"}</td></tr>})}</tbody></table>}</div>
}
