import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat,
  Packer, PageNumber, Paragraph, ShadingType, Table, TableCell, TableLayoutType,
  TableRow, TextRun, VerticalAlign, WidthType,
} from "/Users/yu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/docx/dist/index.mjs";
import { writeFile } from "node:fs/promises";

const out = "/Users/yu/Documents/Q Center/眼科/眼科专科系统_角膜接触镜专科病历_功能需求说明_PRD_V1.0.docx";
const blue = "2E74B5", dark = "1F4D78", ink = "25384D", muted = "66788C", pale = "EAF2FB", gray = "F3F6F9";
const usable = 9360;
const border = { style: BorderStyle.SINGLE, size: 4, color: "D6E0EA" };

function run(text, opts = {}) {
  const options = { text, font: "Microsoft YaHei", size: opts.size ?? 21, bold: opts.bold, color: opts.color ?? ink };
  if (opts.break !== undefined) options.break = opts.break;
  return new TextRun(options);
}
function para(text, opts = {}) {
  const options = {
    children: Array.isArray(text) ? text : [run(text, opts)],
    spacing: { before: opts.before ?? 0, after: opts.after ?? 110, line: opts.line ?? 290 },
  };
  if (opts.align !== undefined) options.alignment = opts.align;
  if (opts.keepNext) options.keepNext = true;
  if (opts.pageBreakBefore) options.pageBreakBefore = true;
  if (opts.bullet) options.bullet = { level: 0 };
  if (opts.numbering) options.numbering = opts.numbering;
  return new Paragraph(options);
}
function heading(text, level = 1) {
  const sizes = { 1: 30, 2: 26, 3: 23 };
  return new Paragraph({ heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3, spacing: { before: level === 1 ? 250 : 170, after: level === 1 ? 120 : 80, line: 300 }, keepNext: true, children: [run(text, { size: sizes[level], bold: true, color: level === 3 ? dark : blue })] });
}
function cell(text, width, header = false) {
  const p = para(text, { size: header ? 18 : 18, bold: header, color: header ? dark : ink, after: 0, line: 260 });
  return new TableCell({ width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: header ? { type: ShadingType.CLEAR, color: pale, fill: pale } : undefined, margins: { top: 80, bottom: 80, left: 120, right: 120 }, borders: { top: border, bottom: border, left: border, right: border }, children: [p] });
}
function table(headers, rows, widths) {
  return new Table({ width: { size: usable, type: WidthType.DXA }, layout: TableLayoutType.FIXED, rows: [new TableRow({ tableHeader: true, children: headers.map((x, i) => cell(x, widths[i], true)) }), ...rows.map(row => new TableRow({ children: row.map((x, i) => cell(x, widths[i])) }))] });
}
function note(title, text) {
  return new Table({ width: { size: usable, type: WidthType.DXA }, layout: TableLayoutType.FIXED, rows: [new TableRow({ children: [new TableCell({ width: { size: usable, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: "F4F8FC", fill: "F4F8FC" }, margins: { top: 110, bottom: 110, left: 160, right: 160 }, borders: { top: { style: BorderStyle.SINGLE, size: 6, color: "8AB7EA" }, bottom: border, left: border, right: border }, children: [para([run(`${title}  `, { bold: true, color: dark }), run(text, { color: ink })], { after: 0 })] })] })] });
}
function bullets(items) { return items.map(item => para(item, { numbering: { reference: "prd-bullets", level: 0 }, after: 45 })); }

