"use client";

import { GlobalDrawerLayer } from "../../components/GlobalDrawerLayer";
import { copyEye, setEyeNormal, setFinding, type ExamInstance, type Eye } from "./exam-engine";

export function ExamEntryPanel({ exam, source, onChange, onClose, onSave }: { exam: ExamInstance; source: "档案基线" | "专科病历"; onChange: (next: ExamInstance) => void; onClose: () => void; onSave: (next: ExamInstance) => void }) {
  return <GlobalDrawerLayer open label="眼科检查录入组件" onMaskClick={onClose}><aside className="drawer exam-entry-drawer" aria-label="眼科检查录入组件">
    <div className="drawer-head"><div><span className="eyebrow">{source} · 检查模板驱动</span><h2>眼健康检查</h2></div><button className="close" onClick={onClose}>×</button></div>
    <div className="drawer-body">
      <ExamEntryContent exam={exam} onChange={onChange}/>
    </div>
    <div className="drawer-foot"><button className="button" onClick={onClose}>取消</button><button className="button" onClick={() => onSave({ ...exam, status:"已暂存" })}>暂存</button><button className="button primary" onClick={() => onSave({ ...exam, status:"已完成", syncStatus:"已同步" })}>保存并回传门诊病历</button></div>
  </aside></GlobalDrawerLayer>;
}

export function ExamEntryContent({ exam, onChange, embedded = false }: { exam: ExamInstance; onChange: (next: ExamInstance) => void; embedded?: boolean }) {
  function changeStatus(code: string, eye: Eye, status: "正常" | "异常", normalText: string, options: string[]) {
    onChange(setFinding(exam, code, eye, status, status === "异常" ? options[0] : normalText));
  }
  return <div className={embedded ? "exam-embedded" : ""}>
    <div className="exam-template-meta"><div><b>眼健康检查模板 V{exam.templateVersion}</b><span>本次就诊共享同一检查实例：{exam.id}</span></div><em>{exam.status}</em></div>
    <div className="exam-quickbar"><b>快捷录入</b><button onClick={() => onChange(setEyeNormal(exam))}>双眼全部正常</button><button onClick={() => onChange(setEyeNormal(exam,"od"))}>OD全部正常</button><button onClick={() => onChange(setEyeNormal(exam,"os"))}>OS全部正常</button><button onClick={() => onChange(copyEye(exam,"od","os"))}>复制OD到OS</button><button onClick={() => onChange(copyEye(exam,"os","od"))}>复制OS到OD</button></div>
    <div className="exam-grid-head"><span>检查部位</span><span>OD 右眼</span><span>OS 左眼</span></div>
    <div className="exam-result-list">{exam.results.map((item) => <div className="exam-result-row" key={item.code}><div><b>{item.name}</b><small>{item.normalText}</small></div>{(["od","os"] as Eye[]).map((eye) => <div className="exam-eye" key={eye}><div className="exam-status-toggle"><button className={item[eye].status === "正常" ? "active" : ""} onClick={() => changeStatus(item.code,eye,"正常",item.normalText,item.abnormalOptions)}>正常</button><button className={item[eye].status === "异常" ? "active abnormal" : ""} onClick={() => changeStatus(item.code,eye,"异常",item.normalText,item.abnormalOptions)}>异常</button></div>{item[eye].status === "异常" ? <><select aria-label={`${item.name}-${eye}-异常结果`} value={item[eye].value.replace(item.name,"")} onChange={(e) => onChange(setFinding(exam,item.code,eye,"异常",e.target.value))}>{item.abnormalOptions.map((option) => <option key={option}>{option}</option>)}</select><input aria-label={`${item.name}-${eye}-补充描述`} placeholder="可补充其他描述" onBlur={(e) => e.target.value.trim() && onChange(setFinding(exam,item.code,eye,"异常",e.target.value.trim()))}/></> : <span className="exam-normal-text">{item.normalText}</span>}</div>)}</div>)}</div>
    <section className="exam-preview"><div><b>病历描述预览</b><span>保存后回传普通门诊病历“专科查体”段落</span></div><pre>{exam.generatedText}</pre></section>
  </div>;
}
