# Global Drawer Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将眼科原型内六类业务抽屉统一为覆盖整个 HIHIS 页面且不受父容器裁切的全局抽屉，并建立稳定的遮罩、二级浮层和最终确认框层级。

**Architecture:** 新建 `GlobalDrawerLayer` 公共组件，通过 React portal 将遮罩和抽屉渲染到 `document.body`。各业务模块保留现有表单和业务状态，仅把抽屉 JSX 作为 children 交给公共组件；统一 CSS 令牌负责一级抽屉、二级弹窗、最终确认框和消息提示层级。

**Tech Stack:** React 19、React DOM portal、TypeScript、CSS、Node test、Vite。

## Global Constraints

- 一级遮罩 `z-index: 1000`，一级抽屉 `1001`。
- 二级遮罩 `1100`，选择器、普通弹窗、趋势、报告和打印预览 `1101`。
- 最终确认框遮罩 `1200`，最终确认框 `1201`，全局消息 `1300`。
- 抽屉使用 fixed 全视口定位，头部和底部固定，中间正文独立滚动。
- 不修改业务字段、保存逻辑、默认值、校验或示例数据。
- 外部嵌入 HTML 内部浮层不在本次改造范围。

---

### Task 1: 建立全局抽屉公共组件和层级令牌

**Files:**
- Create: `app/components/GlobalDrawerLayer.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Produces: `GlobalDrawerLayer({ open, label, onMaskClick, children }: GlobalDrawerLayerProps): ReactPortal | null`。
- Produces: CSS 类 `.global-drawer-mask`、`.global-drawer-panel` 及 `--layer-*` 令牌。

- [ ] **Step 1: 写失败页面测试**

在 `tests/rendered-html.test.mjs` 读取公共组件和全局样式并断言：

```js
assert.match(component, /createPortal/);
assert.match(component, /document\.body/);
assert.match(component, /global-drawer-mask/);
assert.match(component, /global-drawer-panel/);
assert.match(css, /--layer-drawer-mask:1000/);
assert.match(css, /--layer-drawer:1001/);
assert.match(css, /--layer-modal:1101/);
assert.match(css, /--layer-confirm:1201/);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL，公共组件和层级令牌尚不存在。

- [ ] **Step 3: 实现公共组件**

```tsx
"use client";
import { createPortal } from "react-dom";

export function GlobalDrawerLayer({ open, label, onMaskClick, children }: GlobalDrawerLayerProps) {
  if (!open) return null;
  return createPortal(
    <div className="global-drawer-root">
      <div className="overlay global-drawer-mask" onClick={onMaskClick} />
      <div className="global-drawer-panel" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>,
    document.body,
  );
}
```

`GlobalDrawerLayerProps` 明确定义 `open: boolean`、`label: string`、`onMaskClick?: () => void`、`children: React.ReactNode`。

- [ ] **Step 4: 实现统一层级和滚动样式**

在 `app/globals.css` 根变量中增加精确层级令牌，并让 `.global-drawer-panel > .drawer`、`.global-drawer-panel > .sr-record-drawer` 使用 `position:fixed; inset:0 0 0 auto; z-index:var(--layer-drawer)`；统一正文 `min-height:0; overflow:auto`。

- [ ] **Step 5: 运行页面测试**

Run: `node --test tests/rendered-html.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add app/components/GlobalDrawerLayer.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: add global drawer layer"
```

### Task 2: 迁移基础配置和检查录入抽屉

**Files:**
- Modify: `app/modules/clinical-indicator/ClinicalIndicatorModule.tsx`
- Modify: `app/modules/check-template/CheckTemplateModule.tsx`
- Modify: `app/modules/exam-runtime/ExamEntryPanel.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `GlobalDrawerLayer` from Task 1。
- Produces: 三类抽屉均通过全局 portal 渲染，保留原关闭回调和原 `.drawer` 内容结构。

- [ ] **Step 1: 写失败迁移测试**

断言三个模块均导入并使用 `GlobalDrawerLayer`，且不再直接输出一级 `<div className="overlay"/>` 与相邻 `<aside className="drawer">`。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL，三个模块仍直接渲染抽屉。

- [ ] **Step 3: 迁移临床指标定义**

用以下结构替换原一级遮罩与抽屉包装，保留抽屉表单和 `requestCloseDrawer`：

```tsx
<GlobalDrawerLayer open={Boolean(drawer)} label="指标信息抽屉" onMaskClick={requestCloseDrawer}>
  {drawer && <aside className="drawer">...</aside>}
