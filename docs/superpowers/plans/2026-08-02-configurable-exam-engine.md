# 可配置眼科检查录入组件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用检查模板驱动可复用的眼科检查录入组件，并以眼健康检查验证快速正常录入、异常选择、描述生成及跨场景复用。

**Architecture:** 新增独立检查引擎模型，负责模板、检查实例、眼别结果和病历描述生成；React组件只负责交互。档案基线和专科病历通过相同模板ID打开同一就诊检查实例。

**Tech Stack:** React、TypeScript、Vinext、Node test、ESLint。

## Global Constraints

- 眼健康检查是医生查体模板，不是专用硬编码业务模块。
- 新建结果加载正常默认值但保持“待确认”，医生保存后才完成。
- 保存生成结构化实例与门诊病历描述；回传在原型中模拟同步状态。
- 基线和专科病历复用同一检查实例。

---

### Task 1: 检查模板运行时模型

**Files:**
- Create: `app/modules/exam-runtime/exam-engine.test.ts`
- Create: `app/modules/exam-runtime/exam-engine.ts`

**Interfaces:**
- Produces: `createEyeHealthInstance()`、`setEyeNormal()`、`setFinding()`、`generateMedicalRecordText()`、`reuseExamInstance()`。

- [ ] 写失败测试：默认待确认、双眼正常描述、单眼异常描述和同次就诊复用。
- [ ] 运行模型测试并确认因模块缺失失败。
- [ ] 实现固定眼健康模板种子及最小检查实例函数。
- [ ] 运行模型测试并确认全部通过。

### Task 2: 通用检查录入组件

**Files:**
- Create: `app/modules/exam-runtime/ExamEntryPanel.tsx`
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 检查实例及模型函数。
- Produces: 一键正常、OD/OS复制、异常展开、描述预览、保存并模拟回传。

- [ ] 写失败页面测试，覆盖眼健康检查入口、快捷操作和描述预览文案。
- [ ] 运行页面测试并确认失败。
- [ ] 实现通用录入面板并在基线与专科病历放置入口。
- [ ] 运行页面测试并确认通过。

### Task 3: 验证

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: 检查引擎测试纳入完整测试命令，以及浏览器核心流程证据。

- [ ] 将检查引擎测试加入完整测试脚本。
- [ ] 运行完整测试、生产构建和ESLint。
- [ ] 在浏览器验证两个入口、默认正常、异常选择、描述预览和同步状态。
