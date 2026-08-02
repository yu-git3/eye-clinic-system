# 角膜接触镜专科病历原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在统一眼科原型中实现南医眼科固定版角膜接触镜专科病历，并同步优化基本档案术语和镜片只读摘要。

**Architecture:** 新建独立的 specialty-record 数据模型、规则测试和页面组件；现有 ContactLensArchiveModule 仅负责患者、档案与页签上下文。眼科检查继续复用 exam-runtime，病历保存生成独立快照和普通门诊病历回传文本。

**Tech Stack:** React、TypeScript、Vinext、Node test、CSS。

## Global Constraints

- 第一版使用代码内置南医眼科固定病历，不开发病历模板配置。
- 每次门诊一份专科病历；历史记录只读。
- 医生端统一使用“基本档案”，不显示“基线评估”。
- 治疗方式与当前镜片信息只读，不在病历重复维护。
- 随访日期按治疗方案规则推荐，允许医生调整。

---

### Task 1: 专科病历模型与规则

**Files:**
- Create: `app/modules/specialty-record/specialty-record-store.ts`
- Test: `app/modules/specialty-record/specialty-record-store.test.ts`

**Interfaces:**
- Produces: `createSpecialtyRecordSeed()`, `createHistorySeeds()`, `recommendFollowUpDate()`, `buildOutpatientRecordText()`, `validateSpecialtyRecord()`。

- [ ] 写失败测试：随访推荐、历史摘要、回传文本、必填校验。
- [ ] 运行定向测试并确认因接口缺失失败。
- [ ] 实现最小模型与纯函数。
- [ ] 运行定向测试并确认通过。

### Task 2: 基本档案术语和镜片摘要

**Files:**
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/archive-lifecycle.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 现有档案与治疗方式。
- Produces: 医生可见“基本档案”术语和治疗方式悬浮镜片卡。

- [ ] 写页面失败测试：禁止医生端旧术语，并要求“编辑基本档案”“当前镜片信息”。
- [ ] 运行页面测试并确认失败。
- [ ] 修改页面文案，删除周期/更新时间，增加镜片悬浮摘要。
- [ ] 运行页面测试并确认通过。

### Task 3: 专科病历历史摘要与本次录入

**Files:**
- Create: `app/modules/specialty-record/SpecialtyRecordModule.tsx`
- Create: `app/specialty-record.css`
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/layout.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: Task 1模型、现有眼科检查组件、当前档案上下文。
- Produces: 历史摘要、历史详情、引用上次、本次固定表单、随访推荐、回传预览。

- [ ] 写页面失败测试：历史摘要、本次治疗信息、添加检查、推荐随访、回传预览。
- [ ] 运行页面测试并确认失败。
- [ ] 实现南医固定病历组件和交互。
- [ ] 接入现有专科病历页签并保持其他页签不变。
- [ ] 运行页面及模型测试并确认通过。

### Task 4: 完整验证

**Files:**
- Modify only if verification exposes defects.

- [ ] 运行生产构建和全部测试。
- [ ] 启动本地原型并实际点击历史记录、引用上次、添加检查、随访推荐、回传预览、镜片悬浮。
- [ ] 修复发现的问题并重新验证。

