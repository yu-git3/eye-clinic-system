# 治疗方式历史查看 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为治疗方案档案增加治疗方式历史入口、阶段摘要弹窗和可查看对应病历与处置的阶段详情抽屉。

**Architecture:** 扩展现有 `MethodStage` 为可关联阶段摘要的只读视图模型，由档案模块统一控制历史弹窗与详情抽屉；专科病历头部和专科视图复用同一打开回调。原型使用固定脱敏示例数据模拟按阶段有效时间归属的病历、检查、处置与治疗过程。

**Tech Stack:** React 19、TypeScript、Vite、原生 CSS、Node test、GlobalDrawerLayer。

## Global Constraints

- 同一治疗方案变更治疗方式不新建档案，不覆盖旧阶段。
- 业务记录按 `开始时间 <= 发生时间 < 下一阶段开始时间` 归入阶段。
- 医生站可查看和变更；专科人群管理只读查看。
- 采用现有 Ant Design 4.x 风格与全局弹层层级。
- 不改动用户已有未跟踪文件。

---

### Task 1: 治疗阶段详情数据模型

**Files:**
- Modify: `app/modules/contact-lens-archive/archive-store.ts`
- Modify: `app/modules/contact-lens-archive/archive-store.test.ts`

**Interfaces:**
- Produces: `MethodStageDetail`、`createMethodStageDetails(archive): MethodStageDetail[]`。
- Consumes: `ContactLensArchive.methodHistory`、现有检查快照和脱敏示例记录。

- [ ] 写失败测试：断言两个治疗阶段按开始时间倒序，当前阶段结束时间为空，且每阶段包含病历、处置、检查和治疗过程摘要。
- [ ] 运行 `node --test app/modules/contact-lens-archive/archive-store.test.ts`，确认因缺少 `createMethodStageDetails` 失败。
- [ ] 定义阶段详情类型并实现固定示例关联；初始阶段原因显示“建档时确定”，当前阶段状态显示“当前使用”。
- [ ] 再次运行数据测试并确认通过。
- [ ] 提交 `feat: add treatment stage detail model`。

### Task 2: 历史入口与阶段摘要弹窗

**Files:**
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/modules/specialty-record/SpecialtyRecordModule.tsx`
- Modify: `app/contact-lens-archive.css`
- Modify: `app/specialty-record.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `createMethodStageDetails`。
- Produces: `onViewMethodHistory` 回调和“查看历史（N）”入口。

- [ ] 写失败页面测试：断言医生站、专科人群管理和专科视图包含“查看历史”入口与“治疗方式历史”弹窗。
- [ ] 运行 `node --test tests/rendered-html.test.mjs`，确认新断言失败。
- [ ] 在档案模块增加历史弹窗状态；在当前治疗方式旁增加入口，并向专科病历组件传递统一回调。
- [ ] 弹窗按阶段倒序展示治疗方式、状态、起止时间、原因、医生、关联数量和“查看阶段详情”。
- [ ] 运行页面测试和 `npm run build`，确认通过。
- [ ] 提交 `feat: add treatment method history entry`。

### Task 3: 历史治疗阶段视图

**Files:**
- Create: `app/modules/contact-lens-archive/HistoricalTreatmentStageView.tsx`
- Modify: `app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`
- Modify: `app/contact-lens-archive.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `MethodStageDetail`、`GlobalDrawerLayer`。
- Produces: `HistoricalTreatmentStageView({ detail, onBack, onReport })`。

- [ ] 写失败测试：断言历史阶段视图展示专科病历、治疗跟踪、专科视图三个页签以及返回当前阶段入口。
- [ ] 运行页面测试，确认缺少组件失败。
- [ ] 创建完整只读历史阶段视图；点击“查看阶段详情”时关闭弹窗并进入该视图，按阶段范围展示全部关联资料。
- [ ] 为原始报告入口提供可点击演示反馈，不重复实现报告阅读器。
- [ ] 运行页面测试和生产构建，确认通过。
- [ ] 提交 `feat: add treatment stage detail drawer`。

### Task 4: PRD 同步与最终验证

**Files:**
- Modify: `public/prd/contact-lens-archive-v1.4.html`
- Modify: 对应源 PRD（若仓库内存在且可确认是最新人工版本）
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: 已确认规格与最终原型。
- Produces: 与原型一致的入口、字段、权限、归属规则和验收说明。

- [ ] 写失败测试：断言在线 PRD 包含“查看历史（N）”“查看阶段详情”和阶段时间归属规则。
- [ ] 运行页面测试，确认 PRD 断言失败。
- [ ] 更新在线 PRD 的已有档案展示、治疗方式变更、字段属性、权限及验收章节；保留原版本号并记录本轮修订日期。
- [ ] 运行 `node --test tests/*.test.mjs app/modules/**/*.test.ts`、`npm run build`、`git diff --check`。
- [ ] 在 `http://localhost:3001/` 验证医生站入口、历史弹窗、阶段详情、人群管理只读入口和弹层遮挡。
- [ ] 提交 `docs: document treatment method history`。
