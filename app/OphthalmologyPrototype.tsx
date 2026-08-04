"use client";

import { useState } from "react";
import { ClinicalIndicatorModule } from "./modules/clinical-indicator/ClinicalIndicatorModule";
import { CheckTemplateModule } from "./modules/check-template/CheckTemplateModule";
import { ContactLensArchiveModule } from "./modules/contact-lens-archive/ContactLensArchiveModule";
import { ExamReportModule } from "./modules/exam-report/ExamReportModule";

type ModuleKey = "doctor" | "population" | "indicator" | "template";
const modules: Record<ModuleKey, { label: string; group: string; icon: string }> = {
  doctor: { label: "门诊医生工作台", group: "门诊业务", icon: "♟" },
  population: { label: "专科人群管理", group: "眼科专科", icon: "♚" },
  indicator: { label: "临床指标定义", group: "眼科专科", icon: "◎" },
  template: { label: "检查模板配置", group: "眼科专科", icon: "▦" },
};

export function OphthalmologyPrototype() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("doctor");
  const [openModules, setOpenModules] = useState<ModuleKey[]>(["doctor"]);
  const [reportOpen, setReportOpen] = useState(false);

  function openModule(module: ModuleKey) {
    setOpenModules((current) => current.includes(module) ? current : [...current, module]);
    setActiveModule(module);
  }

  function closeModule(module: ModuleKey) {
    setOpenModules((current) => {
      if (current.length === 1) return current;
      const next = current.filter((item) => item !== module);
      if (activeModule === module) setActiveModule(next.at(-1) ?? "doctor");
      return next;
    });
  }

  return <div className="his-app-shell">
    <header className="his-global-header">
      <div className="his-system-title">▣ <b>电子病历系统</b></div>
      <button className="his-menu-trigger">☷</button>
      <button className="his-home-tab">首页</button>
      <div className="his-open-tabs" aria-label="已打开功能">
        {openModules.map((item) => <div key={item} className={activeModule === item ? "active" : ""}>
          <button onClick={() => setActiveModule(item)}>{modules[item].label}</button>
          <button aria-label={`关闭${modules[item].label}`} onClick={() => closeModule(item)}>×</button>
        </div>)}
      </div>
      <div className="his-user">✉<sup>0</sup>　徐学庆(7275)<br/><small>眼视光中心</small>　●</div>
    </header>
    <div className="his-layout">
      <aside className="his-function-menu" aria-label="功能菜单">
        <div className="his-menu-root">☷　电子病历系统　⌄</div>
        <p>门诊业务</p>
        <button className={activeModule === "doctor" ? "active" : ""} onClick={() => openModule("doctor")}><span>♟</span>门诊医生工作台</button>
        <p>眼科专科</p>
        {(["population", "indicator", "template"] as ModuleKey[]).map((item) => <button key={item} className={activeModule === item ? "active" : ""} onClick={() => openModule(item)}><span>{modules[item].icon}</span>{modules[item].label}</button>)}
      </aside>
      <section className="his-workspace">
        {activeModule === "doctor" && <><ContactLensArchiveModule entryMode="doctor" /><button className="doctor-report-float" onClick={() => setReportOpen(true)}><span>▤</span><b>检查报告</b><em>3</em></button>{reportOpen&&<><div className="doctor-report-mask" onClick={()=>setReportOpen(false)}/><section className="doctor-report-panel"><header><div><span>当前患者报告</span><h2>吴四 · 检查报告</h2></div><button onClick={()=>setReportOpen(false)}>×</button></header><ExamReportModule embedded onClose={()=>setReportOpen(false)}/></section></>}</>}
        {activeModule === "population" && <ContactLensArchiveModule entryMode="population" />}
        {activeModule === "indicator" && <ClinicalIndicatorModule onNavigateTemplate={() => openModule("template")} />}
        {activeModule === "template" && <CheckTemplateModule onNavigateIndicator={() => openModule("indicator")} />}
      </section>
    </div>
  </div>;
}
