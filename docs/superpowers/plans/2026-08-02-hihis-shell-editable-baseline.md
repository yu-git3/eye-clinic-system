# hihis 功能框架与可编辑基线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将统一眼科原型调整为 hihis 左侧菜单与顶部功能标签页结构，并让角膜接触镜基线按固定模板生成可编辑指标及原始报告入口。

**Architecture:** 顶层应用维护已打开功能标签和当前功能；档案领域模型新增基线模板、检查模板版本、原始报告及修订痕迹。门诊医生工作台和专科人群管理复用同一档案数据，但按入口控制编辑权限。

**Tech Stack:** React、TypeScript、Vinext、Node test、ESLint。

## Global Constraints

- 第一版内置“角膜接触镜基础档案基线模板”，同时保留治疗方案选择档案基线模板的关联字段。
- 基线全部检查指标允许医生编辑；结构化值自动带入，非结构化报告支持查看后手工录入。
- 自动值修改后保留原始值、修订值、修订人和修订时间。
- 完成基线后保存模板、指标和报告引用快照。
- 指标定义、检查模板、门诊医生工作台、专科人群管理是独立功能菜单。

---

### Task 1: 基线模板与修订模型

**Files:**
- Modify: `app/modules/contact-lens-archive/archive-store.test.ts`
- Modify: `app/modules/contact-lens-archive/archive-store.ts`

**Interfaces:**
- Produces: `BaselineTemplateRef`、`CheckSnapshot.report`、`CheckRow.originalOd/originalOs`、`reviseCheckValue()`。

- [ ] 写失败测试：治疗方案保存基线模板关联；修改自动值保留原值与修订人时间。
- [ ] 运行档案模型测试并确认因字段或函数缺失失败。
- [ ] 实现最小模型、固定模板种子和修订函数。
- [ ] 运行档案模型测试并确认通过。

### Task 2: hihis 功能菜单与顶部标签

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `app/OphthalmologyPrototype.tsx`
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: 顶层 `activeModule` 与 `openModules`。
- Produces: 左侧菜单、顶部功能标签、独立门诊医生工作台和专科人群管理入口。

- [ ] 写失败渲染测试：页面存在独立菜单，医生工作台内部不存在旧快捷切换条。
- [ ] 运行渲染测试并确认失败。
- [ ] 实现统一 hihis 外壳、菜单打开/激活标签、独立角色入口。
- [ ] 运行渲染测试并确认通过。

### Task 3: 可编辑检查指标与原始报告

**Files:**
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `reviseCheckValue()` 和检查快照报告元数据。
- Produces: 医生可编辑 OD/OS 指标、来源状态、查看原始报告和修订提示；配镜师保持只读。

- [ ] 写失败页面测试：基线抽屉包含“查看原始报告”“接口自动获取”“医生手工录入”。
- [ ] 运行页面测试并确认失败。
- [ ] 实现编辑控件、报告预览对话框、数据状态和修订提示。
- [ ] 运行页面测试并确认通过。

### Task 4: 回归与浏览器验收

**Files:**
- Modify: `tests/rendered-html.test.mjs`（仅在发现遗漏行为时先补失败测试）

**Interfaces:**
- Produces: 构建、模型测试、渲染测试、ESLint 和浏览器核心路径证据。

- [ ] 运行完整测试、生产构建和 ESLint。
- [ ] 浏览器验证菜单打开标签、门诊医生基线编辑、报告预览、修改痕迹和配镜师只读。
- [ ] 修复发现的问题时先补失败测试，再重新完成验证。
