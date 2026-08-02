# OK镜基线组合录入与打印 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让OK镜基线自动加载共享眼健康组件、组合指标录入行及南医固定版式打印预览。

**Architecture:** 将眼健康录入主体从抽屉壳中拆为可嵌入内容；组合显示只影响视图，仍调用既有独立指标修订接口；打印预览独立读取已保存档案快照。

**Tech Stack:** React 19、TypeScript、CSS、Node test、vinext。

## Global Constraints

- 角膜地形图只包含 Ks/MinK 曲率和轴位，不增加 K2、ΔK、E。
- 睑裂高度、眼睑张力属于角膜地形图且来源为医技检查。
- 打印采用南医档案固定版式和固定分页。

### Task 1: 共享眼健康录入

**Files:** `app/modules/exam-runtime/ExamEntryPanel.tsx`、`app/modules/contact-lens-archive/ContactLensArchiveModule.tsx`

- [ ] 导出可嵌入的 `ExamEntryContent`，保留全部快捷录入、异常选择和描述预览。
- [ ] 基线的眼健康分组渲染同一 `ExamEntryContent` 和同一 `ExamInstance`。
- [ ] 验证专科病历与基线修改后实例和生成文本一致。

### Task 2: 组合指标录入

**Files:** `app/modules/contact-lens-archive/archive-store.ts`、`ContactLensArchiveModule.tsx`、`app/globals.css`

- [ ] 将睑裂高度、眼睑张力移入角膜地形图并删除眼健康重复项。
- [ ] 为角膜地形图、眼表综合报告、两类医学验光渲染每眼组合行。
- [ ] 每个输入继续调用 `onRevise(group,item,eye,value)`，实时显示组合摘要。
- [ ] 增加数据分组和组合摘要测试。

### Task 3: 固定版式打印预览

**Files:** `ContactLensArchiveModule.tsx`、`app/globals.css`、`tests/rendered-html.test.mjs`

- [ ] 基线增加“打印预览”，未保存修改时提示先暂存。
- [ ] 新增固定两页南医档案预览，输出患者资料、背景、检查结果、医生结论、签名区。
- [ ] 增加打印样式，隐藏系统框架并固定分页。
- [ ] 验证预览、关闭及浏览器打印入口。

### Task 4: 回归验证

- [ ] 运行 `pnpm test`，要求全部通过。
- [ ] 运行 `pnpm run lint`，要求无错误。
- [ ] 在本地页面进入基线，确认共享组件、组合录入和打印预览。