</GlobalDrawerLayer>
```

- [ ] **Step 4: 迁移检查模板配置和检查录入组件**

分别使用 `label="检查模板抽屉"`、`label="眼科检查录入组件"`；遮罩点击沿用 `closeDrawer`／`onClose`。

- [ ] **Step 5: 运行页面测试和构建**

Run: `node --test tests/rendered-html.test.mjs && npm run build`

Expected: PASS，构建退出码 0。

- [ ] **Step 6: 提交**

```bash
git add app/modules/clinical-indicator/ClinicalIndicatorModule.tsx app/modules/check-template/CheckTemplateModule.tsx app/modules/exam-runtime/ExamEntryPanel.tsx tests/rendered-html.test.mjs
git commit -m "fix: move configuration drawers to global layer"
```

### Task 3: 迁移医生工作台业务抽屉

**Files:**
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/modules/specialty-record/SpecialtyRecordModule.tsx`
- Modify: `app/modules/exam-report/ExamReportModule.tsx`
- Modify: `app/specialty-record.css`
- Modify: `app/exam-report.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `GlobalDrawerLayer` from Task 1。
- Produces: 建立档案、基本档案、专科病历、检查报告编辑抽屉均为全局浮层。

- [ ] **Step 1: 写失败迁移测试**

断言三个模块使用 `GlobalDrawerLayer`，并断言 `app/specialty-record.css` 不再包含 `.sr-record-drawer{position:absolute`。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL，业务抽屉仍依赖模块容器。

- [ ] **Step 3: 迁移基础档案抽屉**

建立档案和基本档案两个入口分别使用全局抽屉；保留现有 `createOpen`、`baselineOpen`、`closeBaseline`、打印和保存流程。

- [ ] **Step 4: 迁移专科病历抽屉**

将 `.sr-drawer-layer` 替换为 `GlobalDrawerLayer`，`.sr-record-drawer` 改为 fixed 抽屉内容；保留历史列表、新建病历、检查组件和保存回传功能。

- [ ] **Step 5: 迁移检查报告编辑抽屉**

只迁移 `EditReport` 的一级编辑抽屉；原始报告预览和趋势分析继续作为二级浮层，并改用二级层级令牌。

- [ ] **Step 6: 运行页面测试和构建**

Run: `node --test tests/rendered-html.test.mjs && npm run build`

Expected: PASS，构建退出码 0。

- [ ] **Step 7: 提交**

```bash
git add app/modules/contact-lens-archive/ContactLensArchiveModule.tsx app/modules/specialty-record/SpecialtyRecordModule.tsx app/modules/exam-report/ExamReportModule.tsx app/specialty-record.css app/exam-report.css tests/rendered-html.test.mjs
git commit -m "fix: move doctor workspace drawers to global layer"
```

### Task 4: 统一二级浮层并完成验收

**Files:**
- Modify: `app/globals.css`
- Modify: `app/antd4-baseline.css`
- Modify: `app/specialty-record.css`
- Modify: `app/exam-report.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 全局层级令牌。
- Produces: 选择器／普通弹窗／趋势／报告／打印为 1100–1101，最终确认框为 1200–1201，toast 为 1300。

- [ ] **Step 1: 写失败层级测试**

断言旧的 HIHIS 私有 `z-index:70/71/80/81/90/91/92/93` 不再控制已迁移浮层；确认 `.global-discard-dialog` 使用最终确认框令牌，`.toast` 使用消息令牌。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL，旧层级规则仍存在。

- [ ] **Step 3: 统一二级和最终确认浮层**

删除或收窄旧 HIHIS 层级覆盖，改用 CSS 变量；保证打印预览、PDF 预览、趋势、选择器和普通 Modal 均高于一级抽屉，最终确认框高于所有普通浮层。

- [ ] **Step 4: 运行完整自动化验证**

Run: `npm test && npm run build && git diff --check`

Expected: 全部测试通过，构建退出码 0，差异检查无输出。

- [ ] **Step 5: 浏览器逐项验收**

在 `http://localhost:3001/` 的 HIHIS 外壳中依次验证临床指标、检查模板、建立档案、编辑基本档案、新建专科病历、报告编辑和眼科检查录入；记录遮罩覆盖、抽屉矩形、正文滚动、底部按钮和二级浮层层级。

- [ ] **Step 6: 提交**

```bash
git add app/globals.css app/antd4-baseline.css app/specialty-record.css app/exam-report.css tests/rendered-html.test.mjs
git commit -m "fix: standardize ophthalmology overlay hierarchy"
```

## Plan Self-Review

- 规格中的六类抽屉均在 Tasks 2–3 覆盖。
- 二级弹窗、最终确认框、打印／报告／趋势和消息层级均在 Task 4 覆盖。
- 每项行为先写失败测试，再实施并验证。
- 无 TBD、TODO 或未定义接口。
- 外部嵌入 HTML 明确排除，未扩大业务范围。
