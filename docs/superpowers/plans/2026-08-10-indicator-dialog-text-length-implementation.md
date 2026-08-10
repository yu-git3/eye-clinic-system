# Clinical Indicator Dialog and Text Length Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复临床指标抽屉未保存确认框的全局模态交互，并将文本型最大长度统一为默认 50、允许 1～200，同时同步最新版 PRD。

**Architecture:** 使用 React portal 将未保存确认框挂载到 `document.body`，使固定定位不受 HIHIS 工作区和抽屉布局影响；独立全局层级类保证遮罩、抽屉和确认框顺序稳定。文本长度规则集中在指标模型校验与类型切换初始化中，页面只读取模型值；PRD 升版为 V1.5 并更新在线文档入口。

**Tech Stack:** React 19、React DOM portal、TypeScript、CSS、Node test、Vite、python-docx 文档更新脚本。

## Global Constraints

- 确认框必须相对浏览器可视窗口水平、垂直居中。
- 二次遮罩和确认框必须高于抽屉；遮罩点击不得关闭。
- “继续编辑”和 `Esc` 保留表单；“放弃修改”关闭抽屉并丢弃表单。
- 文本型最大长度范围为 `1～200`，默认 `50`，不新增文本结果默认值。
- 保留旧版 PRD，临床指标定义最新版升为 V1.5。
- 不提交工作区现有示例 PDF、压缩包及无关脚本。

---

### Task 1: 锁定文本型长度规则

**Files:**
- Modify: `app/modules/clinical-indicator/indicator-store.test.ts`
- Modify: `app/modules/clinical-indicator/indicator-store.ts`
- Modify: `app/modules/clinical-indicator/ClinicalIndicatorModule.tsx`

**Interfaces:**
- Consumes: `IndicatorDraft.text.maxLength: number`、`validateIndicator(draft, items, editingCode?)`。
- Produces: 文本型初始化 `{ maxLength: 50 }`；范围校验错误 `最大长度须为1至200`。

- [ ] **Step 1: 写入失败测试**

在 `indicator-store.test.ts` 新增两个断言：文本型 `maxLength: 200` 通过，`maxLength: 201` 返回 `errors.maxLength === "最大长度须为1至200"`；页面源码测试同时要求类型切换使用 `maxLength: 50`。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test`

Expected: 文本长度上限和默认值断言失败，因为当前实现仍为上限 2000、默认 500。

- [ ] **Step 3: 最小实现模型和页面规则**

在 `validateIndicator` 中将上限改为 `200`，更新错误文案；把超过新上限的种子数据调整为 `200`；在 `changeType` 和文本配置输入回退值中统一使用 `50`，并为数字输入设置 `min={1}`、`max={200}`。

- [ ] **Step 4: 运行指标模型测试**

Run: `node --experimental-strip-types --test app/modules/clinical-indicator/indicator-store.test.ts`

Expected: PASS，0 failures。

- [ ] **Step 5: 提交**

```bash
git add app/modules/clinical-indicator/indicator-store.ts app/modules/clinical-indicator/indicator-store.test.ts app/modules/clinical-indicator/ClinicalIndicatorModule.tsx tests/rendered-html.test.mjs
git commit -m "fix: align text indicator length rules"
```

### Task 2: 修复未保存确认框层级与键盘行为

**Files:**
- Modify: `app/modules/clinical-indicator/ClinicalIndicatorModule.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `DiscardChangesDialog`，属性 `onContinue(): void`、`onDiscard(): void`、`returnFocusRef: RefObject<HTMLButtonElement | null>`。
- Consumes: React `useEffect`、`useRef`，React DOM `createPortal`。

- [ ] **Step 1: 写入失败的页面结构测试**

在 `tests/rendered-html.test.mjs` 断言临床指标模块包含 `createPortal`、`global-dialog-layer`、`global-discard-dialog`、`Escape`、`focus()`，并断言二次遮罩没有关闭回调。

- [ ] **Step 2: 运行页面测试并确认失败**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL，缺少 portal 和全局确认框标识。

- [ ] **Step 3: 实现全局模态确认框**

在模块中增加 `DiscardChangesDialog`：通过 `createPortal(..., document.body)` 渲染；打开时聚焦“继续编辑”；监听 `Escape` 调用 `onContinue`；关闭后将焦点返回抽屉关闭按钮。二次遮罩不绑定 `onClick`。