const sections = [];
sections.push(new Paragraph({ children: [run("眼科专科系统", { size: 20, color: blue, bold: true })], spacing: { after: 70 } }));
sections.push(new Paragraph({ children: [run("角膜接触镜专科病历\n功能需求说明（PRD）", { size: 40, bold: true, color: dark })], spacing: { after: 180 }, keepNext: true }));
sections.push(para("版本：V1.0　　状态：原型确认后待研发评审　　日期：2026-08-02", { size: 20, color: muted, after: 220 }));
sections.push(note("文档依据", "以已确认的高保真原型为准；采用南医眼科角膜接触镜病历的固定版式，第一版不建设病历模板配置。"));
sections.push(heading("1. 文档信息"));
sections.push(table(["版本", "日期", "说明", "状态"], [["V1.0", "2026-08-02", "首次形成：历史就诊记录优先、右侧抽屉录入、眼科检查组件直接展开指标。", "待研发评审"]], [1100, 1600, 5000, 1660]));
sections.push(heading("2. 背景与目标"));
sections.push(para("角膜接触镜患者在门诊复诊时，医生需要快速了解既往诊疗变化，并在同一就诊中完成结构化的专科病历、检查结果引用或补录、处理建议和复诊安排。现有南医眼科系统以文档方式保存，历史信息不便检索，检查结果也难以复用。"));
sections.push(...bullets([
  "在门诊医生工作台内提供角膜接触镜专科病历，保留南医眼科的核心阅读与书写顺序。",
  "进入页面先展示历史就诊记录表，帮助医生先判断患者既往情况，再按需新建本次病历。",
  "复用检查模板定义产生的眼科检查组件；已选择组件直接展开指标录入，避免“选择后再进入录入”的二次操作。",
  "保存专科病历后生成普通门诊病历所需文本并回传，避免重复书写。",
]));
sections.push(heading("3. 范围与非范围"));
sections.push(heading("3.1 本期范围", 2));
sections.push(...bullets([
  "门诊医生站内的角膜接触镜初诊、复诊专科病历；每次门诊形成一份独立记录。",
  "历史病历表格、历史详情、引用上次记录、新建病历右侧抽屉。",
  "治疗方案档案、当前治疗方式、当前镜片信息的只读展示。",
  "医嘱检查自动加载、搜索/多选添加眼科检查组件、报告引用与人工补录。",
  "暂存、保存并回传、回传预览、复诊时间推荐与调整。",
]));
sections.push(heading("3.2 非本期范围", 2));
sections.push(...bullets([
  "专科病历模板的后台配置；第一版使用代码内置的南医眼科角膜接触镜固定版式。",
  "非角膜接触镜治疗方案的专科病历、镜片品牌参数模板、定制下单及订单维护。",
  "在专科病历内变更治疗方案、治疗方式或镜片参数；相关操作仍在治疗档案/治疗管理中完成。",
]));
sections.push(heading("4. 角色、入口与权限"));
sections.push(table(["角色", "入口", "权限"], [
  ["门诊医生", "门诊医生工作台 → 专科病历", "查看历史、引用上次记录、新建/暂存/保存本次病历；按HIHIS权限编辑检查结果和处理建议。"],
  ["配镜师/视光师", "专科人群管理", "查看档案及已保存信息；不在本页面书写或修改专科病历。"],
  ["医技人员", "PACS/检查系统", "通过检查报告接口提供报告编号、报告人、报告时间及可用结构化结果；不直接操作本页面。"],
], [1600, 2700, 5060]));
sections.push(heading("5. 页面与交互流程"));
sections.push(heading("5.1 默认页面：历史就诊记录", 2));
sections.push(para("医生接诊患者后，专科病历页默认显示历史专科病历表格，不自动打开录入表单。记录按就诊日期/时间倒序排列；同日多次就诊时按接诊时间倒序。表格宽度不足时允许横向滚动。"));
sections.push(table(["字段", "展示规则"], [
  ["就诊日期/时间", "倒序排列；最近一次增加“最近一次”标记。"],
  ["就诊类型", "展示初诊或复诊。"],
  ["科室 / 接诊医生", "展示本次就诊归属科室与接诊医生。"],
  ["主诉及现病史摘要", "优先展示戴镜时长、裸眼视力变化、主要不适。"],
  ["专科检查摘要", "优先展示角膜/结膜情况和关键异常。"],
  ["诊断、处理及医嘱", "展示关键检查、处理建议、治疗方式及复诊安排。"],
  ["操作", "查看详情；医生可引用上次记录。"],
], [2400, 6960]));
sections.push(heading("5.2 新建专科病历抽屉", 2));
sections.push(para("点击“新建专科病历”后，从右侧打开大抽屉。抽屉独立滚动，顶部显示本次就诊信息，底部固定“普通门诊病历回传预览、暂存、保存并回传”。关闭时如存在未保存修改，提示继续编辑、暂存后退出或放弃修改。"));
sections.push(heading("5.3 引用上次记录", 2));
sections.push(...bullets([
  "可从历史表格或抽屉顶部引用最近一次记录。",
  "仅带入主诉、现病史和处理建议等叙述性内容，带入后仍可编辑。",
  "不复制检查结果、报告人/报告时间、诊断、医嘱、签名和历史操作记录。",
  "引用来源需记录历史病历日期，保存后形成新的本次病历，不覆盖历史记录。",
]));
sections.push(heading("6. 本次专科病历字段"));
sections.push(table(["区域", "字段", "属性与规则"], [
  ["患者与就诊", "姓名、性别、年龄、病历号、就诊日期、机构、科室、接诊医生", "只读；由门诊就诊上下文带入。"],
  ["治疗与镜片", "治疗方案、档案编号/状态、当前治疗方式、当前镜片信息", "只读；治疗方式来自治疗档案，镜片信息来自治疗管理中当前已交付/使用的订单。无数据时显示“暂无当前镜片信息”。"],
  ["主诉", "主诉", "多行文本，必填；支持引用上次记录后修改。"],
  ["现病史", "现病史", "多行文本，选填；重点记录戴镜时长、视力变化及眼部不适。"],
  ["专科检查摘要", "检查摘要", "多行文本，必填；组件结果生成候选文本，医生确认或修改后保存。"],
  ["处理建议", "检查报告与处理建议", "多行文本；支持戴镜随访、规范护理、停戴提醒等常用语插入。"],
  ["复诊安排", "推荐日期、实际复诊日期、调整说明", "按治疗方案随访规则推荐；医生可调整实际日期，修改推荐日期时填写调整说明。"],
  ["备注", "备注", "多行文本，选填。"],
], [1500, 1900, 5960]));
sections.push(heading("7. 眼科检查组件"));
sections.push(heading("7.1 组件来源与加载", 2));
sections.push(...bullets([
  "检查模板定义中的全部模板均可作为“眼科检查组件”，不局限于眼健康检查。",
  "本次已开立医嘱对应的检查组件自动加载，标记为“本次医嘱”。",
  "医生查体组件和其他未开医嘱检查通过“添加眼科检查”选择后加载，标记为“医生添加”。",
  "组件加载后直接展开该模板的指标及OD/OS录入区域，与基本档案的指标录入交互保持一致。",
]));
sections.push(heading("7.2 添加与移除", 2));
sections.push(table(["操作", "规则"], [
  ["搜索", "按检查模板名称或编码模糊搜索。"],
  ["选择", "支持多选；每行展示名称、编码、模板类型、眼别及指标数；已添加项显示“已添加”且不可重复选择。"],
  ["确认", "点击“添加选中”后，所有选中组件直接插入本次病历并展开指标。"],
  ["移除", "仅“医生添加”且尚未保存的组件可移除；本次医嘱组件和已保存组件不可移除。"],
], [1700, 7660]));
sections.push(heading("7.3 报告引用与医生补录", 2));
sections.push(...bullets([
  "接口返回结构化结果时自动带入指标；存在多次检查时，医生可选择引用某份报告结果。",
  "引用后保留报告编号、报告人、报告时间、引用时间和引用审计。",
  "仅返回PDF/图文报告时，允许医生查看原始报告后补录结构化指标；系统保留原始报告关联和医生修订痕迹。",
  "医生手工修订接口结果时，保留接口原值、修订人和修订时间。",
]));
sections.push(heading("8. 数据与接口要求"));
sections.push(table(["实体/接口", "关键字段或约束"], [
  ["专科病历", "病历ID、患者ID、就诊ID、治疗方案档案ID（可空）、模板版本、病历状态、文本快照、创建/保存/修改人及时间。"],
  ["病历检查实例", "病历ID、检查模板ID、检查实例ID、来源（本次医嘱/医生添加）、是否已保存、展示顺序、指标快照。"],
  ["医技报告引用", "检查实例ID、报告ID、检查时间、报告人、报告时间、报告原文/附件地址、引用审计。"],
  ["治疗档案接口", "按患者+治疗方案查询当前可访问档案；返回当前治疗方式、档案状态、当前镜片订单摘要。"],
  ["普通门诊病历回传", "保存并回传时生成“主诉—现病史—专科检查—处理建议—复诊安排”文本；失败不丢失专科病历，可重试。"],
], [2200, 7160]));
sections.push(heading("9. 状态、校验与异常"));
sections.push(table(["场景", "处理规则"], [
  ["无治疗方案档案", "允许完成固定专科病历；治疗及镜片区展示空态。后续建立档案后可补充关联，不要求重新书写病历。"],
  ["无历史病历", "显示空态和“新建专科病历”主操作。"],
  ["待报告", "显示检查已开立/报告待返回，允许先暂存病历。"],
  ["无结构化结果", "允许查看原始报告并手工补录。"],
  ["必填校验", "保存并回传校验主诉、专科检查摘要；校验失败定位字段并提示。"],
  ["只读/无权限", "历史病历只读；无编辑权限时禁止新建、移除组件、修改指标和保存。"],
  ["回传失败", "专科病历保持已保存，状态标记“回传失败”；支持重试并记录日志。"],
], [2000, 7360]));
sections.push(heading("10. 普通门诊病历回传"));
sections.push(para("回传预览及最终写入普通门诊病历“专科查体及处理建议”段落，按以下固定顺序拼装："));
sections.push(...bullets(["主诉", "现病史", "专科检查摘要（含医生确认后的组件结果）", "处理建议", "复诊安排：实际日期、随访规则、调整说明"]));
sections.push(note("回传原则", "暂存不回传；保存并回传时保存专科病历结构化数据、组件实例及文本快照。回传失败不得影响专科病历保存。"));
sections.push(heading("11. 验收标准"));
sections.push(table(["编号", "验收项", "通过标准"], [
  ["AC-01", "历史优先", "接诊进入专科病历页默认展示按时间倒序的历史表格，字段符合第5.1节。"],
  ["AC-02", "抽屉录入", "点击新建后打开右侧抽屉，底部操作固定；未保存关闭有提示。"],
  ["AC-03", "检查组件", "本次医嘱检查自动加载并直接展示指标；搜索、多选、确认后直接展开录入。"],
  ["AC-04", "组件移除", "仅未保存的医生添加组件可移除；医嘱和已保存组件不可移除。"],
  ["AC-05", "报告与补录", "可引用多次报告；无结构化结果时可查看报告并补录，保留审计。"],
  ["AC-06", "引用上次", "仅带入叙述内容，不复制检查结果和报告信息，生成新的本次病历。"],
  ["AC-07", "回传", "保存并回传后普通门诊病历按固定顺序获得文本；失败可重试且不丢失病历。"],
], [900, 2100, 6360]));
sections.push(heading("12. 跨模块依赖与后续演进"));
sections.push(...bullets([
  "复用：临床指标定义、检查模板定义、眼科检查组件运行时、治疗方案配置、角膜接触镜基础档案与基线评估。",
  "依赖：门诊就诊上下文、医嘱/检查报告接口、普通门诊病历回传接口、治疗管理镜片订单信息。",
  "后续：开放病历模板配置，使治疗方案可选择不同专科病历模板；扩展至RGP、软性离焦镜等治疗方式。",
]));

