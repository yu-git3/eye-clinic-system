# 角膜接触镜基础档案与基线评估 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有眼科原型中实现嵌入门诊医生站的角膜接触镜基础档案、基线评估、治疗方式变更和人群管理只读视图。

**Architecture:** 新增独立的档案状态模型和React模块，通过入口角色切换编辑权限；模块复用现有单页原型导航，并模拟医生站外壳。既有指标定义和检查模板模块保持不变。

**Tech Stack:** React 19、TypeScript、Vinext/Vite、Node test、CSS。

## Global Constraints

- 只实现基础档案、基线评估、治疗方式变更和双入口展示。
- 不实现试戴、定片、品牌参数、交付及复查业务表单。
- 基线检查保存快照并展示来源、报告日期和报告ID。
- 治疗方式变更不得覆盖旧阶段。
- 不覆盖当前工作区已有指标定义和检查模板修改。

---

### Task 1: 档案领域模型

**Files:**
- Create: `app/modules/contact-lens-archive/archive-store.ts`
- Create: `app/modules/contact-lens-archive/archive-store.test.ts`

**Interfaces:**
- Produces: `createArchiveSeed()`、`changeTreatmentMethod()`、`validateArchiveDraft()`、`validateBaseline()`。

- [ ] 写失败测试：验证新建档案必填项、基线缺失项、OK镜变更RGP后保留历史。
- [ ] 运行 `node --experimental-strip-types --test app/modules/contact-lens-archive/archive-store.test.ts`，确认因模块缺失失败。
- [ ] 实现最小领域模型和示例快照数据。
- [ ] 重跑测试并确认通过。

### Task 2: 医生站档案页面

**Files:**
- Create: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 1档案模型。
- Produces: `ContactLensArchiveModule({ onNavigateIndicator, onNavigateTemplate })`。

- [ ] 先在渲染测试中加入医生站患者栏、建立档案、基线评估和治疗跟踪断言，并确认失败。
- [ ] 实现医生站顶部、患者上下文、专科页签、档案状态条、新建档案抽屉。
- [ ] 实现基线评估背景信息、OD/OS检查快照、来源/报告信息、暂存与完成校验。
- [ ] 实现治疗方式变更对话框和时间轴历史。
- [ ] 实现未保存退出确认、无数据和报告待返回状态。

### Task 3: 人群管理只读视图及模块集成

**Files:**
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/OphthalmologyPrototype.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 同一档案状态。
- Produces: 医生站/人群管理入口切换、临床指标和检查模板导航。

- [ ] 写失败测试：断言页面含人群管理入口、查看模式和治疗方式历史。
- [ ] 实现入口切换和配镜师只读权限提示。
- [ ] 将档案模块设为原型默认入口，并保留指标定义、检查模板导航。
- [ ] 更新统一渲染测试，避免既有模块回归。

### Task 4: 验证与浏览器验收

**Files:**
- Modify: `package.json`

- [ ] 将档案领域测试加入统一测试脚本。
- [ ] 运行完整测试、构建和lint。
- [ ] 在本地浏览器验证：新建档案、完成基线、治疗方式OK镜→RGP、人群管理只读、未保存退出。
- [ ] 核对设计清单，记录未实现的后续治疗节点范围。