- [ ] **Step 4: 固定全局层级与定位**

在 `app/globals.css` 增加：

```css
.global-dialog-layer{z-index:1000}
.global-discard-dialog{z-index:1001;left:50vw;top:50vh}
```

确认框继续使用现有 `.dialog` 视觉样式，且不修改启用/停用确认框。

- [ ] **Step 5: 运行页面测试**

Run: `node --test tests/rendered-html.test.mjs`

Expected: PASS，0 failures。

- [ ] **Step 6: 提交**

```bash
git add app/modules/clinical-indicator/ClinicalIndicatorModule.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "fix: center indicator discard dialog globally"
```

### Task 3: 同步临床指标定义 PRD V1.5

**Files:**
- Create: `/Users/yu/Documents/Q Center/眼科/02_需求文档_PRD/眼科专科系统_临床指标定义功能需求说明_PRD_V1.5.md`
- Create: `/Users/yu/Documents/Q Center/眼科/02_需求文档_PRD/眼科专科系统_临床指标定义功能需求说明_PRD_V1.5.docx`
- Create: `public/prd/clinical-indicator-v1.5.html`
- Modify: `/Users/yu/Documents/Q Center/眼科/02_需求文档_PRD/PRD版本清单.md`
- Modify: `app/modules/product-docs/ProductDocsModule.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: 在线文档路径 `/prd/clinical-indicator-v1.5.html`。

- [ ] **Step 1: 从 V1.4 复制生成 V1.5**

保留 V1.4，生成 V1.5 Markdown、DOCX 和在线 HTML；修订记录新增“文本型默认最大长度 50、允许范围 1～200；同步未保存退出交互”。

- [ ] **Step 2: 更新需求正文和验收项**

将所有 `1～2000`、`默认50` 统一为“必填，1～200，默认50”；错误提示改为“最大长度须为1至200”；补充未保存确认框全局居中、遮罩不可关闭、`Esc` 继续编辑的规则和验收项。

- [ ] **Step 3: 更新产品文档入口和版本清单**

将临床指标定义当前版本改为 `V1.5`，日期 `2026-08-10`，路径 `/prd/clinical-indicator-v1.5.html`。

- [ ] **Step 4: 渲染 DOCX 并逐页检查**

Run: `render_docx.py <V1.5.docx> --output_dir /private/tmp/oph_indicator_v15_render --emit_pdf`

Expected: 转换成功；逐页检查无截断、重叠和异常分页。若中文字体缺失，记录字体限制并完成结构文本校验。

- [ ] **Step 5: 运行在线文档测试并提交**

Run: `npm test`

Expected: PASS；产品文档入口显示 V1.5，在线正文显示 1～200 和默认50。

```bash
git add app/modules/product-docs/ProductDocsModule.tsx public/prd/clinical-indicator-v1.5.html tests/rendered-html.test.mjs
git commit -m "docs: publish clinical indicator PRD v1.5"
```

### Task 4: 完整验证与浏览器验收

**Files:**
- Verify only.

**Interfaces:**
- Consumes: Tasks 1–3 的原型和在线 PRD。

- [ ] **Step 1: 运行完整测试和生产构建**

Run: `npm test && npm run build && git diff --check`

Expected: 所有测试通过，生产构建退出码 0，差异检查无输出。

- [ ] **Step 2: 浏览器验证文本型配置**

新增指标 → 选择文本型：确认最大长度为 50，输入 201 保存时显示“最大长度须为1至200”，改为 200 后该项校验消失。

- [ ] **Step 3: 浏览器验证未保存退出确认框**

修改任一字段后关闭抽屉：确认框位于浏览器窗口正中且高于抽屉；遮罩点击无效；“继续编辑”和 `Esc` 保留字段；“放弃修改”关闭抽屉，再次新增为空表单。

- [ ] **Step 4: 浏览器验证在线 PRD**

产品文档 → 临床指标定义：显示 V1.5、默认50、范围1～200，以及全局未保存确认交互。

- [ ] **Step 5: 核对提交范围**

Run: `git status --short`

Expected: 不包含工作区原有示例 PDF、压缩包、`pnpm-workspace.yaml` 及无关脚本。
