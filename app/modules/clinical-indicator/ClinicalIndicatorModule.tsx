"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GlobalDrawerLayer } from "../../components/GlobalDrawerLayer";
import {
  createSeedIndicators,
  canDeleteIndicator,
  filterIndicators,
  paginateIndicators,
  toggleIndicatorStatus,
  validateIndicator,
  nursingSigns,
  transitionIndicatorSource,
  enumInteractionMode,
  toggleEnumSelection,
  type EnumItem,
  type Indicator,
  type IndicatorDraft,
  type IndicatorFilters,
  type IndicatorType,
  type EyeOption,
  type ValidationErrors,
} from "./indicator-store";

const emptyFilters: IndicatorFilters = { keyword: "", source: "", status: "" };
function blankDraft(): IndicatorDraft {
  return {
    name: "", code: "", type: "", unit: "", eyeRule: ["OD", "OS"],
    source: "医技检查", status: "启用", description: "", referenceRange: "", referenced: false,
    numeric: { decimals: 2, min: undefined, max: undefined },
    externalMapping: { OD: "", OS: "" },
  };
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

export function ClinicalIndicatorModule({ onNavigateTemplate }: { onNavigateTemplate?: () => void }) {
  const [items, setItems] = useState<Indicator[]>(createSeedIndicators);
  const [filters, setFilters] = useState<IndicatorFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [drawer, setDrawer] = useState<{ mode: "add" | "edit" | "view"; code?: string } | null>(null);
  const [draft, setDraft] = useState<IndicatorDraft>(blankDraft);
  const [initialDraft, setInitialDraft] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusTarget, setStatusTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toast, setToast] = useState("");
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => filterIndicators(items, filters), [items, filters]);
  const paged = useMemo(() => paginateIndicators(filtered, page, pageSize), [filtered, page, pageSize]);
  const dirty = drawer?.mode !== "view" && initialDraft && JSON.stringify(draft) !== initialDraft;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function updateFilters(next: Partial<IndicatorFilters>) {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
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
      text: type === "文本型" ? { maxLength: 50 } : undefined,
      enumItems: type === "枚举型" || type === "多选枚举" ? [{ code: "", name: "", externalCode: "", order: 1, status: "启用", nature: 2, isDefault: false, allowsText: false }] : undefined,
      boolean: type === "布尔型" ? { trueLabel: "是", falseLabel: "否", trueExternalCode: "", falseExternalCode: "" } : undefined,
    }));
  }

  function changeSource(source: IndicatorDraft["source"]) {
    setDraft((current) => transitionIndicatorSource(current, source));
    setErrors({});
  }

  function toggleEye(eye: EyeOption) {
    setDraft((current) => ({
      ...current,
      eyeRule: eye === "无眼别"
        ? (current.eyeRule.includes("无眼别") ? [] : ["无眼别"])
        : current.eyeRule.includes(eye)
          ? current.eyeRule.filter((item) => item !== eye)
          : [...current.eyeRule.filter((item) => item !== "无眼别"), eye],
    }));
    setErrors((current) => ({ ...current, eyeRule: "", nursingMapping: "", externalMapping: "" }));
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
    const nature: EnumItem["nature"] = rows.some((item) => item.nature === 2) ? 2 : rows.some((item) => item.nature === 0 || item.nature === 1) ? 1 : 2;
    setField("enumItems", [...rows, { code: "", name: "", externalCode: "", order: rows.length + 1, status: "启用", nature, isDefault: false, allowsText: false }]);
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
  const deleteItem = items.find((item) => item.code === deleteTarget);

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
          <button className="nav-item" onClick={onNavigateTemplate}><Icon>▦</Icon><span className="nav-text">检查模板配置</span></button>
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
            <div className="filter-grid indicator-filters">
              <label>指标名称 / 编码<input value={filters.keyword} placeholder="请输入指标名称或编码" onChange={(e) => updateFilters({ keyword: e.target.value })} /></label>
              <label>数据来源<select value={filters.source} onChange={(e) => updateFilters({ source: e.target.value })}><option value="">全部</option><option>护士采集</option><option>医生查体</option><option>医技检查</option></select></label>
              <label>状态<select value={filters.status} onChange={(e) => updateFilters({ status: e.target.value })}><option value="">全部</option><option>启用</option><option>停用</option></select></label>
            </div>
          </section>

          <section className="card table-card">
            <div className="card-title"><div><h2>指标列表</h2><span>共 {filtered.length} 项临床指标</span></div><div className="legend"><span className="status-dot" /> 数据实时更新于当前原型</div></div>
            <div className="table-wrap">
              {paged.total ? <table><thead><tr><th>指标编码</th><th>指标名称</th><th>数据类型</th><th>单位</th><th>眼别</th><th>参考范围</th><th>数据来源</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
                <tbody>{paged.items.map((item) => <tr key={item.code}><td><code>{item.code}</code></td><td><strong>{item.name}</strong>{item.referenced && <span className="reference-dot" title="已被模板引用" />}</td><td><span className={`tag type ${item.type}`}>{item.type}</span></td><td>{item.unit || "—"}</td><td>{item.eyeRule.join("、")}</td><td>{item.referenceRange || "—"}</td><td><span className="source">{item.source}</span></td><td><span className={`tag status ${item.status}`}>{item.status}</span></td><td>{item.updatedAt}</td><td><div className="row-actions"><button onClick={() => openDrawer("view", item.code)}>查看</button><button onClick={() => openDrawer("edit", item.code)}>编辑</button><button className={item.status === "启用" ? "danger-link" : ""} onClick={() => setStatusTarget(item.code)}>{item.status === "启用" ? "停用" : "启用"}</button>{canDeleteIndicator(item) && <button className="danger-link" onClick={() => setDeleteTarget(item.code)}>删除</button>}</div></td></tr>)}</tbody></table>
              : <div className="empty"><div>⌕</div><h3>未找到符合条件的指标</h3><p>请修改或清空上方筛选条件</p></div>}
            </div>
            {paged.total > 0 && <div className="pagination"><span>共 {paged.total} 条</span><select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={5}>5 条/页</option><option value={10}>10 条/页</option></select><button disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)}>‹</button>{Array.from({ length: paged.pageCount }, (_, i) => <button key={i} className={paged.page === i + 1 ? "current" : ""} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button disabled={paged.page === paged.pageCount} onClick={() => setPage(paged.page + 1)}>›</button></div>}
          </section>
        </main>
      </section>

      <GlobalDrawerLayer open={Boolean(drawer)} label="指标信息抽屉" onMaskClick={requestCloseDrawer}>{drawer && <aside className="drawer indicator-drawer" aria-label="指标信息抽屉"><div className="drawer-head"><div><span className="eyebrow">临床指标</span><h2>{drawer.mode === "add" ? "新增指标" : drawer.mode === "edit" ? "编辑指标" : "指标详情"}</h2></div><button ref={drawerCloseRef} className="close" onClick={requestCloseDrawer} aria-label="关闭">×</button></div>
        <form onSubmit={submitDraft} className="drawer-form"><div className="drawer-body">
          {drawer.mode === "view" && <div className="detail-banner"><span>◎</span><div><strong>{draft.name}</strong><p>{draft.code} · {draft.type} · {draft.status}</p></div></div>}
          <section className="form-section"><h3><span>1</span>基础信息</h3><div className="form-grid">
            <Field label="指标名称" required error={errors.name}><input disabled={drawer.mode === "view"} value={draft.name} placeholder="如：眼压" onChange={(e) => setField("name", e.target.value)} /></Field>
            <Field label="指标编码" required error={errors.code} hint={drawer.mode === "add" ? "大写字母、数字、下划线或英文句点，如 OPH.TOPO.KS" : "创建后不可修改"}><input disabled={drawer.mode !== "add"} value={draft.code} placeholder="如：OPH.IOP" onChange={(e) => setField("code", e.target.value.toUpperCase())} /></Field>
            <Field label="数据类型" required error={errors.type} hint={drawer.mode === "edit" ? "创建后不可修改" : "按指标临床含义选择，决定展示和校验方式"}><select disabled={drawer.mode === "view" || drawer.mode === "edit"} value={draft.type} onChange={(e) => changeType(e.target.value as IndicatorType)}><option value="" disabled>请选择数据类型</option><option>数值型</option><option>文本型</option><option>枚举型</option><option>多选枚举</option><option>布尔型</option></select></Field>
            <div className="wide inline-config"><DataTypeConfig draft={draft} mode={drawer.mode} errors={errors} setField={setField} addEnumItem={addEnumItem} updateEnum={updateEnum} moveEnum={moveEnum} /></div>
            {draft.type === "数值型" && <Field label="单位"><input disabled={drawer.mode === "view"} value={draft.unit} placeholder="请输入单位，如 mmHg" onChange={(e) => setField("unit", e.target.value)} /></Field>}
            <Field label="参考范围"><input disabled={drawer.mode === "view"} value={draft.referenceRange} placeholder="如：10～21 mmHg" onChange={(e) => setField("referenceRange", e.target.value)} /></Field>
            <Field wide label="眼别" required error={errors.eyeRule} hint="OD、OS、OU 可多选；无眼别与其他选项互斥"><div className="eye-options">{(["OD", "OS", "OU", "无眼别"] as EyeOption[]).map((eye) => <label key={eye} className={draft.eyeRule.includes(eye) ? "checked" : ""}><input type="checkbox" disabled={drawer.mode === "view"} checked={draft.eyeRule.includes(eye)} onChange={() => toggleEye(eye)} />{eye}</label>)}</div></Field>
          </div></section>

          <section className="form-section"><h3><span>2</span>取值方式</h3><div className="form-grid">
            <Field wide label="数据来源" required error={errors.source} hint="选择后立即展示对应的取值关联配置"><select disabled={drawer.mode === "view"} value={draft.source} onChange={(e) => changeSource(e.target.value as IndicatorDraft["source"])}><option>护士采集</option><option>医生查体</option><option>医技检查</option></select></Field>
            <div className="wide inline-config"><EyeMappingFields draft={draft} mode={drawer.mode} errors={errors} setField={setField} /></div>
          </div></section>

          <section className="form-section"><h3><span>3</span>管理信息</h3><div className="form-grid">
            <Field label="状态" required><div className="segmented"><button type="button" disabled={drawer.mode === "view"} className={draft.status === "启用" ? "active" : ""} onClick={() => setField("status", "启用")}>启用</button><button type="button" disabled={drawer.mode === "view"} className={draft.status === "停用" ? "active off" : ""} onClick={() => setField("status", "停用")}>停用</button></div></Field>
            <Field wide label="指标说明"><textarea disabled={drawer.mode === "view"} value={draft.description} placeholder="说明指标的临床含义和使用场景" onChange={(e) => setField("description", e.target.value)} /></Field>
          </div></section>

          {draft.referenced && <section className="reference-box"><strong>已被业务模板引用</strong><p>当前指标被 {(draft as Indicator).referencedBy?.join("、")} 引用，只可停用，不可删除；历史数据不受影响。</p></section>}
        </div><div className="drawer-foot">{drawer.mode === "view" ? <button type="button" className="button primary" onClick={() => setDrawer(null)}>关闭</button> : <><button type="button" className="button" onClick={requestCloseDrawer}>取消</button>{drawer.mode === "add" && <button type="button" className="button" onClick={(e) => submitDraft(e as unknown as FormEvent, true)}>保存并新增</button>}<button className="button primary" type="submit">保存</button></>}</div></form></aside>}</GlobalDrawerLayer>

      {statusItem && <><div className="overlay dialog-layer" /><div className="dialog" role="dialog" aria-modal="true"><div className={`dialog-symbol ${statusItem.status === "启用" ? "warn" : "success"}`}>{statusItem.status === "启用" ? "!" : "✓"}</div><h2>确认{statusItem.status === "启用" ? "停用" : "启用"}指标？</h2><p>即将{statusItem.status === "启用" ? "停用" : "启用"}“{statusItem.name}（{statusItem.code}）”。</p>{statusItem.status === "启用" && <div className="impact">停用后不能被新的检查模板引用，历史检查数据仍可正常查看。</div>}<div className="dialog-actions"><button className="button" onClick={() => setStatusTarget(null)}>取消</button><button className={`button ${statusItem.status === "启用" ? "danger" : "primary"}`} onClick={() => { setItems(toggleIndicatorStatus(items, statusItem.code)); notify(`“${statusItem.name}”已${statusItem.status === "启用" ? "停用" : "启用"}`); setStatusTarget(null); }}>确认{statusItem.status === "启用" ? "停用" : "启用"}</button></div></div></>}
      {deleteItem && <><div className="overlay dialog-layer"/><div className="dialog" role="dialog" aria-modal="true"><div className="dialog-symbol warn">!</div><h2>确认删除指标？</h2><p>“{deleteItem.name}（{deleteItem.code}）”未被引用且无历史数据，删除后不可恢复。</p><div className="dialog-actions"><button className="button" onClick={() => setDeleteTarget(null)}>取消</button><button className="button danger" onClick={() => { setItems((current) => current.filter((item) => item.code !== deleteItem.code)); setDeleteTarget(null); notify("指标已删除"); }}>确认删除</button></div></div></>}
      {discardOpen && <DiscardChangesDialog returnFocusRef={drawerCloseRef} onContinue={() => setDiscardOpen(false)} onDiscard={() => { setDiscardOpen(false); setDrawer(null); }} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function DiscardChangesDialog({ onContinue, onDiscard, returnFocusRef }: { onContinue: () => void; onDiscard: () => void; returnFocusRef: { current: HTMLButtonElement | null } }) {
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    continueRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onContinue(); } };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); window.setTimeout(() => returnFocusRef.current?.focus(), 0); };
  }, [onContinue, returnFocusRef]);
  return createPortal(<><div className="overlay dialog-layer global-dialog-layer" /><div className="dialog global-discard-dialog" role="dialog" aria-modal="true" aria-labelledby="discard-title"><div className="dialog-symbol warn">!</div><h2 id="discard-title">放弃未保存的修改？</h2><p>当前表单内容尚未保存，关闭后本次修改将丢失。</p><div className="dialog-actions"><button ref={continueRef} className="button" onClick={onContinue}>继续编辑</button><button className="button danger" onClick={onDiscard}>放弃修改</button></div></div></>, document.body);
}

