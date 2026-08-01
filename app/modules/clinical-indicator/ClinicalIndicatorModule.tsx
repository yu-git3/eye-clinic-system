"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  createSeedIndicators,
  filterIndicators,
  paginateIndicators,
  toggleIndicatorStatus,
  validateIndicator,
  type EnumItem,
  type Indicator,
  type IndicatorDraft,
  type IndicatorFilters,
  type IndicatorType,
  type ValidationErrors,
} from "./indicator-store";

const emptyFilters: IndicatorFilters = { name: "", code: "", type: "", source: "", status: "" };
const categories = ["视力", "眼压", "眼前节", "眼底", "屈光", "眼生物测量", "通用"];
const units = ["", "mmHg", "mm", "μm", "D", "%"];

function blankDraft(): IndicatorDraft {
  return {
    name: "", code: "", category: "", type: "数值型", unit: "", eyeRule: "OD/OS",
    source: "医技检查", status: "启用", description: "", referenced: false,
    numeric: { decimals: 2, min: undefined, max: undefined },
  };
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

export function ClinicalIndicatorModule() {
  const [items, setItems] = useState<Indicator[]>(createSeedIndicators);
  const [filters, setFilters] = useState<IndicatorFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<IndicatorFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit" | "view"; code?: string } | null>(null);
  const [draft, setDraft] = useState<IndicatorDraft>(blankDraft);
  const [initialDraft, setInitialDraft] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusTarget, setStatusTarget] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => filterIndicators(items, appliedFilters), [items, appliedFilters]);
  const paged = useMemo(() => paginateIndicators(filtered, page, pageSize), [filtered, page, pageSize]);
  const dirty = drawer?.mode !== "view" && initialDraft && JSON.stringify(draft) !== initialDraft;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function openDrawer(mode: "add" | "edit" | "view", code?: string) {
    const next = mode === "add" ? blankDraft() : structuredClone(items.find((item) => item.code === code)!);
    setDraft(next);
    setInitialDraft(JSON.stringify(next));
    setErrors({});
    setDrawer({ mode, code });
  }

  function requestCloseDrawer() {
    if (dirty) setDiscardOpen(true);
    else setDrawer(null);
  }

  function setField<K extends keyof IndicatorDraft>(key: K, value: IndicatorDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function changeType(type: IndicatorType) {
    setDraft((current) => ({
      ...current, type, unit: type === "数值型" ? current.unit : "",
      numeric: type === "数值型" ? { decimals: 2 } : undefined,
      text: type === "文本型" ? { maxLength: 500 } : undefined,
      enumItems: type === "枚举型" ? [{ code: "NORMAL", name: "正常", order: 1, status: "启用" }] : undefined,
    }));
  }

  function submitDraft(event: FormEvent, saveAndCreate = false) {
    event.preventDefault();
    const nextErrors = validateIndicator(draft, items, drawer?.mode === "edit" ? drawer.code : undefined);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const saved: Indicator = { ...draft, updatedAt: "2026-08-01 10:00" };
    setItems((current) => drawer?.mode === "edit"
      ? current.map((item) => item.code === drawer.code ? { ...item, ...saved } : item)
      : [saved, ...current]);
    notify(drawer?.mode === "edit" ? "指标信息已更新" : "临床指标已新增");
    if (saveAndCreate) {
      const next = blankDraft(); setDraft(next); setInitialDraft(JSON.stringify(next)); setDrawer({ mode: "add" });
    } else setDrawer(null);
  }

  function addEnumItem() {
    const rows = draft.enumItems ?? [];
    setField("enumItems", [...rows, { code: "", name: "", order: rows.length + 1, status: "启用" }]);
  }

  function updateEnum(index: number, patch: Partial<EnumItem>) {
    setField("enumItems", (draft.enumItems ?? []).map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function moveEnum(index: number, delta: number) {
    const rows = [...(draft.enumItems ?? [])];
    const next = index + delta;
    if (next < 0 || next >= rows.length) return;
    [rows[index], rows[next]] = [rows[next], rows[index]];
    setField("enumItems", rows.map((row, rowIndex) => ({ ...row, order: rowIndex + 1 })));
  }

  const statusItem = items.find((item) => item.code === statusTarget);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">HI</div><div><strong>眼科专科系统</strong><span>Ophthalmology Center</span></div></div>
        <nav aria-label="功能导航">
          <p className="nav-label">工作台</p>
          <button className="nav-item"><Icon>⌂</Icon><span className="nav-text">专科首页</span></button>
          <button className="nav-item"><Icon>▥</Icon><span className="nav-text">专科人群</span></button>
          <p className="nav-label">基础配置</p>
          <button className="nav-item active"><Icon>◎</Icon><span className="nav-text">临床指标定义</span></button>
          <button className="nav-item" disabled><Icon>▦</Icon><span className="nav-text">检查模板配置</span><span className="soon">待建设</span></button>
          <button className="nav-item" disabled><Icon>▤</Icon><span className="nav-text">病历模板配置</span><span className="soon">待建设</span></button>
          <p className="nav-label">业务应用</p>
          <button className="nav-item" disabled><Icon>◫</Icon><span className="nav-text">专科检查报告</span><span className="soon">待建设</span></button>
          <button className="nav-item" disabled><Icon>✚</Icon><span className="nav-text">专科病历</span><span className="soon">待建设</span></button>
        </nav>
        <div className="sidebar-foot"><span className="status-dot" /> 原型环境 · V1.0</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="icon-button" aria-label="折叠菜单">☰</button>
          <div className="topbar-title">Hi-HIS 一体化医生服务</div>
          <div className="topbar-actions"><button className="icon-button" aria-label="帮助">?</button><button className="notification" aria-label="消息">♧<b>3</b></button><div className="avatar">俞</div><div className="user"><strong>俞卿青</strong><span>产品管理员</span></div></div>
        </header>

        <main className="content">
          <div className="breadcrumb">眼科专科管理 <span>/</span> 基础配置 <span>/</span> 临床指标定义</div>
          <section className="page-heading">
            <div><h1>临床指标定义</h1><p>统一维护眼科专科临床数据标准，为检查模板、数据映射和临床展示提供基础支撑。</p></div>
            <button className="button primary" onClick={() => openDrawer("add")}><Icon>＋</Icon>新增指标</button>
          </section>

          <section className="card filter-card">
            <div className="filter-grid">
              <label>指标名称<input value={filters.name} placeholder="请输入指标名称" onChange={(e) => setFilters({ ...filters, name: e.target.value })} /></label>
              <label>指标编码<input value={filters.code} placeholder="请输入指标编码" onChange={(e) => setFilters({ ...filters, code: e.target.value })} /></label>
              <label>数据类型<select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">全部</option><option>数值型</option><option>文本型</option><option>枚举型</option></select></label>
              <label>数据来源<select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}><option value="">全部</option><option>护士采集</option><option>医生录入</option><option>医技检查</option></select></label>
              <label>状态<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">全部</option><option>启用</option><option>停用</option></select></label>
              <div className="filter-actions"><button className="button primary" onClick={() => { setAppliedFilters(filters); setPage(1); }}>查询</button><button className="button" onClick={() => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); setPage(1); }}>重置</button></div>
            </div>
          </section>

          <section className="card table-card">
            <div className="card-title"><div><h2>指标列表</h2><span>共 {filtered.length} 项临床指标</span></div><div className="legend"><span className="status-dot" /> 数据实时更新于当前原型</div></div>
            <div className="table-wrap">
              {paged.total ? <table><thead><tr><th>指标编码</th><th>指标名称</th><th>指标分类</th><th>数据类型</th><th>单位</th><th>眼别</th><th>数据来源</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
                <tbody>{paged.items.map((item) => <tr key={item.code}><td><code>{item.code}</code></td><td><strong>{item.name}</strong>{item.referenced && <span className="reference-dot" title="已被模板引用" />}</td><td>{item.category}</td><td><span className={`tag type ${item.type}`}>{item.type}</span></td><td>{item.unit || "—"}</td><td>{item.eyeRule}</td><td><span className="source">{item.source}</span></td><td><span className={`tag status ${item.status}`}>{item.status}</span></td><td>{item.updatedAt}</td><td><div className="row-actions"><button onClick={() => openDrawer("view", item.code)}>查看</button><button onClick={() => openDrawer("edit", item.code)}>编辑</button><button className={item.status === "启用" ? "danger-link" : ""} onClick={() => setStatusTarget(item.code)}>{item.status === "启用" ? "停用" : "启用"}</button></div></td></tr>)}</tbody></table>
              : <div className="empty"><div>⌕</div><h3>未找到符合条件的指标</h3><p>请调整查询条件，或重置后查看全部指标。</p><button className="button" onClick={() => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); }}>重置查询</button></div>}
            </div>
            {paged.total > 0 && <div className="pagination"><span>共 {paged.total} 条</span><select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={5}>5 条/页</option><option value={10}>10 条/页</option></select><button disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)}>‹</button>{Array.from({ length: paged.pageCount }, (_, i) => <button key={i} className={paged.page === i + 1 ? "current" : ""} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button disabled={paged.page === paged.pageCount} onClick={() => setPage(paged.page + 1)}>›</button></div>}
          </section>
        </main>
      </section>

      {drawer && <><div className="overlay" onClick={requestCloseDrawer} /><aside className="drawer" aria-label="指标信息抽屉"><div className="drawer-head"><div><span className="eyebrow">临床指标</span><h2>{drawer.mode === "add" ? "新增指标" : drawer.mode === "edit" ? "编辑指标" : "指标详情"}</h2></div><button className="close" onClick={requestCloseDrawer} aria-label="关闭">×</button></div>
        <form onSubmit={submitDraft} className="drawer-form"><div className="drawer-body">
          {drawer.mode === "view" && <div className="detail-banner"><span>◎</span><div><strong>{draft.name}</strong><p>{draft.code} · {draft.type} · {draft.status}</p></div></div>}
          <section className="form-section"><h3><span>1</span>基础信息</h3><div className="form-grid">
            <Field label="指标名称" required error={errors.name}><input disabled={drawer.mode === "view"} value={draft.name} placeholder="如：眼压" onChange={(e) => setField("name", e.target.value)} /></Field>
            <Field label="指标编码" required error={errors.code} hint={drawer.mode === "add" ? "大写字母、数字或下划线" : "创建后不可修改"}><input disabled={drawer.mode !== "add"} value={draft.code} placeholder="如：IOP" onChange={(e) => setField("code", e.target.value.toUpperCase())} /></Field>
            <Field label="指标分类" required error={errors.category}><select disabled={drawer.mode === "view"} value={draft.category} onChange={(e) => setField("category", e.target.value)}><option value="">请选择</option>{categories.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="数据类型" required hint={drawer.mode === "edit" ? "创建后不可修改" : "决定指标的录入与校验方式"}><select disabled={drawer.mode !== "add"} value={draft.type} onChange={(e) => changeType(e.target.value as IndicatorType)}><option>数值型</option><option>文本型</option><option>枚举型</option></select></Field>
            {draft.type === "数值型" && <Field label="单位"><select disabled={drawer.mode === "view"} value={draft.unit} onChange={(e) => setField("unit", e.target.value)}>{units.map((x) => <option key={x} value={x}>{x || "无单位"}</option>)}</select></Field>}
            <Field label="眼别" required hint={draft.eyeRule === "OD/OS" ? "分别记录右眼与左眼" : draft.eyeRule === "OU" ? "双眼合并记录" : "不区分眼别"}><select disabled={drawer.mode === "view"} value={draft.eyeRule} onChange={(e) => setField("eyeRule", e.target.value as IndicatorDraft["eyeRule"])}><option>无眼别</option><option>OD/OS</option><option>OU</option></select></Field>
            <Field label="数据来源" required error={errors.source} hint="PACS/设备回传归入医技检查"><select disabled={drawer.mode === "view"} value={draft.source} onChange={(e) => setField("source", e.target.value as IndicatorDraft["source"])}><option>护士采集</option><option>医生录入</option><option>医技检查</option></select></Field>
            <Field label="状态" required><div className="segmented"><button type="button" disabled={drawer.mode === "view"} className={draft.status === "启用" ? "active" : ""} onClick={() => setField("status", "启用")}>启用</button><button type="button" disabled={drawer.mode === "view"} className={draft.status === "停用" ? "active off" : ""} onClick={() => setField("status", "停用")}>停用</button></div></Field>
            <Field wide label="指标说明"><textarea disabled={drawer.mode === "view"} value={draft.description} placeholder="说明指标的临床含义和使用场景" onChange={(e) => setField("description", e.target.value)} /></Field>
          </div></section>

          <section className="form-section"><h3><span>2</span>{draft.type}配置</h3>
            {draft.type === "数值型" && <div className="form-grid"><Field label="小数位数" required error={errors.decimals}><select disabled={drawer.mode === "view"} value={draft.numeric?.decimals ?? 2} onChange={(e) => setField("numeric", { ...draft.numeric, decimals: Number(e.target.value) })}>{[0,1,2,3,4].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="正常范围" error={errors.numericRange}><div className="range"><input disabled={drawer.mode === "view"} type="number" placeholder="最小值" value={draft.numeric?.min ?? ""} onChange={(e) => setField("numeric", { ...draft.numeric!, min: e.target.value === "" ? undefined : Number(e.target.value) })} /><span>至</span><input disabled={drawer.mode === "view"} type="number" placeholder="最大值" value={draft.numeric?.max ?? ""} onChange={(e) => setField("numeric", { ...draft.numeric!, max: e.target.value === "" ? undefined : Number(e.target.value) })} /></div></Field></div>}
            {draft.type === "文本型" && <div className="form-grid"><Field label="最大长度" required error={errors.maxLength} hint="允许范围：1～2000"><input disabled={drawer.mode === "view"} type="number" value={draft.text?.maxLength ?? 500} onChange={(e) => setField("text", { maxLength: Number(e.target.value) })} /></Field></div>}
            {draft.type === "枚举型" && <div className="enum-block"><div className="enum-toolbar"><p>维护该指标允许选择的固定选项</p>{drawer.mode !== "view" && <button type="button" className="button small" onClick={addEnumItem}>＋ 添加枚举项</button>}</div>{errors.enumItems && <p className="error banner-error">{errors.enumItems}</p>}<div className="enum-table"><div className="enum-row header"><span>枚举编码</span><span>枚举名称</span><span>排序</span><span>状态</span><span>操作</span></div>{(draft.enumItems ?? []).map((row, index) => <div className="enum-row" key={`${row.code}-${index}`}><input disabled={drawer.mode === "view"} value={row.code} placeholder="CODE" onChange={(e) => updateEnum(index, { code: e.target.value.toUpperCase() })} /><input disabled={drawer.mode === "view"} value={row.name} placeholder="选项名称" onChange={(e) => updateEnum(index, { name: e.target.value })} /><span>{index + 1}</span><select disabled={drawer.mode === "view"} value={row.status} onChange={(e) => updateEnum(index, { status: e.target.value as IndicatorDraft["status"] })}><option>启用</option><option>停用</option></select><div className="enum-actions">{drawer.mode !== "view" && <><button type="button" disabled={index === 0} onClick={() => moveEnum(index, -1)}>↑</button><button type="button" disabled={index === (draft.enumItems?.length ?? 0) - 1} onClick={() => moveEnum(index, 1)}>↓</button><button type="button" disabled={(draft.enumItems?.length ?? 0) === 1} onClick={() => setField("enumItems", draft.enumItems?.filter((_, i) => i !== index))}>×</button></>}</div></div>)}</div></div>}
          </section>
          {draft.referenced && <section className="reference-box"><strong>已被业务模板引用</strong><p>当前指标被 {(draft as Indicator).referencedBy?.join("、")} 引用，只可停用，不可删除；历史数据不受影响。</p></section>}
        </div><div className="drawer-foot">{drawer.mode === "view" ? <button type="button" className="button primary" onClick={() => setDrawer(null)}>关闭</button> : <><button type="button" className="button" onClick={requestCloseDrawer}>取消</button>{drawer.mode === "add" && <button type="button" className="button" onClick={(e) => submitDraft(e as unknown as FormEvent, true)}>保存并新增</button>}<button className="button primary" type="submit">保存</button></>}</div></form></aside></>}

      {statusItem && <><div className="overlay dialog-layer" /><div className="dialog" role="dialog" aria-modal="true"><div className={`dialog-symbol ${statusItem.status === "启用" ? "warn" : "success"}`}>{statusItem.status === "启用" ? "!" : "✓"}</div><h2>确认{statusItem.status === "启用" ? "停用" : "启用"}指标？</h2><p>即将{statusItem.status === "启用" ? "停用" : "启用"}“{statusItem.name}（{statusItem.code}）”。</p>{statusItem.status === "启用" && <div className="impact">停用后不能被新的检查模板引用，历史检查数据仍可正常查看。</div>}<div className="dialog-actions"><button className="button" onClick={() => setStatusTarget(null)}>取消</button><button className={`button ${statusItem.status === "启用" ? "danger" : "primary"}`} onClick={() => { setItems(toggleIndicatorStatus(items, statusItem.code)); notify(`“${statusItem.name}”已${statusItem.status === "启用" ? "停用" : "启用"}`); setStatusTarget(null); }}>确认{statusItem.status === "启用" ? "停用" : "启用"}</button></div></div></>}
      {discardOpen && <><div className="overlay dialog-layer" /><div className="dialog" role="dialog" aria-modal="true"><div className="dialog-symbol warn">!</div><h2>放弃未保存的修改？</h2><p>当前表单内容尚未保存，关闭后本次修改将丢失。</p><div className="dialog-actions"><button className="button" onClick={() => setDiscardOpen(false)}>继续编辑</button><button className="button danger" onClick={() => { setDiscardOpen(false); setDrawer(null); }}>放弃修改</button></div></div></>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function Field({ label, required, error, hint, wide, children }: { label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`field ${wide ? "wide" : ""}`}><span className="field-label">{required && <b>*</b>}{label}</span>{children}{error ? <span className="error">{error}</span> : hint ? <span className="hint">{hint}</span> : null}</label>;
}
