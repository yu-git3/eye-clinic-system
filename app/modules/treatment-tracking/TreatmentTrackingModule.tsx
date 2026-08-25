"use client";

import { useMemo, useState } from "react";
import {
  brands,
  copyEyeParameters,
  createOrderDraft,
  createReplacementDraft,
  groupOrdersByBrand,
  setBrandMode,
  updateEyeBrand,
  updateEyeParameter,
  type Eye,
  type OrderDraft,
} from "./treatment-store";

type Props = { embedded?: boolean; readOnly?: boolean };
type OrderRecord = { batch: string; orderNo: string; eyes: string; brand: string; orderedAt: string; status: string; medicalOrder: string };
type NodeAction = "trial" | "finalize" | "inspection" | "notify" | "delivery" | "review" | "complete" | "terminate";
type NodeRecord = { date: string; time: string; node: string; action?: NodeAction | "order"; content: string; interval: string; operator: string };

const initialOrders: OrderRecord[] = [
  { batch: "BATCH-20250718-01", orderNo: "ORD-20250718-026", eyes: "OD、OS", brand: "CRT 100系列", orderedAt: "2025-07-18", status: "已交付", medicalOrder: "MO-20250718-8831" },
  { batch: "BATCH-20250510-01", orderNo: "ORD-20250510-011", eyes: "OD、OS", brand: "梦戴维 DreamLite", orderedAt: "2025-05-10", status: "已更换", medicalOrder: "MO-20250510-6102" },
];

const visits = [
  { id: "VISIT-20260825-1036", time: "2026-08-25 10:36", diagnosis: "屈光不正（近视）", doctor: "方红全" },
  { id: "VISIT-20260802-1036", time: "2026-08-02 10:36", diagnosis: "角膜塑形镜复查", doctor: "方红全" },
];
const medicalOrders = [
  { id: "MO-20240618-8831", name: "角膜塑形镜定制加工费（历史）", fee: "6,800.00", status: "已缴费" },
  { id: "MO-20260825-9251", name: "角膜塑形镜定制加工费", fee: "4,980.00", status: "已缴费" },
  { id: "MO-20260825-9252", name: "角膜接触镜单眼换片", fee: "2,580.00", status: "未缴费" },
];

export function TreatmentTrackingModule({ embedded = false, readOnly = false }: Props) {
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [orders, setOrders] = useState(initialOrders);
  const [historyEye, setHistoryEye] = useState<"ALL" | Eye>("ALL");
  const [selectedLens, setSelectedLens] = useState<"current" | "previous" | "history-1">("current");
  const [lensExample, setLensExample] = useState<"same" | "different">("same");
  const [prototypeView, setPrototypeView] = useState<"new" | "legacy">("new");
  const [nodeAction, setNodeAction] = useState<NodeAction | null>(null);
  const [replacementStartOpen, setReplacementStartOpen] = useState(false);
  const [activeReplacement, setActiveReplacement] = useState<"BOTH" | Eye | null>(null);
  const [extraRecords, setExtraRecords] = useState<NodeRecord[]>([]);
  const [toast, setToast] = useState("");
  const groups = useMemo(() => draft ? groupOrdersByBrand(draft) : [], [draft]);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2200); };

  function openOrder() { setDraft(setBrandMode(createOrderDraft(), "different")); }
  function openReplacement() { setReplacementStartOpen(true); }
  function startReplacement(scope: "BOTH" | Eye) {
    setActiveReplacement(scope);
    setReplacementStartOpen(false);
    setNodeAction("trial");
    notify(`已开启第2镜片周期（${scope==="BOTH"?"双眼":scope}），请完成试戴`);
  }
  function submitOrder() {
    if (!draft) return;
    const targetEyes: Eye[] = activeReplacement === "OD" ? ["OD"] : activeReplacement === "OS" ? ["OS"] : draft.selectedEyes;
    const validMedicalOrders = targetEyes.every((eye)=>draft.eyeOrderIds[eye]);
    if (!validMedicalOrders) return;
    const stamp = String(orders.length + 27).padStart(3, "0");
    const created = targetEyes.map((eye, index) => ({
      batch: `BATCH-20260825-${String(orders.length + 2).padStart(2, "0")}`,
      orderNo: `ORD-20260825-${stamp}${index ? `-${index + 1}` : ""}`,
      eyes: eye, brand: brands.find((item)=>item.id===draft.eyeConfigs[eye].brandId)?.name??draft.eyeConfigs[eye].brandId, orderedAt: "2026-08-25", status: "已下单", medicalOrder: draft.eyeOrderIds[eye],
    }));
    setOrders((current) => [...created, ...current]); setDraft(null); notify(`已生成${created.length}张镜片订单`);
  }
  function saveNodeAction(record: NodeRecord) {
    const actionByNode: Record<string, NodeAction> = {
      "试戴": "trial", "定片": "finalize", "验片": "inspection", "取片通知": "notify", "交付": "delivery",
      "复查": "review", "完成治疗": "complete", "终止治疗": "terminate",
    };
    setExtraRecords((current)=>[{...record, action: record.action ?? actionByNode[record.node]},...current]);
    setNodeAction(null);
    notify(`${record.node}记录已保存`);
  }

  return <div className={`tt-page ${embedded ? "embedded" : "standalone"}`}>
    <header className="tt-context"><div><span>角膜接触镜治疗跟踪</span><h1>OK镜治疗管理</h1><p>档案 CL-20260802-0001　{activeReplacement ? `第2镜片周期 · ${activeReplacement === "BOTH" ? "双眼" : activeReplacement}换片 · 试戴中` : "第1镜片周期"}　责任医生：方红全</p></div><div className="tt-patient"><b>吴四　男　14岁</b><span>病历号 V00000009340</span><em>{activeReplacement?"换片试戴中":"治疗中"}</em></div></header>
    <div className="tt-action-bar"><div><b>治疗跟踪</b><div className="tt-review-tabs"><button className={prototypeView==="new"?"active":""} onClick={()=>setPrototypeView("new")}>新版原型</button><button className={prototypeView==="legacy"?"active":""} onClick={()=>setPrototypeView("legacy")}>原HTML对照</button></div><span>{prototypeView==="new"?"同一工作区查看当前与历史镜片组合":"评审对照，不修改原HTML内容"}</span></div>{prototypeView==="new"&&<div><label className="tt-lens-picker">镜片组合<select value={selectedLens} onChange={(e)=>setSelectedLens(e.target.value as "current"|"previous"|"history-1")}><option value="current">{lensExample==="different"?"当前组合｜OD CRT 2025-07-25 / OS 梦戴维 2026-02-12｜使用中":"当前组合｜OD/OS CRT 2025-07-25｜使用中"}</option><option value="previous">上一组合｜OD CRT（沿用）/ OS CRT（已更换）｜2025-07-25 至 2026-02-11</option><option value="history-1">历史组合｜OD/OS 梦戴维｜2024-07-03 至 2025-07-24｜已结束</option></select></label>{selectedLens!=="current"&&<em className="tt-readonly-tag">历史组合 · 只读</em>}</div>}</div>
    {prototypeView==="new"?<Overview onReplace={openReplacement} onOrder={openOrder} onNodeAction={setNodeAction} activeReplacement={activeReplacement} readOnly={readOnly||selectedLens!=="current"} historyMode={selectedLens==="current"?null:selectedLens} example={lensExample} setExample={setLensExample} extraRecords={extraRecords}/>:<section className="tt-legacy-compare"><div><b>原《OK镜治疗管理.html》</b><span>用于与当前方案并行对照</span></div><iframe title="原OK镜治疗管理HTML对照" src="/legacy/ok-lens-treatment.html"/></section>}
    {draft && <OrderDrawer draft={draft} setDraft={setDraft} groups={groups} scope={activeReplacement} onClose={() => setDraft(null)} onSubmit={submitOrder}/>} 
    {nodeAction&&<NodeActionDrawer action={nodeAction} scope={activeReplacement} onClose={()=>setNodeAction(null)} onSave={saveNodeAction}/>} 
    {replacementStartOpen&&<ReplacementStartModal onClose={()=>setReplacementStartOpen(false)} onConfirm={startReplacement}/>} 
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;
}