const doc = new Document({
  creator: "Codex", title: "眼科专科系统_角膜接触镜专科病历_功能需求说明_PRD_V1.0",
  numbering: { config: [{ reference: "prd-bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Microsoft YaHei" } } }] }] },
  styles: { default: { document: { run: { font: "Microsoft YaHei", size: 21, color: ink }, paragraph: { spacing: { after: 110, line: 290 } } } }, paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { font: "Microsoft YaHei", size: 30, bold: true, color: blue }, paragraph: { spacing: { before: 250, after: 120 }, keepNext: true } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { font: "Microsoft YaHei", size: 26, bold: true, color: blue }, paragraph: { spacing: { before: 170, after: 80 }, keepNext: true } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { font: "Microsoft YaHei", size: 23, bold: true, color: dark }, paragraph: { spacing: { before: 120, after: 60 }, keepNext: true } },
  ] },
  sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 710, footer: 710 } } }, headers: { default: new Header({ children: [new Paragraph({ children: [run("眼科专科系统｜角膜接触镜专科病历 PRD", { size: 16, color: muted })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D7E2EF" } } })] }) }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("内部需求文档　", { size: 16, color: muted }), new TextRun({ children: [PageNumber.CURRENT], font: "Microsoft YaHei", size: 16, color: muted })] })] }) }, children: sections }],
});

await writeFile(out, await Packer.toBuffer(doc));
console.log(out);