function EyeMappingFields({ draft, mode, errors, setField }: {
  draft: IndicatorDraft;
  mode: "add" | "edit" | "view";
  errors: ValidationErrors;
  setField: <K extends keyof IndicatorDraft>(key: K, value: IndicatorDraft[K]) => void;
}) {
  const readOnly = mode === "view";
  const updateNursing = (key: EyeOption, value: string) =>
    setField("nursingMapping", { ...draft.nursingMapping, [key]: value });
  const updateExternal = (key: EyeOption, value: string) =>
    setField("externalMapping", { ...draft.externalMapping, [key]: value.toUpperCase() });

  if (!draft.eyeRule.length) return null;
  return <div className="source-config compact-config">
    {draft.source === "护士采集" && <>
      <div className="config-note"><strong>护理体征关联</strong><p>从 HIHIS 字典 <code>hi.his.indnurtp</code> 中按眼别选择已有体征，支持输入编码或名称搜索。</p></div>
      {errors.nursingMapping && <p className="error banner-error">{errors.nursingMapping}</p>}
      <div className="form-grid">
        {draft.eyeRule.map((eye) => <NursingPicker key={eye} label={eye === "无眼别" ? "通用护理体征" : `${eye} 护理体征`} eye={eye === "无眼别" ? "无" : eye} value={draft.nursingMapping?.[eye] ?? ""} disabled={readOnly} onChange={(value) => updateNursing(eye, value)} />)}
      </div>
    </>}
    {draft.source === "医生查体" && <div className="config-note doctor"><strong>医生查体无需外部映射</strong><p>检查结果由医生在系统内直接录入，仅需维护眼别、数据类型与参考范围。</p></div>}
    {draft.source === "医技检查" && <>
      <div className="config-note"><strong>PACS 外部字段映射（选填）</strong><p>配置后可按接口字段自动转换写入；未配置时仍可保存指标，但不自动接收对应字段结果。</p></div>
      {errors.externalMapping && <p className="error banner-error">{errors.externalMapping}</p>}
      <div className="form-grid">
        {draft.eyeRule.map((eye) => <Field key={eye} label={`${eye}外部映射字段`} hint={`选填，如：RESULT_${eye === "无眼别" ? "GENERAL" : eye}`}><input disabled={readOnly} value={draft.externalMapping?.[eye] ?? ""} placeholder={`选填，输入${eye}返回字段`} onChange={(e) => updateExternal(eye, e.target.value)} /></Field>)}
      </div>
    </>}
  </div>;
}