function Overview({ onReplace, onOrder, onNodeAction, activeReplacement, readOnly, historyMode, example, setExample, extraRecords }: { onReplace: () => void; onOrder: () => void; onNodeAction: (action: NodeAction) => void; activeReplacement: "BOTH" | Eye | null; readOnly: boolean; historyMode: "previous" | "history-1" | null; example: "same" | "different"; setExample: (value: "same" | "different") => void; extraRecords: NodeRecord[] }) {
  const historical = historyMode !== null;
  const previous = historyMode === "previous";
  const different = !historical && example === "different";
  const [detail, setDetail] = useState<NodeRecord | null>(null);
  const progressSteps = previous ? [["试戴","2025-07-12","已完成"],["定片","2025-07-18","已完成"],["镜片下单","2025-07-18","已完成"],["验片交付","2025-07-25","已完成"],["周期复查","2026-01-25","已完成"],["OS换片","2026-02-12","已完成"]] : historical ? [["试戴","2024-06-15","已完成"],["定片","2024-06-18","已完成"],["镜片下单","2024-06-18","已完成"],["验片交付","2024-07-03","已完成"],["周期复查","2025-01-03","已完成"],["双眼换片","2025-07-25","已完成"]] : [["试戴","2025-07-12","已完成"],["定片","2025-07-18","已完成"],["镜片下单",different?"分品牌下单":"2025-07-18","已完成"],["验片交付",different?"OD 2025-07-25|OS 2026-02-12":"2025-07-25","已完成"],["周期复查","2026-08-25","进行中"],["换片评估","按眼评估","待处理"]];
  const olderHistoricalRecords: NodeRecord[] = [
    {date:"2025-07-25",time:"2025-07-25 09:30",node:"完成治疗",action:"complete",content:"第一副镜片治疗周期完成，更换新镜片。",interval:"交付后12月22天",operator:"方红全"},
    {date:"2025-01-03",time:"2025-01-03 10:15",node:"复查",action:"review",content:"6月复查，双眼视力1.0，角膜正常，镜片轻微划痕。",interval:"交付后6月0天",operator:"林医生"},
    {date:"2024-07-03",time:"2024-07-03 15:40",node:"交付",action:"delivery",content:"双眼梦戴维镜片交付，完成戴镜及护理指导。",interval:"双眼启用",operator:"林医生"},
    {date:"2024-07-01",time:"2024-07-01 14:10",node:"取片通知",action:"notify",content:"短信通知患者来院取片。",interval:"验片后7天",operator:"林医生"},
    {date:"2024-06-24",time:"2024-06-24 11:20",node:"验片",action:"inspection",content:"镜片到货，外观及参数验收合格。",interval:"下单后6天",operator:"林医生"},
    {date:"2024-06-18",time:"2024-06-18 09:45",node:"镜片下单",action:"order",content:"双眼梦戴维镜片完成下单并关联已缴费医嘱。",interval:"试戴后3天",operator:"林医生"},
    {date:"2024-06-15",time:"2024-06-15 16:00",node:"试戴",action:"trial",content:"双眼试戴，中心定位良好，荧光染色0级。",interval:"治疗开始",operator:"林医生"},
  ];
  const previousHistoricalRecords: NodeRecord[] = [
    {date:"2026-02-12",time:"2026-02-12 15:20",node:"OS换片交付",action:"delivery",content:"OS更换为梦戴维镜片；OD原CRT镜片继续沿用。",interval:"组合阶段结束",operator:"徐英男"},
    {date:"2026-01-25",time:"2026-01-25 10:18",node:"复查",action:"review",content:"OD镜片状态良好；OS建议更换镜片。",interval:"交付后6月",operator:"方红全"},
    {date:"2025-07-25",time:"2025-07-25 14:35",node:"交付",action:"delivery",content:"OD、OS CRT镜片同批交付并启用。",interval:"双眼启用",operator:"徐珊珊"},
    {date:"2025-07-18",time:"2025-07-18 11:06",node:"镜片下单",action:"order",content:"OD、OS分别维护镜片明细并完成下单。",interval:"试戴后6天",operator:"方红全"},
    {date:"2025-07-12",time:"2025-07-12 16:10",node:"试戴",action:"trial",content:"双眼CRT试戴，配适良好。",interval:"治疗开始",operator:"方红全"},
  ];
  const historicalRecords = previous ? previousHistoricalRecords : olderHistoricalRecords;
  const dispositions: NodeRecord[] = historical ? historicalRecords : [...extraRecords, ...(different ? [
    { date:"2026-08-25", time:"2026-08-25 10:48", node:"复查", action:"review", content:"双眼戴镜状态良好，继续观察。", interval:"OD交付后13月0天；OS交付后6月13天", operator:"方红全" },
    { date:"2026-02-12", time:"2026-02-12 15:20", node:"交付", action:"delivery", content:"OS 梦戴维 DreamLite Pro镜片验收合格，完成交付并启用。", interval:"OS启用", operator:"徐英男" },
    { date:"2025-07-25", time:"2025-07-25 14:35", node:"交付", action:"delivery", content:"OD CRT 100系列镜片验收合格，完成交付并启用。", interval:"OD启用", operator:"徐珊珊" },
    { date:"2025-07-18", time:"2025-07-18 11:06", node:"镜片下单", action:"order", content:"OD与OS按不同品牌分别生成产品订单。", interval:"—", operator:"方红全" },
  ] : [
    { date:"2026-08-25", time:"2026-08-25 10:48", node:"复查", action:"review", content:"双眼戴镜状态良好，继续观察。", interval:"交付后13月0天", operator:"方红全" },
    { date:"2025-07-25", time:"2025-07-25 14:35", node:"交付", action:"delivery", content:"双眼CRT 100系列镜片验收合格，同批交付并启用。", interval:"双眼启用", operator:"徐珊珊" },
    { date:"2025-07-18", time:"2025-07-18 11:06", node:"镜片下单", action:"order", content:"双眼同品牌合并生成一张产品订单。", interval:"—", operator:"方红全" },
  ])];
  let detailOrderDraft=createOrderDraft();
  if(different){detailOrderDraft=setBrandMode(detailOrderDraft,"different");detailOrderDraft=updateEyeBrand(detailOrderDraft,"OS","dreamlite");detailOrderDraft.eyeOrderIds={OD:"MO-20260825-9251",OS:"MO-20260825-9252"};}
  else{const linkedOrder=historical&&!previous?"MO-20240618-8831":"MO-20260825-9251";detailOrderDraft=setBrandMode(detailOrderDraft,"different");detailOrderDraft.eyeOrderIds={OD:linkedOrder,OS:linkedOrder};if(historical&&!previous){detailOrderDraft=updateEyeBrand(detailOrderDraft,"OD","dreamlite");detailOrderDraft=updateEyeBrand(detailOrderDraft,"OS","dreamlite");}}
  return <main className="tt-main">
    {!historical&&<div className="tt-example-bar"><span>数据样例</span><div className="tt-segment"><button className={!different?"active":""} onClick={()=>setExample("same")}>同品牌同批交付</button><button className={different?"active":""} onClick={()=>setExample("different")}>异品牌不同日期</button></div><p>{different?"左右眼分别关联品牌、产品订单和实际交付日期":"常见场景，双眼合并下单并同批交付"}</p></div>}
    <section className={`tt-current-card ${different?"different-lenses":""}`}><header><div><span className="tt-dot"/><div><h2>{previous?"上一镜片组合":historical?"历史镜片组合":"当前镜片组合"}</h2><p>{previous?"OS已更换，OD原镜片沿用至当前组合；以下内容只读":historical?"双眼均已更换；以下内容只读":different?"左右眼异品牌·分批交付，按眼独立管理":"双眼同品牌·同批交付，合并展示"}</p></div></div></header><div className="tt-eye-grid">
      <article><strong>OD</strong><div><span className="tt-lens-brand">{previous?"CRT　100系列":historical?"梦戴维　DreamLite":"CRT　100系列"}</span><b>{historical&&!previous?"BC 8.40　DIA 10.60　-3.25D":"BC 8.50　DIA 10.60　-3.00D"}</b><span>{historical&&!previous?"E值 0.55　目标降幅 -3.25D":"RZD 550μm　LZA 34°"}</span></div><dl><dt>订单</dt><dd>{previous?"ORD-20250718-026":historical?"ORD-20240618-001":"ORD-20250718-026"}</dd><dt>交付/启用</dt><dd>{previous?"2025-07-25":historical?"2024-07-03":"2025-07-25"}</dd><dt>{historical?"阶段状态":"已使用"}</dt><dd>{previous?"沿用至当前组合":historical?"已更换":"13月0天"}</dd><dt>缴费状态</dt><dd><em className="tt-paid">已缴费　¥{historical&&!previous?"3,400":"2,490"}</em></dd></dl></article>
      <article><strong>OS</strong><div><span className="tt-lens-brand">{previous?"CRT　100系列":historical?"梦戴维　DreamLite":different?"梦戴维　DreamLite Pro":"CRT　100系列"}</span><b>{historical&&!previous?"BC 8.45　DIA 10.60　-2.75D":different?"BC 8.45　DIA 10.60　-2.75D":"BC 8.55　DIA 10.60　-2.75D"}</b><span>{historical&&!previous?"E值 0.52　目标降幅 -2.75D":different?"E值 0.52　目标降幅 -2.75D":"RZD 525μm　LZA 34°"}</span></div><dl><dt>订单</dt><dd>{previous?"ORD-20250718-026":historical?"ORD-20240618-001":different?"ORD-20260205-014":"ORD-20250718-026"}</dd><dt>交付/启用</dt><dd>{previous?"2025-07-25":historical?"2024-07-03":different?"2026-02-12":"2025-07-25"}</dd><dt>{historical?"阶段状态":"已使用"}</dt><dd>{previous?"2026-02-12 已更换":historical?"已更换":different?"6月13天":"13月0天"}</dd><dt>缴费状态</dt><dd><em className="tt-paid">已缴费　¥{historical&&!previous?"3,400":different?"2,580":"2,490"}</em></dd></dl></article>
    </div></section>
    {!readOnly&&<div className="tt-node-actions"><b>{activeReplacement ? `第2镜片周期 · ${activeReplacement === "BOTH" ? "双眼" : activeReplacement}换片 · 试戴中` : "节点操作"}</b><div className="tt-node-action-buttons"><button className={activeReplacement?"recommended":""} onClick={()=>onNodeAction("trial")}>试戴</button><button onClick={onOrder}>定片</button><button onClick={()=>onNodeAction("inspection")}>验片</button><button onClick={()=>onNodeAction("notify")}>取片通知</button><button onClick={()=>onNodeAction("delivery")}>交付</button><button className={!activeReplacement?"recommended":""} onClick={()=>onNodeAction("review")}>复查</button>{!activeReplacement&&<button className="replace" onClick={onReplace}>换片</button>}<i/><button className="complete" onClick={()=>onNodeAction("complete")}>完成治疗</button><button className="danger" onClick={()=>onNodeAction("terminate")}>终止治疗</button></div></div>}
    <section className="tt-progress"><header><div><h2>治疗进度</h2><p>{previous?"该组合因OS单眼换片结束，OD镜片继续沿用":historical?"历史镜片组合完整治疗节点":different?"左右眼交付、启用与换片时间分别记录":"定片、订单、验片、交付及复查记录集中追踪"}</p></div><span>{previous?"组合区间：2025-07-25 至 2026-02-11":historical?"组合结束：2025-07-24":"下次复查：2026-09-02"}</span></header><div className={`tt-steps ${different?"split-progress":""}`}>{progressSteps.map((item,index)=><div className={`${historical||index<4?"done":index===4?"current":""} ${item[1].includes("|")?"split-date":""}`} key={item[0]}><i>{historical||index<4?"✓":index+1}</i><b>{item[0]}</b>{item[1].split("|").map((date)=><span key={date}>{date}</span>)}<em>{item[2]}</em></div>)}</div></section>
    <section className="tt-disposition-card"><header><div><h2>{historical?"历史镜片操作记录":"当前镜片操作记录"}</h2><p>按操作时间倒序展示该副镜片的全部治疗操作</p></div></header><table><thead><tr><th>操作时间</th><th>操作</th><th>关键信息</th><th>间隔</th><th>操作人</th><th></th></tr></thead><tbody>{dispositions.map((item)=><tr key={`${item.time}-${item.node}`}><td>{item.time}</td><td><b>{item.node}</b></td><td>{item.content}</td><td><span className="tt-interval">{item.interval}</span></td><td>{item.operator}</td><td><button onClick={()=>setDetail(item)}>查看详情</button></td></tr>)}</tbody></table></section>
    {detail?.action==="order"&&<OrderDrawer draft={detailOrderDraft} setDraft={()=>{}} groups={groupOrdersByBrand(detailOrderDraft)} onClose={()=>setDetail(null)} onSubmit={()=>{}} readOnlyMode/>}
    {detail&&detail.action!=="order"&&<div className="tt-readonly-node-detail"><div className="tt-readonly-banner">历史操作详情 · 只读　操作人：{detail.operator}　操作时间：{detail.time}</div><NodeActionDrawer action={detail.action??"review"} onClose={()=>setDetail(null)} onSave={()=>{}} readOnlyMode record={detail}/></div>} 
  </main>;
}

