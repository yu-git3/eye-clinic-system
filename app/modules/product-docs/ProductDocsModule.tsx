"use client";

import { useState } from "react";

type PrototypeTarget = "indicator" | "template" | "doctor" | "report";

const documents = [
  { id: "indicator", title: "临床指标定义", version: "V1.3", updatedAt: "2026-08-04", path: "/prd/clinical-indicator-v1.3.html", target: "indicator" as PrototypeTarget },
  { id: "template", title: "检查模板配置", version: "V1.2", updatedAt: "2026-08-04", path: "/prd/check-template-v1.2.html", target: "template" as PrototypeTarget },
  { id: "report", title: "检查报告查询", version: "V1.3", updatedAt: "2026-08-04", path: "/prd/exam-report-v1.3.html", target: "report" as PrototypeTarget },
  { id: "archive", title: "角膜接触镜治疗方案基础档案", version: "V1.4", updatedAt: "2026-08-04", path: "/prd/contact-lens-archive-v1.4.html", target: "doctor" as PrototypeTarget },
  { id: "record", title: "角膜接触镜专科病历", version: "V1.0", updatedAt: "2026-08-02", path: "/prd/specialty-record-v1.0.html", target: "doctor" as PrototypeTarget },
];

export function ProductDocsModule({ onOpenPrototype }: { onOpenPrototype: (target: PrototypeTarget) => void }) {
  const [activeId, setActiveId] = useState(documents[0].id);
  const [keyword, setKeyword] = useState("");
  const active = documents.find((item) => item.id === activeId) ?? documents[0];
  const filtered = documents.filter((item) => `${item.title}${item.version}`.toLowerCase().includes(keyword.trim().toLowerCase()));

  return <div className="product-docs-page">
    <header className="product-docs-header">
      <div><span>产品资料</span><h1>产品文档</h1><p>集中查看眼科专科系统各功能模块的最新需求说明。</p></div>
      <button onClick={() => onOpenPrototype(active.target)}>查看对应原型</button>
    </header>
    <div className="product-docs-layout">
      <aside className="product-docs-list">
        <label>文档检索<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索功能名称或版本" /></label>
        <div className="product-docs-count">最新文档 <b>{filtered.length}</b></div>
        <nav>
          {filtered.map((item) => <button key={item.id} className={active.id === item.id ? "active" : ""} onClick={() => setActiveId(item.id)}>
            <span>{item.title}</span>
            <small><b>{item.version}</b>　更新于 {item.updatedAt}</small>
          </button>)}
          {!filtered.length && <p className="product-docs-empty">未找到匹配的文档</p>}
        </nav>
      </aside>
      <main className="product-docs-reader">
        <div className="product-docs-reader-bar">
          <div><h2>{active.title}</h2><span>{active.version} · {active.updatedAt} · 当前最新版本</span></div>
          <span className="product-docs-online">在线阅读</span>
        </div>
        <iframe key={active.path} title={`${active.title} ${active.version}`} src={active.path} />
      </main>
    </div>
  </div>;
}
