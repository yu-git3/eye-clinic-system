# 指标与模板即时筛选 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将临床指标定义和检查模板配置的按钮式查询改为名称/编码合并、条件变化即生效的即时筛选。

**Architecture:** 保留现有 store 纯函数作为筛选边界，临床指标筛选模型由 `name + code` 收敛为一个 `keyword`；React 页面直接使用当前筛选状态计算列表，不再维护待应用状态。页面级回归测试约束查询区和空状态，store 测试验证名称/编码模糊匹配。

**Tech Stack:** React 19、TypeScript、Vite、Node Test Runner、CSS。

## Global Constraints

- 临床指标定义只保留一个“指标名称 / 编码”关键词输入框。
- 两个页面均删除“查询”和“重置”按钮。
- 文本和下拉条件变化后立即筛选，多条件采用同时满足关系。
- 临床指标任一筛选条件变化后分页回到第 1 页。
- 无结果状态不提供重置按钮；清空上方条件即可恢复数据。
- 不覆盖工作区未跟踪的样例报告、脚本和压缩包。

---

### Task 1: 临床指标名称/编码合并与即时筛选

**Files:**
- Modify: `app/modules/clinical-indicator/indicator-store.ts`
- Modify: `app/modules/clinical-indicator/indicator-store.test.ts`
- Modify: `app/modules/clinical-indicator/ClinicalIndicatorModule.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `filterIndicators(items: Indicator[], filters: IndicatorFilters)`。
- Produces: `IndicatorFilters` 的 `{ keyword, source, status }` 结构；`keyword` 同时匹配 `Indicator.name` 和 `Indicator.code`。

- [ ] **Step 1: 写入失败的 store 测试**

将测试筛选条件改为 `keyword`，分别断言名称片段“眼压”和小写编码“iop”均返回 `IOP`：

```ts
const base = { keyword: "", source: "", status: "" };
assert.deepEqual(filterIndicators(items, { ...base, keyword: "眼压" }).map(i => i.code), ["IOP"]);
assert.deepEqual(filterIndicators(items, { ...base, keyword: "iop" }).map(i => i.code), ["IOP"]);
```

- [ ] **Step 2: 运行 store 测试并确认 RED**

Run: `node --experimental-strip-types --test app/modules/clinical-indicator/indicator-store.test.ts`

Expected: FAIL，原因是 `IndicatorFilters`/`filterIndicators` 尚未支持 `keyword`。

- [ ] **Step 3: 实现最小 store 修改**

将 `IndicatorFilters` 改为：

```ts
export type IndicatorFilters = {
  keyword: string;
  source: string;
  status: string;
};
```

在 `filterIndicators` 中对 `keyword` 做 trim、小写化，并用名称或编码任一包含关系匹配。

- [ ] **Step 4: 修改页面为即时筛选**

- 删除 `appliedFilters` 状态。
- `filtered` 直接依赖 `filters`。
- 新增统一的筛选更新函数，在更新任一条件时同时 `setPage(1)`。
- 查询区改为“指标名称 / 编码、数据来源、状态”三项。
- 删除“查询、重置”按钮。
- 无结果提示改为“请修改或清空上方筛选条件”，删除“重置查询”按钮。
- 查询区添加 `indicator-filters` 样式类，并以三列网格展示。

- [ ] **Step 5: 添加页面回归断言**

在 `tests/rendered-html.test.mjs` 的查询条件测试中约束：合并标签存在，独立名称/编码输入不存在，查询区不再渲染查询/重置按钮，空状态不再渲染重置入口。

- [ ] **Step 6: 运行指标与页面测试并确认 GREEN**

Run: `node --experimental-strip-types --test app/modules/clinical-indicator/indicator-store.test.ts && node --test tests/rendered-html.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交 Task 1**

```bash
git add app/modules/clinical-indicator/indicator-store.ts app/modules/clinical-indicator/indicator-store.test.ts app/modules/clinical-indicator/ClinicalIndicatorModule.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: make indicator filters live"
```

### Task 2: 检查模板即时筛选与无结果状态

**Files:**
- Modify: `app/modules/check-template/CheckTemplateModule.tsx`
- Modify: `app/globals.css`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `filterTemplates(items, { keyword, type, status })`，接口保持不变。
- Produces: 当前 `filters` 状态直接驱动模板列表；无匹配时渲染统一空状态。

- [ ] **Step 1: 写入失败的页面回归测试**

在 `tests/rendered-html.test.mjs` 增加检查模板页面断言：查询区不含“查询/重置”按钮，并包含“请修改或清空上方筛选条件”的空状态文案。

- [ ] **Step 2: 运行页面测试并确认 RED**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL，原因是页面仍渲染查询/重置按钮且没有无结果状态。

- [ ] **Step 3: 实现模板即时筛选**

- 删除 `applied` 状态。
- `filtered` 直接依赖 `filters`。
- 保留“模板名称 / 编码、模板类型、状态”三项条件。
- 删除“查询、重置”按钮。
- `template-filters` 改为三列网格。
- `filtered.length === 0` 时显示统一空状态，不显示任何重置按钮。

- [ ] **Step 4: 运行页面测试并确认 GREEN**

Run: `node --test tests/rendered-html.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交 Task 2**

```bash
git add app/modules/check-template/CheckTemplateModule.tsx app/globals.css tests/rendered-html.test.mjs
git commit -m "feat: make template filters live"
```

### Task 3: 全量验证与原型确认

**Files:**
- Verify only; no planned production edit.

**Interfaces:**
- Consumes: Task 1、Task 2 的已提交页面行为。
- Produces: 可供用户走查确认的本地原型；确认后再进入 PRD 修订阶段。

- [ ] **Step 1: 运行全量测试**

Run: `npm test`

Expected: 业务模型测试及页面测试全部 PASS。

- [ ] **Step 2: 运行生产构建与差异检查**

Run: `npm run build`

Expected: Vite build 成功。

Run: `git diff --check`

Expected: 无输出。

- [ ] **Step 3: 浏览器走查**

在 `http://localhost:3001/` 依次验证：指标名称搜索、指标编码搜索、来源/状态组合、分页回第 1 页、指标无结果提示；模板名称/编码、类型/状态组合及模板无结果提示。

- [ ] **Step 4: 用户确认后同步 PRD**

读取用户最后保存的临床指标定义 V1.3 和检查模板配置 V1.2 文档，以新版本或修订说明同步“合并关键词、即时筛选、无按钮、无结果恢复方式”，不得覆盖用户人工调整版本。
