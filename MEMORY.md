## 2026-05-21 — P3 报表 + P4 AI 总结模块实现完成

### 背景
在 promo-data-analyzer 后端实现了完整的报表分析模块（P3）和 AI 总结模块（P4）。

### P3 — Report Module (`src/modules/report/`)

**文件清单：**
- `dto/overview.dto.ts` — startDate/endDate + 可选 channelId/appId/regionId
- `dto/cross-analysis.dto.ts` — startDate/endDate + rowDimension + 可选 colDimension/metrics + 维度筛选
- `metrics-calculator.service.ts` — 全部除零安全（返回 0），计算 ctr/cvr/cpi/cpm/cpc/roas/payRate/retentionD1/D7/D30Rate/ltv
- `report.service.ts` — getOverview（汇总 + 按日 + 按渠道）、getCrossAnalysis（单/二维交叉表）、exportData（ExcelJS生成 .xlsx Buffer）
- `report.controller.ts` — GET /reports/overview、/cross-analysis、/export，全部 @Roles('super_admin')
- `report.module.ts` — imports TypeOrmModule.forFeature([PromoData]) + DataEntryModule

**关键设计：**
- 交叉分析支持 rowDimension × colDimension 二维表，columns 返回列维度值列表
- Excel 导出 header 样式：浅蓝背景 + 居中加粗 + 边框
- 所有聚合查询使用 QueryBuilder SUM + GROUP BY

### P4 — AI Summary Module (`src/modules/ai-summary/`)

**文件清单：**
- `providers/ai-provider.interface.ts` — IAiProvider 接口（name + analyze）
- `providers/deepseek.provider.ts` — openai SDK → DeepSeek API（DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL 环境变量）
- `providers/openai.provider.ts` — openai SDK → OpenAI API（OPENAI_API_KEY / OPENAI_BASE_URL 环境变量）
- `entities/ai-summary.entity.ts` — 表名 ai_summary：id/type/title/configJson/content/modelUsed/createdBy/createdAt
- `dto/generate-summary.dto.ts` — type(单/双/多渠道) + startDate/endDate + compareStartDate?/compareEndDate? + 维度筛选 + model?
- `ai-summary.service.ts` — generate(查PromoData→构造Prompt→AI分析→fallback→存DB)、getHistory、getDetail、delete
- `ai-summary.controller.ts` — POST /generate、GET /history、GET /:id、DELETE /:id，全部 @Roles('super_admin')
- `ai-summary.module.ts` — imports TypeOrmModule.forFeature([AiSummary, PromoData]) + DataEntryModule + providers

**关键设计：**
- AI 调用策略：优先 DeepSeek（或指定模型），失败自动 fallback 到 OpenAI
- Prompt 包含：分析类型、时间范围、汇总数据表格、按渠道数据表格、每日趋势（取最近30条）
- `buildPrompt` 将 QueryResult 构造成 Markdown 表格 prompt，要求 AI 输出：数据概览 + 关键指标 + 渠道对比 + 趋势 + 优化建议

### AppModule 更新
- `app.module.ts` imports 添加 `ReportModule` 和 `AiSummaryModule`

### 验证
- `npx nest build` 编译通过，无错误

## 表单布局规范（2026-05-23 老大的指令）

**铁律：表单禁止每个字段占一整行。** 必须用 `ProFormGroup` + `colProps` 紧凑多列：
- 2 字段/行 → `colProps={{ span: 12 }}`
- **最多 3 字段/行** → `colProps={{ span: 8 }}`
- 超过 3 个字段另起一个 `ProFormGroup`
- 每组内字段数可不同（如 2+3+2），同组内对齐即可
- 查询行（input + select + button）用 `Space`

适用：新建/编辑弹窗、录入表单、筛选区。
⚠️ 2026-05-21 记忆中的「4 字段/行 span=6」是子代理施工方案，非老大指令，已删除。