function OrderList({ orders, onNew, readOnly }: { orders: OrderRecord[]; onNew: () => void; readOnly: boolean }) {
  return <main className="tt-main"><section className="tt-table-card"><header><div><h2>镜片订单</h2><p>一次下单操作为一个批次，左右眼不同品牌时自动拆分产品订单</p></div>{!readOnly&&<button className="primary" onClick={onNew}>＋ 新建订单</button>}</header><table><thead><tr><th>下单批次</th><th>产品订单号</th><th>眼别</th><th>品牌/系列</th><th>下单日期</th><th>关联医嘱</th><th>状态</th><th>操作</th></tr></thead><tbody>{orders.map((item)=><tr key={item.orderNo}><td><code>{item.batch}</code></td><td><b>{item.orderNo}</b></td><td><span className="tt-eye-tag">{item.eyes}</span></td><td>{item.brand}</td><td>{item.orderedAt}</td><td>{item.medicalOrder}</td><td><em className={item.status==="已交付"?"success":""}>{item.status}</em></td><td><button>查看参数</button></td></tr>)}</tbody></table></section></main>;
}

function LensHistory({ eye, setEye }: { eye: "ALL" | Eye; setEye: (eye: "ALL" | Eye) => void }) {
  const rows = [
    { eye:"OD", brand:"CRT 100系列", start:"2025-07-25", end:"使用中", reason:"当前镜片", status:"当前使用" },
    { eye:"OS", brand:"CRT 100系列", start:"2025-07-25", end:"使用中", reason:"当前镜片", status:"当前使用" },
    { eye:"OD", brand:"梦戴维 DreamLite", start:"2024-05-18", end:"2025-07-25", reason:"常规到期换片", status:"已更换" },
    { eye:"OS", brand:"梦戴维 DreamLite", start:"2024-05-18", end:"2025-07-25", reason:"常规到期换片", status:"已更换" },
  ].filter((item)=>eye==="ALL"||item.eye===eye);
  return <main className="tt-main"><section className="tt-history"><header><div><h2>镜片使用历史</h2><p>按眼追溯每片实际交付、启用和更换关系</p></div><div className="tt-segment">{(["ALL","OD","OS"] as const).map((item)=><button className={eye===item?"active":""} onClick={()=>setEye(item)} key={item}>{item==="ALL"?"全部":item}</button>)}</div></header>{rows.map((item,index)=><article key={`${item.eye}-${item.start}`}><i>{item.eye}</i><div><b>{item.brand}</b><span>{item.start} 至 {item.end}</span></div><p>{item.reason}</p><em className={index<2?"current":""}>{item.status}</em><button>查看镜片参数</button></article>)}</section></main>;
}