function DataTypeConfig({ draft, mode, errors, setField, addEnumItem, updateEnum, moveEnum }: {
  draft: IndicatorDraft; mode: "add" | "edit" | "view"; errors: ValidationErrors;
  setField: <K extends keyof IndicatorDraft>(key: K, value: IndicatorDraft[K]) => void;
  addEnumItem: () => void; updateEnum: (index: number, patch: Partial<EnumItem>) => void; moveEnum: (index: number, delta: number) => void;
}) {
  const [previewNature, setPreviewNature] = useState<"正常" | "异常">("正常");
  const [previewSelected, setPreviewSelected] = useState<string[]>([]);
  const isQuickEnumPreview = enumInteractionMode(draft.enumItems) === "正常/异常快捷录入";
  const previewNatureValue = previewNature === "正常" ? 0 : 1;
  const previewEnumItems = (draft.enumItems ?? []).filter((item) => item.status === "启用" && (!isQuickEnumPreview || item.nature === previewNatureValue));

  function togglePreviewItem(code: string) {
    setPreviewSelected((current) => toggleEnumSelection(current, code, draft.enumItems, draft.type === "多选枚举"));
  }

  return <div className="type-config">
    {draft.type === "数值型" && <div className="form-grid"><Field label="小数位数" required error={errors.decimals}><select disabled={mode === "view"} value={draft.numeric?.decimals ?? 2} onChange={(e) => setField("numeric", { ...draft.numeric, decimals: Number(e.target.value) })}>{[0,1,2,3,4].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="正常范围" error={errors.numericRange}><div className="range"><input disabled={mode === "view"} type="number" placeholder="最小值" value={draft.numeric?.min ?? ""} onChange={(e) => setField("numeric", { ...draft.numeric!, min: e.target.value === "" ? undefined : Number(e.target.value) })} /><span>至</span><input disabled={mode === "view"} type="number" placeholder="最大值" value={draft.numeric?.max ?? ""} onChange={(e) => setField("numeric", { ...draft.numeric!, max: e.target.value === "" ? undefined : Number(e.target.value) })} /></div></Field></div>}
    {draft.type === "文本型" && <div className="form-grid"><Field label="最大长度" required error={errors.maxLength} hint="允许范围：1～200"><input disabled={mode === "view"} type="number" min={1} max={200} value={draft.text?.maxLength ?? 50} onChange={(e) => setField("text", { maxLength: Number(e.target.value) })} /></Field></div>}
    {(draft.type === "枚举型" || draft.type === "多选枚举") && <div className="enum-block">
      <div className="enum-toolbar"><div><p>{draft.type === "多选枚举" ? "支持同时选择多个启用项，按枚举编码集合保存。" : "枚举值在当前页面维护并保存至业务数据表。"}</p><strong>录入交互：{enumInteractionMode(draft.enumItems)}</strong></div>{mode !== "view" && <button type="button" className="button small" onClick={addEnumItem}>＋ 添加枚举项</button>}</div>
      {Object.entries(errors).some(([key]) => key.startsWith("enum")) && <p className="error banner-error">{Object.entries(errors).find(([key]) => key.startsWith("enum"))?.[1]}</p>}
      <div className="enum-table">
        <div className="enum-row header"><span>系统枚举编码</span><span>枚举名称</span><span>外部映射编码</span><span>结果属性</span><span>是否默认</span><span>是否补充文本</span><span>排序</span><span>状态</span><span>操作</span></div>
        {(draft.enumItems ?? []).map((row, index) => {
          const hasOtherConcreteResult = (draft.enumItems ?? []).some((item, itemIndex) => itemIndex !== index && (item.nature === 0 || item.nature === 1));
          const hasOtherNone = (draft.enumItems ?? []).some((item, itemIndex) => itemIndex !== index && item.nature === 2);
          return <div className="enum-item" key={`${row.code}-${index}`}><div className="enum-row">
            <input disabled={mode === "view"} value={row.code} placeholder="CODE" onChange={(e) => updateEnum(index, { code: e.target.value.toUpperCase() })} />
            <input disabled={mode === "view"} value={row.name} placeholder="选项名称" onChange={(e) => updateEnum(index, { name: e.target.value })} />
            <input disabled={mode === "view"} value={row.externalCode ?? ""} placeholder="选填，如：N" onChange={(e) => updateEnum(index, { externalCode: e.target.value.toUpperCase() })} />
            <select disabled={mode === "view"} value={row.nature ?? 2} onChange={(e) => updateEnum(index, { nature: Number(e.target.value) as EnumItem["nature"] })}>
              <option value={0} disabled={mode === "view" || hasOtherNone}>0-正常</option>
              <option value={1} disabled={mode === "view" || hasOtherNone}>1-异常</option>
              <option value={2} disabled={mode === "view" || hasOtherConcreteResult}>2-无</option>
            </select>
            <label className="enum-inline-check"><input type="checkbox" disabled={mode === "view"} checked={row.isDefault ?? false} onChange={(e) => updateEnum(index, { isDefault: e.target.checked })} />是</label>
            <label className="enum-inline-check"><input type="checkbox" disabled={mode === "view"} checked={row.allowsText ?? false} onChange={(e) => updateEnum(index, { allowsText: e.target.checked })} />是</label>
            <span>{index + 1}</span>
            <select disabled={mode === "view"} value={row.status} onChange={(e) => updateEnum(index, { status: e.target.value as IndicatorDraft["status"] })}><option>启用</option><option>停用</option></select>
            <div className="enum-actions">{mode !== "view" && <><button type="button" disabled={index === 0} onClick={() => moveEnum(index, -1)}>↑</button><button type="button" disabled={index === (draft.enumItems?.length ?? 0) - 1} onClick={() => moveEnum(index, 1)}>↓</button><button type="button" disabled={(draft.enumItems?.length ?? 0) === 1} onClick={() => setField("enumItems", draft.enumItems?.filter((_, i) => i !== index))}>×</button></>}</div>
          </div></div>;
        })}
      </div>
      <div className="enum-preview"><div className="enum-preview-title"><b>录入效果预览</b><span>可直接点击体验；上方枚举配置变化后，预览内容即时更新。</span>{isQuickEnumPreview && <div className="enum-preview-controls"><button type="button" className={previewNature === "正常" ? "active" : ""} onClick={() => setPreviewNature("正常")}>正常</button><button type="button" className={previewNature === "异常" ? "active abnormal" : ""} onClick={() => setPreviewNature("异常")}>异常</button></div>}</div><div className="enum-preview-result"><strong>{isQuickEnumPreview ? `${previewNature}结果` : "普通枚举录入"}</strong>{previewEnumItems.length ? <div className="enum-preview-options">{previewEnumItems.map((item) => { const selected = isQuickEnumPreview && previewNature === "正常" ? true : previewSelected.includes(item.code); return <label key={item.code} className={selected ? "selected" : ""}><input type={draft.type === "多选枚举" ? "checkbox" : "radio"} name="enum-preview" checked={selected} onChange={() => togglePreviewItem(item.code)} />{item.name}{item.allowsText && selected && <input className="enum-preview-text" placeholder="预览补充说明" maxLength={200} />}</label>; })}</div> : <span className="hint">当前没有启用的枚举项</span>}</div></div>
    </div>}
    {draft.type === "布尔型" && <div className="boolean-block"><div className="form-grid"><Field label="真值显示名称" required error={errors.booleanLabels}><input disabled={mode === "view"} value={draft.boolean?.trueLabel ?? ""} placeholder="如：是、阳性、存在" onChange={(e) => setField("boolean", { ...draft.boolean!, trueLabel: e.target.value })} /></Field><Field label="假值显示名称" required><input disabled={mode === "view"} value={draft.boolean?.falseLabel ?? ""} placeholder="如：否、阴性、不存在" onChange={(e) => setField("boolean", { ...draft.boolean!, falseLabel: e.target.value })} /></Field>{draft.source === "医技检查" && <><Field label="真值外部映射编码" error={errors.booleanExternalCodes} hint="选填；若填写则真假值需成对维护"><input disabled={mode === "view"} value={draft.boolean?.trueExternalCode ?? ""} placeholder="选填，如：1、Y、POSITIVE" onChange={(e) => setField("boolean", { ...draft.boolean!, trueExternalCode: e.target.value.toUpperCase() })} /></Field><Field label="假值外部映射编码" hint="选填；若填写则真假值需成对维护"><input disabled={mode === "view"} value={draft.boolean?.falseExternalCode ?? ""} placeholder="选填，如：0、N、NEGATIVE" onChange={(e) => setField("boolean", { ...draft.boolean!, falseExternalCode: e.target.value.toUpperCase() })} /></Field></>}</div></div>}
  </div>;
}

function NursingPicker({ label, eye, value, disabled, onChange }: { label: string; eye: "OD" | "OS" | "OU" | "无"; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const choices = nursingSigns.filter((item) => item.eye === eye);
  const listId = `nursing-${eye}-${label.includes("右") ? "right" : label.includes("左") ? "left" : "single"}`;
  const selected = nursingSigns.find((item) => item.code === value);
  return <label className="field"><span className="field-label"><b>*</b>{label}</span><input list={listId} disabled={disabled} value={value} placeholder="输入编码或名称搜索" onChange={(e) => onChange(e.target.value)} /><datalist id={listId}>{choices.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</datalist><span className="hint">{selected ? `${selected.code} · ${selected.name}` : "数据字典：hi.his.indnurtp"}</span></label>;
}

function Field({ label, required, error, hint, wide, children }: { label: string; required?: boolean; error?: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`field ${wide ? "wide" : ""}`}><span className="field-label">{required && <b>*</b>}{label}</span>{children}{error ? <span className="error">{error}</span> : hint ? <span className="hint">{hint}</span> : null}</label>;
}
