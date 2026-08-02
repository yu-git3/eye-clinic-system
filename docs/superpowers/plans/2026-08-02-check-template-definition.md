# 检查模板定义 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在统一眼科原型中新增可点击的检查模板配置模块。

**Architecture:** 新增独立模板数据模型与交互组件，由统一入口在临床指标与检查模板间切换。模板引用既有指标定义数据，科室权限按租户下机构—科室树维护。

**Tech Stack:** React 19、TypeScript、vinext、Node test。

## Global Constraints

- 模板类型仅为“医技检查”“医生查体”。
- 服务项目仅在医技检查时维护，是医嘱与 PACS 报告回传核心关联。
- 不出现检查类型、数据来源或独立 PACS 映射区。
- 权限为空代表当前租户全部机构、全部科室可用。
- 先交付原型，用户确认后再完善 PRD。

---

### Task 1: 模板领域模型

**Files:**
- Create: `app/modules/check-template/template-store.ts`
- Test: `app/modules/check-template/template-store.test.ts`

**Interfaces:**
- Produces: `validateTemplate`、`filterTemplates`、`permissionLabel`。

- [ ] 写覆盖必填、医技服务项目、全租户权限语义的失败测试。
- [ ] 运行测试确认因模块缺失而失败。
- [ ] 实现最小领域模型并运行测试通过。

### Task 2: 可点击模板页面

**Files:**
- Create: `app/modules/check-template/CheckTemplateModule.tsx`
- Create: `app/OphthalmologyPrototype.tsx`
- Modify: `app/page.tsx`
- Modify: `app/modules/clinical-indicator/ClinicalIndicatorModule.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 模板模型、指标种子数据。
- Produces: 列表查询、新增/编辑/查看、模板类型联动、服务项目、科室权限、指标选择、启停、未保存退出。

- [ ] 先扩充页面测试并确认失败。
- [ ] 实现统一导航和模板页面。
- [ ] 运行模型测试、页面测试和生产构建。
- [ ] 在浏览器点击核心流程并核对动态字段。