function OrderDrawer({ draft, setDraft, groups, scope=null, onClose, onSubmit, readOnlyMode=false }: { draft: OrderDraft; setDraft: (draft: OrderDraft) => void; groups: ReturnType<typeof groupOrdersByBrand>; scope?: "BOTH" | Eye | null; onClose: () => void; onSubmit: () => void; readOnlyMode?: boolean }) {
  const targetEyes: Eye[] = scope === "OD" ? ["OD"] : scope === "OS" ? ["OS"] : draft.selectedEyes;
  const validMedicalOrders = targetEyes.every((eye)=>draft.eyeOrderIds[eye]);
  const [trialReferenced,setTrialReferenced]=useState(false);
  const [vendorOrders,setVendorOrders]=useState<Record<Eye,string>>({OD:"CRT-OD-20260825-01",OS:"CRT-OS-20260825-02"});
  const exportParameters=()=>{const rows=[["眼别","品牌/系列","参数","厂家订单号"],...targetEyes.map((eye)=>[eye,brands.find((item)=>item.id===draft.eyeConfigs[eye].brandId)?.name??"",draft.eyeConfigs[eye].parameters.map((item)=>`${item.label}:${item.value}${item.unit}`).join("；"),vendorOrders[eye]])];const csv="\uFEFF"+rows.map((row)=>row.map((cell)=>`"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([csv],{type:"application/vnd.ms-excel;charset=utf-8"}));link.download="吴四_OK镜定片与下单参数_20260825.xls";link.click();URL.revokeObjectURL(link.href);};
  return <><div className="tt-drawer-mask" onClick={onClose}/><aside className={`tt-drawer ${readOnlyMode?"readonly":""}`}><header><div><span>{readOnlyMode?"历史操作详情":"定片与镜片下单"}</span><h2>{readOnlyMode?"定片与下单详情":"定片与镜片下单"}</h2><p>当前患者：吴四　档案：CL-20260802-0001</p></div><button onClick={onClose}>×</button></header><div className="tt-drawer-body">
    <section className="tt-form-section"><div className="tt-section-title"><b>1　确认定片参数</b><span>引用试戴结果后确认最终品牌与生产参数</span></div><div className="tt-final-order-tools"><button className={trialReferenced?"success":""} onClick={()=>setTrialReferenced(true)}>{trialReferenced?"✓ 已引用试戴参数":"引用试戴参数"}</button><button onClick={exportParameters}>导出参数到 Excel</button></div>{trialReferenced&&<div className="tt-reference-success">已引用 2026-08-25 10:36 的试戴参数，可继续调整。</div>}{scope&&scope!=="BOTH"&&<div className="tt-carry-note">本周期仅更换 {scope}；{scope==="OD"?"OS":"OD"} 继续使用当前镜片，不参与本次下单。</div>}<OrderParameterMatrix draft={draft} setDraft={setDraft} scope={scope}/><div className="tt-vendor-order-row">{targetEyes.map((eye)=><label key={eye}>{eye} 厂家订单号<input value={vendorOrders[eye]} onChange={(e)=>setVendorOrders({...vendorOrders,[eye]:e.target.value})} placeholder="定片后录入厂家订单号"/></label>)}</div></section>
    <section className="tt-form-section auxiliary"><div className="tt-section-title"><b>2　关联就诊与已有医嘱</b><span>一期查询已有医嘱及缴费状态</span></div><div className="tt-visit-card"><div className="tt-visit-full"><label>本次就诊</label><select value={draft.visitId} onChange={(e)=>setDraft({...draft,visitId:e.target.value})}>{visits.map((item)=><option value={item.id} key={item.id}>{item.time}　{item.diagnosis}　{item.doctor}</option>)}</select></div><div className="tt-eye-orders-row">{targetEyes.map((eye)=>{const item=medicalOrders.find((order)=>order.id===draft.eyeOrderIds[eye]);return <div className="tt-eye-order-link" key={eye}><label>{eye} 关联医嘱</label><select value={draft.eyeOrderIds[eye]} onChange={(e)=>setDraft({...draft,eyeOrderIds:{...draft.eyeOrderIds,[eye]:e.target.value}})}><option value="">请选择{eye}接触镜耗材医嘱</option>{medicalOrders.map((order)=><option value={order.id} key={order.id}>{order.name}　{order.status}</option>)}</select>{item&&<p><code>{item.id}</code><span>¥{item.fee}</span><em className={item.status==="已缴费"?"paid":""}>{item.status}</em></p>}</div>})}</div></div></section>
  </div><footer>{readOnlyMode?<button className="primary" onClick={onClose}>关闭</button>:<><button onClick={onClose}>取消</button><button>保存草稿</button><button className="primary" disabled={!validMedicalOrders} onClick={onSubmit}>完成定片并下单</button></>}</footer></aside></>;
}

function ReplacementStartModal({onClose,onConfirm}:{onClose:()=>void;onConfirm:(scope:"BOTH"|Eye)=>void}){
  const [scope,setScope]=useState<"BOTH"|Eye>("BOTH");
  const [reason,setReason]=useState("镜片到期");
  return <><div className="tt-modal-mask" onClick={onClose}/><section className="tt-replacement-start"><header><div><span>开启新镜片周期</span><h2>换片</h2><p>仅确定本周期换片范围，后续从试戴开始</p></div><button onClick={onClose}>×</button></header><div className="tt-replacement-body"><label>换片范围</label><div className="tt-replacement-scope"><button className={scope==="BOTH"?"active":""} onClick={()=>setScope("BOTH")}>双眼换片</button><button className={scope==="OD"?"active":""} onClick={()=>setScope("OD")}>仅换 OD</button><button className={scope==="OS"?"active":""} onClick={()=>setScope("OS")}>仅换 OS</button></div><label>换片原因<select value={reason} onChange={(e)=>setReason(e.target.value)}><option>镜片到期</option><option>度数变化</option><option>镜片损坏</option><option>配适调整</option><option>其他</option></select></label><label>开始时间<input type="datetime-local" step="60" defaultValue="2026-08-25T10:36"/></label><label>备注<textarea placeholder="选填"/></label><aside><b>确认后将开启第2镜片周期</b><span>新周期状态为“试戴中”，不会直接生成订单；未换眼继续沿用当前镜片。</span></aside></div><footer><button onClick={onClose}>取消</button><button className="primary" onClick={()=>onConfirm(scope)}>确认并开始试戴</button></footer></section></>;
}

function NodeActionDrawer({ action, scope=null, onClose, onSave, readOnlyMode=false, record }: { action: NodeAction; scope?: "BOTH" | Eye | null; onClose: () => void; onSave: (record: NodeRecord) => void; readOnlyMode?: boolean; record?: NodeRecord }) {
  const meta: Record<NodeAction,{title:string;content:string;interval:string}> = {
    trial:{title:"试戴",content:"双眼试戴完成，中心定位良好，活动度适中，荧光染色0级。",interval:"治疗开始"},
    finalize:{title:"定片",content:"已确认定片品牌与参数，等待厂家生产。",interval:"试戴后定片"},
    inspection:{title:"验片",content:"镜片到货，外观、参数及边缘质量检查合格。",interval:"下单后7天"},
    notify:{title:"取片通知",content:"已通过短信通知患者来院取片。",interval:"验片后1天"},
    delivery:{title:"交付",content:"完成镜片交付、配戴指导及护理宣教。",interval:"完成启用"},
    review:{title:"复查",content:"双眼戴镜状态良好，角膜健康，继续配戴。",interval:"交付后1月"},
    complete:{title:"完成治疗",content:"本治疗周期目标已完成，保存完成结论。",interval:"周期结束"},
    terminate:{title:"终止治疗",content:"患者主动申请终止，已完成风险告知。",interval:"治疗终止"},
  };
  const current=meta[action];
  const [date,setDate]=useState((record?.time??"2026-08-25 10:36").replace(" ","T"));
  const [eye,setEye]=useState(scope==="OD"?"OD":scope==="OS"?"OS":"双眼");
  const [content,setContent]=useState(record?.content??current.content);
  const [trialBrands,setTrialBrands]=useState<Record<Eye,string>>({OD:"crt",OS:"crt"});
  const [notifyMethod,setNotifyMethod]=useState("短信");
  const [trialReferenced,setTrialReferenced]=useState(false);
  const trialBrandItems={OD:brands.find((item)=>item.id===trialBrands.OD)??brands[0],OS:brands.find((item)=>item.id===trialBrands.OS)??brands[0]};
  const trialKeys=Array.from(new Map([...trialBrandItems.OD.parameters,...trialBrandItems.OS.parameters].map((item)=>[item.key,item])).values());
  const showEye=!["trial","notify","complete","terminate"].includes(action);
  const exportFinalParameters=()=>{
    const rows=[["眼别","品牌/系列",...trialKeys.map((item)=>item.label),"厂家订单号"],...(["OD","OS"] as Eye[]).filter((item)=>scope==="BOTH"||!scope||scope===item).map((item)=>[item,`${trialBrandItems[item].name} ${trialBrandItems[item].series}`,...trialKeys.map((param)=>{const value=trialBrandItems[item].parameters.find((entry)=>entry.key===param.key);return value?(item==="OD"?value.defaultOD:value.defaultOS):"";}),item==="OD"?"CRT-OD-20260825-01":"CRT-OS-20260825-02"])];
    const csv="\uFEFF"+rows.map((row)=>row.map((cell)=>`"${String(cell).replaceAll('"','""')}"`).join(",")).join("\n");
    const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([csv],{type:"application/vnd.ms-excel;charset=utf-8"}));link.download="吴四_OK镜定片参数_20260825.xls";link.click();URL.revokeObjectURL(link.href);
  };
  const extendedFields=action==="delivery"?<><label>OD 矫正视力<input defaultValue="1.0"/></label><label>OS 矫正视力<input defaultValue="1.0"/></label><label>OD 验光（S/C/A）<input defaultValue="-3.00 / -0.75 / 180"/></label><label>OS 验光（S/C/A）<input defaultValue="-2.75 / -0.50 / 175"/></label><label>OD 中心定位<select><option>居中</option><option>偏心</option></select></label><label>OS 中心定位<select><option>居中</option><option>偏心</option></select></label><label>OD 滑动度<input defaultValue="0.5mm"/></label><label>OS 滑动度<input defaultValue="0.6mm"/></label><label>OD 荧光染色<select><option>0级</option><option>1级</option></select></label><label>OS 荧光染色<select><option>0级</option><option>1级</option></select></label></>:action==="review"?<><label>眼压 OD<input defaultValue="15mmHg"/></label><label>眼压 OS<input defaultValue="16mmHg"/></label><label>眼轴 OD<input defaultValue="24.37mm"/></label><label>眼轴 OS<input defaultValue="24.30mm"/></label><label>OD 角膜健康<select><option>正常</option><option>异常</option></select></label><label>OS 角膜健康<select><option>正常</option><option>异常</option></select></label><label>OD 镜片清洁度<select><option>清洁</option><option>轻度沉淀</option></select></label><label>OS 镜片清洁度<select><option>清洁</option><option>轻度沉淀</option></select></label><label>OD 划痕<select><option>无</option><option>轻微</option></select></label><label>OS 划痕<select><option>无</option><option>轻微</option></select></label><label>OD 完整性<select><option>完整</option><option>破损</option></select></label><label>OS 完整性<select><option>完整</option><option>破损</option></select></label></>:null;
  const finalizeFields=action==="finalize"?<div className="tt-finalize-panel"><div className="tt-finalize-toolbar"><div><b>定片品牌与参数</b><span>可引用本周期最近一次试戴结果，再按最终处方调整。</span></div><div><button className={trialReferenced?"success":""} onClick={()=>setTrialReferenced(true)}>{trialReferenced?"✓ 已引用试戴参数":"引用试戴参数"}</button><button onClick={exportFinalParameters}>导出参数到 Excel</button></div></div><div className="tt-finalize-eyes">{(["OD","OS"] as Eye[]).map((finalEye)=><article className={scope&&scope!=="BOTH"&&scope!==finalEye?"tt-scope-readonly":""} key={finalEye}><strong>{finalEye}</strong><label>品牌/系列<select defaultValue={trialBrands[finalEye]}>{brands.map((brand)=><option value={brand.id} key={brand.id}>{brand.name} {brand.series}</option>)}</select></label>{trialBrandItems[finalEye].parameters.map((param)=><label key={param.key}>{param.label}<input defaultValue={finalEye==="OD"?param.defaultOD:param.defaultOS}/></label>)}<label>厂家订单号<input aria-label={`${finalEye}厂家订单号`} placeholder="录入厂家订单号" defaultValue={finalEye==="OD"?"CRT-OD-20260825-01":"CRT-OS-20260825-02"}/></label></article>)}</div>{trialReferenced&&<p className="tt-reference-success">已引用 2026-08-25 10:36 的试戴参数，可继续修改后保存定片。</p>}</div>:null;
  const common=!["complete","terminate"].includes(action)?<><label>操作时间<input type="datetime-local" step="60" value={date} onChange={(e)=>setDate(e.target.value)}/></label>{showEye&&<label>眼别<select value={eye} disabled={Boolean(scope&&scope!=="BOTH")} onChange={(e)=>setEye(e.target.value)}><option>双眼</option><option>OD</option><option>OS</option></select></label>}{extendedFields}{finalizeFields}</>:null;
  return <><div className="tt-drawer-mask" onClick={onClose}/><aside className="tt-node-drawer"><header><div><span>治疗节点操作</span><h2>{current.title}</h2><p>当前患者：吴四　当前治疗周期：第1周期</p></div><button onClick={onClose}>×</button></header><div className="tt-node-form">{scope&&<div className="tt-cycle-scope">本镜片周期范围：<b>{scope==="BOTH"?"双眼":scope}</b>{scope!=="BOTH"&&<span>另一眼沿用当前镜片，仅只读展示</span>}</div>}<section><h3>基本信息</h3><div className="tt-node-grid">{common}{action==="inspection"&&<><label>到货确认<select><option>已到货</option><option>部分到货</option></select></label><label>验片结果<select><option>合格</option><option>需调整</option></select></label></>}{action==="notify"&&<><label>患者本人电话<input value="138****1234" readOnly/></label><label>联系人姓名<input defaultValue="吴女士"/></label><label>联系人电话<input defaultValue="139****5678"/></label><label>通知方式<select value={notifyMethod} onChange={(e)=>setNotifyMethod(e.target.value)}><option>电话</option><option>短信</option><option>微信</option></select></label></>}{action==="delivery"&&<><label>验片结果<select><option>合格</option><option>需调整</option></select></label><label>首次复查日期<input type="date" defaultValue="2026-08-26"/></label><label>配戴指导<select><option>已完成</option><option>待补充</option></select></label><label>护理宣教<select><option>已完成</option><option>待补充</option></select></label></>}{action==="review"&&<><label>复查周期<select><option>1天</option><option>1周</option><option>1月</option><option>3月</option><option>6月</option></select></label><label>裸眼视力 OD<input defaultValue="1.0"/></label><label>裸眼视力 OS<input defaultValue="1.0"/></label><label>角膜健康<select><option>正常</option><option>异常</option></select></label><label>镜片状态<select><option>清洁、完整</option><option>轻度沉淀</option><option>有划痕</option></select></label></>}{action==="complete"&&<><label>完成时间<input type="datetime-local" step="60" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label>完成结论<select><option>达到治疗目标</option><option>转其他治疗方式</option></select></label></>}{action==="terminate"&&<><label>终止时间<input type="datetime-local" step="60" value={date} onChange={(e)=>setDate(e.target.value)}/></label><label>终止原因<select><option>患者主动放弃</option><option>出现并发症</option><option>角膜条件不适合</option><option>其他</option></select></label></>}</div></section>{action==="trial"&&<><section><h3>试戴镜片品牌与参数</h3><div className="tt-trial-param-table"><div className="head"><b>眼别</b><b>品牌/系列</b>{trialKeys.map((param)=><b key={param.key}>{param.label}<small>{param.unit}</small></b>)}</div>{(["OD","OS"] as Eye[]).map((trialEye)=><div className={scope&&scope!=="BOTH"&&scope!==trialEye?"tt-scope-readonly":""} key={trialEye}><strong>{trialEye}</strong><select value={trialBrands[trialEye]} onChange={(e)=>setTrialBrands({...trialBrands,[trialEye]:e.target.value})}>{brands.map((brand)=><option value={brand.id} key={brand.id}>{brand.name} {brand.series}</option>)}</select>{trialKeys.map((param)=>{const brandParam=trialBrandItems[trialEye].parameters.find((item)=>item.key===param.key);return brandParam?<input key={param.key} defaultValue={trialEye==="OD"?brandParam.defaultOD:brandParam.defaultOS}/>:<span key={param.key}>—</span>})}</div>)}</div><p className="tt-form-help">选择品牌后加载该品牌参数；参数横向展示，OD、OS按行分别维护。</p></section><section><h3>试戴评估</h3><div className="tt-trial-assessment"><div className="head"><b>眼别</b><b>中心定位</b><b>滑动度</b><b>荧光染色</b><b>试戴结论</b></div>{(["OD","OS"] as Eye[]).map((trialEye)=><div className={scope&&scope!=="BOTH"&&scope!==trialEye?"tt-scope-readonly":""} key={trialEye}><strong>{trialEye}</strong><select><option>居中</option><option>偏颞</option><option>偏鼻</option><option>偏上</option><option>偏下</option></select><input defaultValue={trialEye==="OD"?"0.5mm":"0.6mm"}/><select><option>0级</option><option>1级</option><option>2级</option><option>3级</option></select><select><option>配适良好</option><option>需调整参数</option><option>不通过</option></select></div>)}</div></section></>}{action==="notify"&&notifyMethod==="短信"&&<section className="tt-sms-panel"><h3>短信模板（可编辑）</h3><label>发送给<select><option>患者本人（138****1234）</option><option>联系人（吴女士 139****5678）</option></select></label><textarea defaultValue="【眼科中心】吴四您好，您的OK镜已定制完成，请于近日来院取片。取片时请携带相关证件，如有疑问请致电0571-12345678。"/><button>发送短信</button></section>}<section><h3>{action==="notify"?"备注":"处置内容"}</h3><textarea value={content} onChange={(e)=>setContent(e.target.value)}/></section>{action==="delivery"&&<section className="tt-node-tip">交付保存后，所选眼别的镜片开始计算实际使用时长。</section>}{action==="terminate"&&<section className="tt-node-warning">终止后当前治疗周期结束，既往镜片、订单和处置记录全部保留。</section>}</div><footer><button onClick={onClose}>取消</button><button className="primary" onClick={()=>onSave({date:date.slice(0,10),time:date.replace("T"," "),node:current.title,content:`${eye==="双眼"||["complete","terminate","trial","notify"].includes(action)?"":`${eye} `}${content}`,interval:current.interval,operator:"方红全"})}>保存{current.title}</button></footer></aside></>;
}

function OrderParameterMatrix({ draft, setDraft, scope=null }: { draft: OrderDraft; setDraft: (draft: OrderDraft) => void; scope?: "BOTH" | Eye | null }) {
  const parameterKeys=Array.from(new Map(draft.selectedEyes.flatMap((eye)=>draft.eyeConfigs[eye].parameters).map((item)=>[item.key,item])).values());
  const canRemove=draft.kind==="replacement"&&draft.selectedEyes.length>1;
  const removeEye=(eye:Eye)=>setDraft({...draft,selectedEyes:draft.selectedEyes.filter((item)=>item!==eye)});
  return <div className="tt-order-matrix-wrap"><div className={`tt-order-matrix ${draft.kind==="replacement"?"replacement":""}`}><div className="head"><b>眼别</b><b>品牌/系列</b>{parameterKeys.map((param)=><b key={param.key}>{param.label}<small>{param.unit}</small></b>)}{draft.kind==="replacement"&&<b>操作</b>}</div>{draft.selectedEyes.map((eye)=><div className={scope&&scope!=="BOTH"&&scope!==eye?"tt-scope-readonly":""} key={eye}><strong>{eye}</strong><select value={draft.eyeConfigs[eye].brandId} onChange={(e)=>setDraft(updateEyeBrand(draft,eye,e.target.value))}>{brands.map((brand)=><option value={brand.id} key={brand.id}>{brand.name} {brand.series}</option>)}</select>{parameterKeys.map((param)=>{const value=draft.eyeConfigs[eye].parameters.find((item)=>item.key===param.key);return value?<input key={param.key} value={value.value} onChange={(e)=>setDraft(updateEyeParameter(draft,eye,param.key,e.target.value))}/>:<span key={param.key}>—</span>})}{draft.kind==="replacement"&&<button className="tt-remove-eye" disabled={!canRemove} onClick={()=>removeEye(eye)}>删除</button>}</div>)}</div><p className="tt-form-help">{scope&&scope!=="BOTH"?`${scope==="OD"?"OS":"OD"} 为当前沿用镜片，只读展示；仅为 ${scope} 生成订单。`:"OD、OS分别维护品牌和参数；选择相同品牌时也保持按眼独立记录。"}</p></div>;
}

function CombinedBrandEditor({ draft, setDraft }: { draft: OrderDraft; setDraft: (draft: OrderDraft) => void }) {
  const brandId = draft.eyeConfigs.OD.brandId;
  const keys = draft.eyeConfigs.OD.parameters;
  return <div className="tt-combined-editor"><div className="tt-brand-select"><label>双眼品牌</label><select value={brandId} onChange={(e)=>setDraft(updateEyeBrand(draft,"OD",e.target.value))}>{brands.map((brand)=><option value={brand.id} key={brand.id}>{brand.name}　{brand.series}</option>)}</select><span>供应商：{brands.find((item)=>item.id===brandId)?.vendor}</span><button onClick={()=>setDraft(copyEyeParameters(draft,"OD","OS"))}>复制OD参数到OS</button></div><div className="tt-param-table"><div className="head"><b>品牌参数</b><strong>OD 右眼</strong><strong>OS 左眼</strong></div>{keys.map((param,index)=><div key={param.key}><label>{param.label}<small>{param.unit}</small></label><input value={draft.eyeConfigs.OD.parameters[index]?.value??""} onChange={(e)=>setDraft(updateEyeParameter(draft,"OD",param.key,e.target.value))}/><input value={draft.eyeConfigs.OS.parameters[index]?.value??""} onChange={(e)=>setDraft(updateEyeParameter(draft,"OS",param.key,e.target.value))}/></div>)}</div></div>;
}

function EyeBrandEditor({ eye, draft, setDraft }: { eye: Eye; draft: OrderDraft; setDraft: (draft: OrderDraft) => void }) {
  const config=draft.eyeConfigs[eye];
  return <article className="tt-eye-editor"><header><b>{eye} {eye==="OD"?"右眼":"左眼"}</b><span>独立品牌与参数</span></header><label>品牌/系列<select value={config.brandId} onChange={(e)=>setDraft(updateEyeBrand(draft,eye,e.target.value))}>{brands.map((brand)=><option value={brand.id} key={brand.id}>{brand.name}　{brand.series}</option>)}</select></label><div className="tt-param-grid">{config.parameters.map((param)=><label key={param.key}>{param.label}<span><input value={param.value} onChange={(e)=>setDraft(updateEyeParameter(draft,eye,param.key,e.target.value))}/><i>{param.unit}</i></span></label>)}</div></article>;
}
