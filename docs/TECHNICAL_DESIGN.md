# 推广数据分析系统 — 技术方案文档

> **阶段 2：技术方案设计**  
> 编制人：dev (vest-work)  
> 日期：2026-05-21

---

## 1. 项目概述

### 1.1 项目信息

| 项 | 值 |
|---|---|
| **项目名称** | 推广数据分析系统 |
| **项目代号** | promo-data-analyzer |
| **项目性质** | 全新独立项目（不挂 vest-admin） |
| **前端端口** | 5175 |
| **后端端口** | 3003 |
| **数据库** | PostgreSQL 16（独立库 `promo_data`） |
| **MVP 范围** | 字典管理 + 数据录入 + 自动指标 + 分析报表 + AI 总结 |

### 1.2 技术栈选型

| 层 | 技术 | 版本 | 选型理由 |
|---|---|---|---|
| **后端框架** | NestJS | 11 | 与团队主技术栈一致；模块化架构天然匹配功能拆分；TypeORM 集成成熟 |
| **数据库** | PostgreSQL | 16 | 团队标配；支持 JSONB（AI 报告配置存储）、强类型约束、窗口函数（报表聚合） |
| **ORM** | TypeORM | 0.3 | 与 vest-admin 一致；迁移工具完善；支持 QueryBuilder 构建动态报表查询 |
| **前端框架** | Ant Design Pro v6 | 6.x | 团队统一前端技术栈；ProTable + ProForm 天然匹配字典 CRUD；内置权限路由 |
| **前端 UMI** | Umi Max 4 | 4.x | 路由约定式管理；antd 6 + React 19 深度集成 |
| **Excel 处理** | exceljs (后端) + xlsx (前端) | - | exceljs 支持大文件流式读写；前端 xlsx 用于模板下载 |
| **AI SDK** | openai + openai SDK | - | 同时支持 DeepSeek API（兼容 OpenAI 格式）和 OpenAI 原生 API |
| **图表** | @ant-design/charts | 2.x | Pro v6 推荐方案；数据驱动声明式图表 |
| **缓存** | 无（MVP 不做） | - | 按 MVP 范围，指标实时计算，不引入 Redis |

### 1.3 与现有系统关系

- **独立部署**：不与 app-vest-admin 共享数据库、进程或端口
- **认证独立**：自有 JWT 认证（可后续对接统一 SSO）
- **用户体系**：MVP 阶段仅超级管理员，单角色，不引入多租户
- **前端独立**：独立 Ant Design Pro v6 项目，不依赖 vest-admin 前端

---

## 2. 项目架构

### 2.1 目录结构

```
promo-data-analyzer/
├── backend/                          # NestJS 后端
│   ├── src/
│   │   ├── main.ts                   # 应用入口（端口 3003）
│   │   ├── app.module.ts             # 根模块
│   │   ├── common/                   # 公共基础设施
│   │   │   ├── constants/            # 业务常量（角色类型、状态枚举）
│   │   │   │   └── business.constants.ts
│   │   │   ├── decorators/           # 自定义装饰器
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── entities/             # 公共实体基类
│   │   │   │   └── base-time.entity.ts
│   │   │   ├── filters/              # 异常过滤器
│   │   │   │   └── http-exception.filter.ts
│   │   │   ├── guards/               # 全局守卫
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── interceptors/         # 响应拦截器
│   │   │   │   └── transform-response.interceptor.ts
│   │   │   └── interfaces/           # 公共类型
│   │   │       └── request-user.interface.ts
│   │   ├── config/                   # 配置模块
│   │   │   └── app-config.module.ts
│   │   ├── database/                 # 数据库迁移脚本
│   │   │   └── migrations/
│   │   └── modules/
│   │       ├── auth/                 # 认证模块
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── entities/
│   │       │   │   └── admin-user.entity.ts
│   │       │   ├── dto/
│   │       │   │   ├── login.dto.ts
│   │       │   │   └── login-response.dto.ts
│   │       │   └── strategies/
│   │       │       └── jwt.strategy.ts
│   │       ├── dictionary/           # 字典管理（渠道/App/地区）
│   │       │   ├── dictionary.module.ts
│   │       │   ├── dictionary.controller.ts
│   │       │   ├── dictionary.service.ts
│   │       │   ├── entities/
│   │       │   │   ├── channel.entity.ts
│   │       │   │   ├── app.entity.ts
│   │       │   │   └── region.entity.ts
│   │       │   └── dto/
│   │       │       ├── create-channel.dto.ts
│   │       │       ├── update-channel.dto.ts
│   │       │       ├── create-app.dto.ts
│   │       │       ├── update-app.dto.ts
│   │       │       ├── create-region.dto.ts
│   │       │       ├── update-region.dto.ts
│   │       │       └── query-dict.dto.ts
│   │       ├── data-entry/           # 数据录入
│   │       │   ├── data-entry.module.ts
│   │       │   ├── data-entry.controller.ts
│   │       │   ├── data-entry.service.ts
│   │       │   ├── import.service.ts  # Excel 导入逻辑
│   │       │   ├── entities/
│   │       │   │   └── promo-data.entity.ts
│   │       │   └── dto/
│   │       │       ├── create-entry.dto.ts
│   │       │       ├── update-entry.dto.ts
│   │       │       ├── query-entry.dto.ts
│   │       │       └── import-result.dto.ts
│   │       ├── report/               # 分析报表
│   │       │   ├── report.module.ts
│   │       │   ├── report.controller.ts
│   │       │   ├── report.service.ts
│   │       │   ├── metrics-calculator.service.ts  # 指标计算引擎
│   │       │   └── dto/
│   │       │       ├── overview.dto.ts
│   │       │       ├── cross-analysis.dto.ts
│   │       │       └── export.dto.ts
│   │       └── ai-summary/           # AI 总结
│   │           ├── ai-summary.module.ts
│   │           ├── ai-summary.controller.ts
│   │           ├── ai-summary.service.ts
│   │           ├── providers/
│   │           │   ├── ai-provider.interface.ts
│   │           │   ├── deepseek.provider.ts
│   │           │   └── openai.provider.ts
│   │           ├── entities/
│   │           │   └── ai-summary.entity.ts
│   │           └── dto/
│   │               ├── generate-summary.dto.ts
│   │               └── query-summary.dto.ts
│   ├── test/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # Ant Design Pro v6
│   ├── config/
│   │   ├── config.ts
│   │   ├── routes.ts                 # 路由配置
│   │   └── proxy.ts                  # API 代理 → localhost:3003
│   ├── src/
│   │   ├── pages/
│   │   │   ├── dictionary/           # 字典管理
│   │   │   │   ├── channels/         # 渠道管理页
│   │   │   │   ├── apps/             # App管理页
│   │   │   │   └── regions/          # 地区管理页
│   │   │   ├── data-entry/           # 数据录入
│   │   │   │   ├── index.tsx         # 列表
│   │   │   │   ├── manual.tsx        # 逐条录入表单
│   │   │   │   └── import.tsx        # 批量导入
│   │   │   ├── report/               # 分析报表
│   │   │   │   ├── overview/         # 概览仪表盘
│   │   │   │   ├── cross-analysis/   # 交叉分析
│   │   │   │   └── export/           # 明细导出
│   │   │   └── ai-summary/           # AI 总结
│   │   │       ├── index.tsx         # 生成 & 历史记录
│   │   │       └── detail.tsx        # 报告详情
│   │   ├── services/                 # API 调用封装
│   │   │   ├── dictionary.ts
│   │   │   ├── data-entry.ts
│   │   │   ├── report.ts
│   │   │   └── ai-summary.ts
│   │   └── access.ts                 # 超管权限定义
│   └── package.json
│
└── docs/
    └── TECHNICAL_DESIGN.md           # 本文档
```

### 2.2 模块依赖关系

```
auth ────────────────────── (JWT 全局守卫，所有模块依赖)
  │
dictionary ──────────────── (独立，不依赖其他业务模块)
  │
data-entry ──────────────── (依赖 dictionary 模块的 Entity，用于 FK 校验)
  │
report ──────────────────── (依赖 data-entry 的 Entity + metrics-calculator)
  │
ai-summary ──────────────── (依赖 report 的 metrics-calculator + 独立 AI providers)
```

---

## 3. 数据库设计

### 3.1 数据库信息

- **数据库名**: `promo_data`
- **字符集**: `UTF8`
- **排序规则**: `zh_CN.utf8`（中文排序友好）
- **Schema**: `public`（默认）
- **迁移策略**: TypeORM Migration（手动生成，禁止 `synchronize: true`）

### 3.2 完整表结构

#### 3.2.1 `admin_user` — 管理员表

```sql
CREATE TABLE admin_user (
  id            BIGSERIAL       PRIMARY KEY,
  username      VARCHAR(64)     NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role_type     VARCHAR(20)     NOT NULL DEFAULT 'super_admin',
  status        SMALLINT        NOT NULL DEFAULT 1,  -- 1=启用 0=禁用
  jwt_version   INT             NOT NULL DEFAULT 0,  -- JWT 版本号（作废旧 Token）
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX uk_admin_username ON admin_user(username);
```

**说明**：MVP 阶段仅超级管理员角色，`role_type` 固定为 `super_admin`，预留扩展。

#### 3.2.2 `channel` — 推广渠道字典

```sql
CREATE TABLE channel (
  id         BIGSERIAL       PRIMARY KEY,
  name       VARCHAR(100)    NOT NULL,
  code       VARCHAR(50)     NOT NULL,
  status     SMALLINT        NOT NULL DEFAULT 1,   -- 1=启用 0=禁用
  remark     VARCHAR(500),
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 约束
CREATE UNIQUE INDEX uk_channel_code ON channel(code);
CREATE UNIQUE INDEX uk_channel_name ON channel(name);
```

#### 3.2.3 `app` — 推广 App 字典

```sql
CREATE TABLE app (
  id           BIGSERIAL       PRIMARY KEY,
  name         VARCHAR(100)    NOT NULL,
  platform     VARCHAR(20)     NOT NULL CHECK (platform IN ('iOS', 'Android')),
  package_name VARCHAR(200),                           -- Android 包名 或 iOS Bundle ID
  status       SMALLINT        NOT NULL DEFAULT 1,
  remark       VARCHAR(500),
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 约束：同平台下名称唯一
CREATE UNIQUE INDEX uk_app_name_platform ON app(name, platform);
```

#### 3.2.4 `region` — 地区字典

```sql
CREATE TABLE region (
  id         BIGSERIAL       PRIMARY KEY,
  name       VARCHAR(100)    NOT NULL,
  code       VARCHAR(50)     NOT NULL,
  status     SMALLINT        NOT NULL DEFAULT 1,
  remark     VARCHAR(500),
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uk_region_code ON region(code);
CREATE UNIQUE INDEX uk_region_name ON region(name);
```

#### 3.2.5 `promo_data` — 推广源数据（核心业务表）

```sql
CREATE TABLE promo_data (
  id             BIGSERIAL       PRIMARY KEY,
  date           DATE            NOT NULL,
  channel_id     BIGINT          NOT NULL REFERENCES channel(id) ON DELETE RESTRICT,
  app_id         BIGINT          NOT NULL REFERENCES app(id) ON DELETE RESTRICT,
  region_id      BIGINT          NOT NULL REFERENCES region(id) ON DELETE RESTRICT,

  -- 源数据字段
  impressions    INT             NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks         INT             NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  downloads      INT             NOT NULL DEFAULT 0 CHECK (downloads >= 0),
  spend          DECIMAL(12,2)   NOT NULL DEFAULT 0 CHECK (spend >= 0),
  revenue        DECIMAL(12,2)   NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  charge_count   INT             NOT NULL DEFAULT 0 CHECK (charge_count >= 0),
  paying_users   INT             NOT NULL DEFAULT 0 CHECK (paying_users >= 0),
  retention_d1   INT             NOT NULL DEFAULT 0 CHECK (retention_d1 >= 0),
  retention_d7   INT             NOT NULL DEFAULT 0 CHECK (retention_d7 >= 0),
  retention_d30  INT             NOT NULL DEFAULT 0 CHECK (retention_d30 >= 0),

  remark         VARCHAR(500),
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 唯一约束：同一 (日期, 渠道, App, 地区) 仅允许一条记录
CREATE UNIQUE INDEX uk_promo_data_unique
  ON promo_data(date, channel_id, app_id, region_id);

-- 查询索引
CREATE INDEX idx_promo_data_date        ON promo_data(date);
CREATE INDEX idx_promo_data_channel     ON promo_data(channel_id);
CREATE INDEX idx_promo_data_app         ON promo_data(app_id);
CREATE INDEX idx_promo_data_region      ON promo_data(region_id);
CREATE INDEX idx_promo_data_date_channel ON promo_data(date, channel_id);
CREATE INDEX idx_promo_data_date_app     ON promo_data(date, app_id);
CREATE INDEX idx_promo_data_date_region  ON promo_data(date, region_id);

-- 复合筛选索引（覆盖概览仪表盘最常用查询）
CREATE INDEX idx_promo_data_date_dims
  ON promo_data(date, channel_id, app_id, region_id);
```

#### 3.2.6 `ai_summary` — AI 总结历史记录

```sql
CREATE TABLE ai_summary (
  id          BIGSERIAL       PRIMARY KEY,
  type        VARCHAR(30)     NOT NULL,  -- single_period / dual_period / multi_channel
  title       VARCHAR(200)    NOT NULL,
  config_json JSONB           NOT NULL,  -- 生成时的查询条件快照
  content     TEXT            NOT NULL,  -- AI 返回的 Markdown 报告
  model_used  VARCHAR(50)     NOT NULL,  -- deepseek / openai
  created_by  BIGINT          NOT NULL REFERENCES admin_user(id),
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 按创建时间倒序（历史记录列表）
CREATE INDEX idx_ai_summary_created_at ON ai_summary(created_at DESC);
-- 按类型筛选
CREATE INDEX idx_ai_summary_type ON ai_summary(type);
```

### 3.3 import_result — 导入结果（不存表）

导入结果不在数据库中持久化，通过 API Response 直接返回：

```typescript
interface ImportResult {
  total: number;        // 总条数
  inserted: number;     // 新增条数
  updated: number;      // 覆盖条数
  skipped: number;      // 跳过条数（数据校验不通过）
  errors: Array<{
    row: number;         // Excel 行号
    message: string;     // 错误原因
  }>;
}
```

### 3.4 ER 关系图

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  channel │     │   app    │     │  region  │
│  (字典)   │     │  (字典)   │     │  (字典)   │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │ FK              │ FK              │ FK
     └──────────────────┼────────────────┘
                        │
                   ┌────┴─────┐
                   │promo_data│  (核心业务表)
                   └──────────┘

┌──────────┐     ┌──────────┐
│admin_user│────▶│ai_summary│  (FK: created_by)
└──────────┘     └──────────┘
```

---

## 4. 关键接口定义

### 4.1 通用约定

| 项 | 约定 |
|---|---|
| **Base URL** | `/api` |
| **认证方式** | `Authorization: Bearer <JWT Token>` |
| **成功响应** | `{ code: 0, data: T, message: "success" }` |
| **分页响应** | `{ code: 0, data: { list: T[], total: number, page: number, pageSize: number } }` |
| **错误响应** | `{ code: number, message: string }` |
| **日期格式** | `YYYY-MM-DD`（ISO 8601 date） |
| **金额精度** | `decimal(12,2)`，API 返回 number 类型 |

### 4.2 认证模块

#### POST /api/auth/login

```
Body: { username: string, password: string }
Response: { token: string, user: { id, username, roleType } }
Error: 401 用户名或密码错误
```

### 4.3 字典管理模块

#### 4.3.1 渠道管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/dict/channels` | 分页列表 | 超管 |
| `POST` | `/api/dict/channels` | 新增 | 超管 |
| `PATCH` | `/api/dict/channels/:id` | 编辑 | 超管 |
| `DELETE` | `/api/dict/channels/:id` | 禁用（status=0） | 超管 |

```
GET /api/dict/channels?page=1&pageSize=20&keyword=Facebook&status=1
→ { list: Channel[], total: number, page: number, pageSize: number }

POST /api/dict/channels
Body: { name: "Facebook Ads", code: "FB_ADS", remark?: string }
→ Channel

PATCH /api/dict/channels/1
Body: { name?: string, status?: number, remark?: string }
→ Channel

DELETE /api/dict/channels/1
→ { affected: 1 }
```

#### 4.3.2 App 管理（同渠道模式）

```
GET    /api/dict/apps?page=&pageSize=&keyword=&platform=&status=
POST   /api/dict/apps      Body: { name, platform, packageName?, remark? }
PATCH  /api/dict/apps/:id  Body: partial<CreateAppDto>
DELETE /api/dict/apps/:id
```

#### 4.3.3 地区管理（同渠道模式）

```
GET    /api/dict/regions?page=&pageSize=&keyword=&status=
POST   /api/dict/regions      Body: { name, code, remark? }
PATCH  /api/dict/regions/:id  Body: partial<CreateRegionDto>
DELETE /api/dict/regions/:id
```

### 4.4 数据录入模块

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/data-entries` | 分页列表 | 超管 |
| `POST` | `/api/data-entries` | 逐条录入 | 超管 |
| `POST` | `/api/data-entries/import` | Excel 批量导入 | 超管 |
| `GET` | `/api/data-entries/:id` | 详情 | 超管 |
| `PATCH` | `/api/data-entries/:id` | 编辑 | 超管 |
| `DELETE` | `/api/data-entries/:id` | 删除 | 超管 |
| `GET` | `/api/data-entries/template` | 下载导入模板 | 超管 |

```
POST /api/data-entries
Body: {
  date: "2026-05-01",
  channelId: 1, appId: 2, regionId: 3,
  impressions: 10000, clicks: 500, downloads: 100, spend: 2000.00,
  revenue: 3500.00, chargeCount: 45, payingUsers: 30,
  retentionD1: 35, retentionD7: 20, retentionD30: 10,
  remark?: string
}
→ PromoData

POST /api/data-entries/import
Content-Type: multipart/form-data
Body: { file: File, mode: "append" | "overwrite" }
  -- append: 仅新增不存在的行；已存在的（uk冲突）跳过
  -- overwrite: 已存在的行更新数值，不存在的插入
→ ImportResult { total, inserted, updated, skipped, errors[] }

GET /api/data-entries?page=1&pageSize=20&startDate=2026-05-01&endDate=2026-05-21
                      &channelId=1&appId=2&regionId=3
→ 分页列表（自动 JOIN channel/app/region 返回 name）
```

### 4.5 分析报表模块

#### 4.5.1 概览仪表盘

```
GET /api/reports/overview?startDate=2026-05-01&endDate=2026-05-21
                          &channelId?&appId?&regionId?

Response: {
  summary: {
    // 汇总指标
    totalImpressions: number,
    totalClicks: number,
    totalDownloads: number,
    totalSpend: number,
    totalRevenue: number,
    totalPayingUsers: number,
    // 自动计算指标
    ctr: number,           // 点击/曝光 × 100%
    cvr: number,           // 下载/点击 × 100%
    cpi: number,           // 花费/下载
    cpm: number,           // 花费/曝光×1000
    cpc: number,           // 花费/点击
    roas: number,          // 充值金额/花费 × 100%
    payRate: number,       // 付费用户/下载 × 100%
    retentionD1: number,   // 次日留存/下载 × 100%
    retentionD7: number,   // 7日留存/下载 × 100%
    retentionD30: number,  // 30日留存/下载 × 100%
    ltv: number,           // 简化LTV估算
  },
  trend: Array<{           // 按日趋势
    date: string,
    impressions, clicks, downloads, spend, revenue,
    ctr, cvr, cpi, roas, payRate,
  }>,
  byChannel: Array<{       // 按渠道分布
    channelName: string,
    spend, revenue, downloads, roas, ctr,
  }>,
  byApp: Array<{           // 按App分布
    appName: string,
    spend, revenue, downloads, roas,
  }>,
  byRegion: Array<{        // 按地区分布
    regionName: string,
    spend, revenue, downloads, roas,
  }>,
}
```

#### 4.5.2 多维交叉分析

```
GET /api/reports/cross-analysis?startDate=2026-05-01&endDate=2026-05-21
                                &dimension=channel    // channel | app | region | date
                                &metrics=ctr,cvr,roas,cpi,cpm

Response: {
  dimension: "channel",
  data: Array<{
    dimensionValue: string,  // 如 "Facebook Ads"
    metrics: {
      ctr: number, cvr: number, roas: number, cpi: number, cpm: number,
    }
  }>
}
```

**设计要点**：`metrics` 参数指定需要的指标，避免计算不必要的指标。

#### 4.5.3 明细导出

```
GET /api/reports/export?startDate=2026-05-01&endDate=2026-05-21
                        &format=csv          // csv | xlsx
                        &channelId?&appId?&regionId?

Response: Content-Disposition: attachment; filename="report_20260501_20260521.csv"
```

导出列：日期、渠道、App、地区、曝光量、点击量、下载量、花费、充值金额、充值次数、付费用户数、D1/D7/D30 留存用户数、CTR、CVR、CPI、CPM、CPC、ROAS、付费率、留存率(D1/D7/D30)、LTV

### 4.6 AI 总结模块

#### 4.6.1 生成 AI 总结

```
POST /api/ai-summaries/generate

Body (单周期):
{
  "type": "single_period",
  "startDate": "2026-05-01",
  "endDate": "2026-05-21",
  "channelIds": [1, 2],   // 可选，不填=所有渠道
  "appIds": null,          // 可选
  "model": "deepseek"      // deepseek | openai，不填=系统默认
}

Body (双周期对比):
{
  "type": "dual_period",
  "startDate": "2026-05-01",
  "endDate": "2026-05-10",
  "compareStartDate": "2026-04-20",
  "compareEndDate": "2026-04-30",
  "model": "openai"
}

Body (多渠道对比):
{
  "type": "multi_channel",
  "startDate": "2026-05-01",
  "endDate": "2026-05-21",
  "channelIds": [1, 2, 3, 4, 5],
  "model": "deepseek"
}

Response: {
  id: number,
  type: string,
  title: string,
  configJson: object,
  content: string,         // Markdown 格式的报告
  modelUsed: string,
  createdAt: string
}
```

#### 4.6.2 历史记录

```
GET    /api/ai-summaries?page=1&pageSize=10
→ 分页列表（按 created_at DESC）

GET    /api/ai-summaries/:id
→ 完整的 AI 总结内容（Markdown）

DELETE /api/ai-summaries/:id
→ { affected: 1 }
```

### 4.7 自动指标计算公式

指标不存数据库，在查询时通过 `MetricsCalculatorService` 实时计算：

| 指标 | 公式 | 分母为零处理 |
|------|------|-------------|
| **CTR** | `SUM(clicks) / SUM(impressions) × 100` | 返回 0 |
| **CVR** | `SUM(downloads) / SUM(clicks) × 100` | 返回 0 |
| **CPI** | `SUM(spend) / SUM(downloads)` | 返回 0 |
| **CPM** | `SUM(spend) / SUM(impressions) × 1000` | 返回 0 |
| **CPC** | `SUM(spend) / SUM(clicks)` | 返回 0 |
| **ROAS** | `SUM(revenue) / SUM(spend) × 100` | 返回 0 |
| **付费率** | `SUM(paying_users) / SUM(downloads) × 100` | 返回 0 |
| **D1留存率** | `SUM(retention_d1) / SUM(downloads) × 100` | 返回 0 |
| **D7留存率** | `SUM(retention_d7) / SUM(downloads) × 100` | 返回 0 |
| **D30留存率** | `SUM(retention_d30) / SUM(downloads) × 100` | 返回 0 |
| **LTV** | `(SUM(revenue) / SUM(downloads)) × (D1留存率/100)` | 返回 0 |

**LTV 简化公式说明**：`ARPU × D1留存率`。其中 ARPU = 总充值金额 / 总下载量，D1 留存率作为留存系数，给出一个保守的 LTV 估算值。这是简化版本，更精确的 LTV 需要用户级别追踪数据，超出 MVP 范围。

**实现方式**：所有指标使用 PostgreSQL 聚合查询（SUM），在应用层做除法和乘系数。不会逐行拉取数据再计算。

---

## 5. 数据流向

### 5.1 全链路数据流

```
┌──────────────────────────────────────────────────────────────────────┐
│  录入阶段                                                             │
│                                                                       │
│  手动逐条                              前端校验 (ProForm rules)        │
│  ───────►  POST /api/data-entries ──► 后端 DTO 校验 (class-validator) │
│                                       唯一约束检查 (uk冲突→ 422)       │
│                                       写入 promo_data 表               │
│                                                                       │
│  Excel导入                                                           │
│  ───────►  POST /api/data-entries/import                              │
│            ├─ exceljs 流式解析 Excel                                   │
│            ├─ 逐行校验（查 channel/app/region FK + 格式校验）           │
│            ├─ append模式：INSERT ... ON CONFLICT DO NOTHING             │
│            ├─ overwrite模式：INSERT ... ON CONFLICT UPDATE              │
│            └─ 返回 ImportResult                                        │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  查询阶段                                                             │
│                                                                       │
│  前端请求 GET /api/reports/xxx                                        │
│        │                                                              │
│        ▼                                                              │
│  ReportService 构建 QueryBuilder                                      │
│        │  WHERE date BETWEEN ... AND ...                               │
│        │  AND channelId = ? (可选)                                    │
│        │  GROUP BY 按维度                                              │
│        │                                                              │
│        ▼                                                              │
│  MetricsCalculatorService.recalculate(rawData)                        │
│        │  rawData: { impressions, clicks, downloads, spend, ... }     │
│        │  应用公式 → { ctr, cvr, cpi, cpm, cpc, roas, ... }          │
│        │                                                              │
│        ▼                                                              │
│  返回带指标数据到前端                                                  │
│        │                                                              │
│        ▼                                                              │
│  @ant-design/charts 渲染图表                                          │
│  ProTable 渲染明细表格                                                │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  AI 分析阶段                                                          │
│                                                                       │
│  前端请求 POST /api/ai-summaries/generate                             │
│        │                                                              │
│        ▼                                                              │
│  AiSummaryService:                                                    │
│  1. 根据 type 查询 report 数据（复用 ReportService）                   │
│  2. 构建 Prompt（结构化数据 + 分析指令）                                │
│  3. 调用 AI Provider（按配置优先级选择 DeepSeek/OpenAI）              │
│  4. 保存结果到 ai_summary 表                                          │
│  5. 返回 Markdown 内容到前端                                          │
│        │                                                              │
│        ▼                                                              │
│  前端渲染 Markdown（react-markdown）                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 关键设计决策

| 决策 | 说明 |
|------|------|
| **指标不存 DB** | 避免数据冗余和一致性问题；查询时聚合+计算，响应时间可控（PG 聚合性能好） |
| **导出包含自动指标** | 导出时同样实时计算，确保导出数据与页面展示一致 |
| **AI Prompt 在服务端构建** | 不在前端拼接，避免 Prompt 注入和数据泄漏 |
| **导入使用 ON CONFLICT** | 高性能批量 upsert，避免逐条查-判断-写 |

---

## 6. 异常处理策略

### 6.1 全局异常过滤

```typescript
// 使用 NestJS 内置 ExceptionFilter + 自定义 HttpExceptionFilter

// 覆盖以下异常类型：
// - BadRequestException    → 400（参数校验失败）
// - UnauthorizedException  → 401（未登录）
// - ForbiddenException     → 403（无权限）
// - NotFoundException      → 404（资源不存在）
// - ConflictException      → 409（唯一约束冲突）
// - UnprocessableEntity    → 422（业务校验失败，如 FK 不存在）
// - InternalServerError    → 500（未捕获异常，记录完整堆栈）

// 统一响应格式：
{ code: number, message: string, details?: any }
```

### 6.2 按模块的异常处理

| 模块 | 异常场景 | 处理策略 |
|------|---------|---------|
| **认证** | 密码错误 | 401 + 模糊提示"用户名或密码错误" |
| | Token 过期 | 401 + "登录已过期，请重新登录" |
| | Token 版本不匹配 | 401（修改密码后强制重新登录） |
| **字典** | 删除被引用的渠道/App/地区 | 409 + "该字典项已被推广数据引用，无法删除"（RESTRICT 约束） |
| | 编码重复 | 409 + "编码已存在" |
| **录入** | 唯一约束冲突 | 409 + "该日期下已有此渠道+App+地区的记录" |
| | FK 不存在 | 422 + "渠道/App/地区不存在或已禁用" |
| | Excel 格式错误 | 400 + 具体行列错误信息 |
| | Excel 空文件 | 400 + "上传的文件为空" |
| | 文件格式不支持 | 400 + "仅支持 .xlsx 和 .xls 格式" |
| | 单次导入超限 | 400 + "单次最多导入 10000 行数据" |
| **报表** | 日期范围过大 | 400 + "日期范围不能超过 365 天" |
| | startDate > endDate | 400 + "开始日期不能晚于结束日期" |
| | 查询无数据 | 200 + 空数据（全 0 指标） |
| **AI 总结** | AI 接口超时 | 504 + "AI 服务响应超时，请稍后重试" |
| | AI 接口 429 | 503 + "AI 服务繁忙，请稍后重试" |
| | AI 返回格式异常 | 降级返回原始数据摘要 + "AI 分析失败，以下是原始数据摘要" |
| | 双模型均不可用 | 503 + "所有 AI 模型暂不可用" |

### 6.3 日志策略

```typescript
// 关键路径日志覆盖：

// 1. 认证
logger.info(`用户登录: ${username}`, 'AuthService');
logger.warn(`登录失败: ${username}`, 'AuthService');

// 2. 导入
logger.info(`开始导入: file=${fileName}, mode=${mode}, rows=${totalRows}`, 'ImportService');
logger.warn(`导入校验失败: row=${rownum}, error=${msg}`, 'ImportService');

// 3. AI 调用
logger.info(`AI请求: model=${model}, type=${type}, length=${promptLength}`, 'AiSummaryService');
logger.warn(`AI降级: ${providerId} → ${fallbackId}`, 'AiSummaryService');
logger.error(`AI调用失败: model=${model}, error=`, error, 'AiSummaryService');

// 4. 慢查询
// 使用 TypeORM logging: ['query', 'slow'] 监控超过 1s 的查询
```

---

## 7. 安全考虑

### 7.1 鉴权体系

```
请求 → JwtAuthGuard (全局) → RolesGuard (路由级) → Controller
          │                       │
          ├─ 解析 JWT Token       ├─ 读取 @Roles() 装饰器
          ├─ 校验签名+有效期       ├─ 对比 user.roleType
          └─ 注入 req.user        └─ 不匹配 → 403 Forbidden
```

**权限矩阵**：

| 模块 | 操作 | 角色 |
|------|------|------|
| 字典管理 | CRUD | 仅 `super_admin` |
| 数据录入 | 逐条录入、批量导入、编辑、删除 | 仅 `super_admin` |
| 分析报表 | 查看、导出 | 所有已登录用户（MVP 均为超管） |
| AI 总结 | 生成、查看历史 | 所有已登录用户 |

### 7.2 输入校验

| 校验层 | 工具 | 覆盖范围 |
|--------|------|---------|
| **DTO 层** | `class-validator` + `class-transformer` | 类型、必填、长度、数值范围 |
| **业务层** | Service 内显式校验 | FK 存在性、唯一约束、业务规则 |
| **前端** | ProForm rules + antd Form | 实时校验联动、格式校验 |
| **数据库** | CHECK 约束 + FK + UK | 最后一道防线 |

**具体校验规则**：

```typescript
// 数据录入 DTO 校验示例
class CreateEntryDto {
  @IsDateString()                           date: string;      // 格式 YYYY-MM-DD
  @IsInt() @Min(1)                          channelId: number;
  @IsInt() @Min(1)                          appId: number;
  @IsInt() @Min(1)                          regionId: number;
  @IsInt() @Min(0) @Max(999999999)          impressions: number;
  @IsInt() @Min(0) @Max(999999999)          clicks: number;
  @IsInt() @Min(0) @Max(999999999)          downloads: number;
  @IsNumber() @Min(0) @Max(999999999999.99) spend: number;
  // ...
  @MaxLength(500)                           remark?: string;
}
```

### 7.3 其他安全措施

| 措施 | 说明 |
|------|------|
| **密码哈希** | bcrypt（cost=12），不存明文 |
| **JWT 版本号** | `jwt_version` 字段，修改密码后 +1，作废所有旧 Token |
| **CORS** | 仅允许前端域名 `localhost:5175` + 生产域名 |
| **Rate Limiting** | 登录接口：5次/分钟/IP；AI 接口：10次/小时/用户 |
| **SQL 注入防护** | TypeORM QueryBuilder 参数化查询，禁用原生 SQL 拼接 |
| **敏感信息保护** | 日志中不输出密码、Token、完整 Prompt 内容 |
| **文件上传** | 限制文件类型 `.xlsx`/`.xls`，大小上限 10MB |

---

## 8. AI 双模型切换方案

### 8.1 设计思路

参考 vest-admin `ip-resolver` 模块的多厂商自动轮询模式，设计 AI Provider 抽象层。

### 8.2 架构图

```
┌──────────────────────────────────────┐
│          AiSummaryService            │
│  (构建 Prompt, 调用 Provider)        │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      AiProviderManager               │
│  - 读取系统配置中的 provider 列表     │
│  - 按优先级排序                      │
│  - 故障转移 (failover)               │
│  - 速率限制                          │
└──────┬───────────────┬───────────────┘
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ DeepSeek     │ │ OpenAI       │
│ Provider     │ │ Provider     │
│              │ │              │
│ 实现:        │ │ 实现:        │
│ generate()   │ │ generate()   │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
 DeepSeek API      OpenAI API
 (兼容OpenAI格式)
```

### 8.3 核心接口

```typescript
// ai-provider.interface.ts
export interface AiGenerateParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiGenerateResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AiProviderConfig {
  id: string;           // 'deepseek' | 'openai'
  name: string;         // 'DeepSeek V3' | 'OpenAI GPT-4o'
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;        // 'deepseek-chat' | 'gpt-4o'
  priority: number;     // 越小优先级越高
  timeout: number;      // 超时 ms
}

export interface IAiProvider {
  readonly configId: string;
  generate(params: AiGenerateParams): Promise<AiGenerateResult>;
}
```

### 8.4 故障转移流程

```
用户请求生成 AI 总结
  │
  ▼
AiProviderManager.generate(params)
  │
  ├── 1. 按 priority 升序取 enabled provider
  │
  ├── 2. deepseek.generate(params)
  │       ├─ 成功 → 返回结果 (modelUsed: "deepseek")
  │       └─ 失败/超时 →
  │
  ├── 3. openai.generate(params)
  │       ├─ 成功 → 返回结果 (modelUsed: "openai")
  │       └─ 失败/超时 →
  │
  └── 4. 所有 provider 都失败 → throw ServiceUnavailableException
```

### 8.5 用户可选 vs 系统默认

| 场景 | 行为 |
|------|------|
| **前端不指定 model** | 按系统配置的优先级自动选择（默认 deepseek → openai） |
| **前端指定 model** | 强制使用指定模型；如果不可用则报错（不做 fallback） |
| **支持热切换** | 通过系统配置表管理 provider 状态，无需重启 |

### 8.6 Prompt 模板设计

```typescript
const SYSTEM_PROMPT = `你是一个专业的推广数据分析师。请基于提供的推广数据，生成结构化的分析报告。
要求：
1. 用中文撰写
2. 包含: 整体概况、关键指标解读、异常识别、优化建议
3. 用 Markdown 格式，包含标题、段落、表格
4. 数据精确到小数点后2位
5. 客观专业，不做主观臆测`;

// 用户 prompt 由 service 根据分析类型动态构建
```

### 8.7 Prompt 防注入

```typescript
// 1. 所有用户输入通过参数化模板插入，不直接拼接
// 2. 数据数字直接转为固定格式字符串
// 3. 渠道/App/地区名称做长度截断（最长100字符）
buildUserPrompt(type: string, data: ReportData): string {
  // type 从枚举取值，拒绝任意字符串
  // data 字段由后端查询，数值固定格式
  return `请分析以下推广数据：\n${JSON.stringify(this.sanitize(data))}`;
}
```

---

## 9. 风险评估

### 9.1 兼容性评估

| 风险项 | 风险等级 | 说明 | 缓解措施 |
|--------|---------|------|---------|
| 与 vest-admin 并存 | 🟢 低 | 独立项目，独立端口、独立数据库 | 无冲突 |
| NestJS 版本 | 🟢 低 | 使用团队已验证的 NestJS 11 | 直接复用已知配置 |
| Ant Design Pro v6 | 🟡 中 | v6 尚在发展，API 可能变动 | 固定依赖版本；参考团队 cheatsheet |
| PostgreSQL 16 | 🟢 低 | 团队已在使用 | 直接复用 |
| AI API 变动 | 🟡 中 | DeepSeek API 格式可能小变动 | provider 接口抽象，变更仅影响对应实现类 |

### 9.2 性能预估

| 场景 | 预估数据量 | 预估响应时间 | 优化策略 |
|------|-----------|-------------|---------|
| 概览仪表盘（90天，全维度） | 聚合查询 | <500ms | 复合索引 `idx_promo_data_date_dims` |
| 交叉分析（单维度） | 聚合查询 + GROUP BY | <300ms | 按维度分别建索引 |
| 明细查询（分页） | 20条/页 | <100ms | 分页 + 索引 |
| Excel 导入（1000行） | 批量写入 | <5s | `ON CONFLICT` upsert，事务分批提交 |
| AI 总结生成 | API 调用 | 3-10s | 异步化（如有需要）；Prompt 精简 |
| 明细导出（CSV, 365天） | 流式写入 | <10s | 使用 exceljs 流式 API，不分页全量 |

**性能底线**：任何报表接口响应时间不超过 3 秒（不含 AI 调用）。

**扩展考虑**：

| 数据量级 | 策略 |
|---------|------|
| < 50万行 | 当前设计足够（PG 单表索引查询） |
| 50万-500万行 | 按月分区表；报表预聚合物化视图 |
| > 500万行 | 引入 ClickHouse / StarRocks 做分析数据库 |

### 9.3 扩展性评估

| 维度 | 当前设计 | 扩展方向 |
|------|---------|---------|
| **多角色** | 仅超管 | `role_type` 字段已预留，新增角色 + 按角色权限矩阵扩展 |
| **多租户** | 无 | 表结构预留 `tenant_id` 空间（如需要，加列 + 索引） |
| **新指标** | 11个指标 | MetricsCalculatorService 方法化，新增指标仅需加公式方法 |
| **新数据源** | 手动录入 | 可扩展 API 对接自动拉取（如 Facebook Ads API） |
| **定时报告** | MVP 不做 | 后续可加 cron 模块调用现有 AI 分析接口 |
| **大屏看板** | MVP 不做 | 复用现有报表接口数据，前端单独页面 |
| **AI 模型** | 双模型 | IAiProvider 接口，新增模型仅需实现接口 |

---

## 10. 前端路由 & 菜单设计

### 10.1 路由配置（routes.ts）

```typescript
export default [
  { path: '/', redirect: '/report/overview' },
  { path: '/login', component: '@/pages/login', layout: false },
  {
    path: '/dict',
    name: '字典管理',
    icon: 'BookOutlined',
    access: 'isSuperAdmin',
    routes: [
      { path: '/dict/channels', name: '渠道管理', component: '@/pages/dictionary/channels' },
      { path: '/dict/apps', name: 'App管理', component: '@/pages/dictionary/apps' },
      { path: '/dict/regions', name: '地区管理', component: '@/pages/dictionary/regions' },
    ],
  },
  {
    path: '/data-entry',
    name: '数据录入',
    icon: 'ImportOutlined',
    access: 'isSuperAdmin',
    routes: [
      { path: '/data-entry/list', name: '数据管理', component: '@/pages/data-entry/list' },
      { path: '/data-entry/manual', name: '逐条录入', component: '@/pages/data-entry/manual', hideInMenu: true },
      { path: '/data-entry/import', name: '批量导入', component: '@/pages/data-entry/import', hideInMenu: true },
    ],
  },
  {
    path: '/report',
    name: '分析报表',
    icon: 'BarChartOutlined',
    routes: [
      { path: '/report/overview', name: '概览仪表盘', component: '@/pages/report/overview' },
      { path: '/report/cross-analysis', name: '交叉分析', component: '@/pages/report/cross-analysis' },
      { path: '/report/export', name: '明细导出', component: '@/pages/report/export' },
    ],
  },
  {
    path: '/ai-summary',
    name: 'AI 总结',
    icon: 'RobotOutlined',
    routes: [
      { path: '/ai-summary', component: '@/pages/ai-summary' },
    ],
  },
];
```

### 10.2 菜单结构

```
📊 分析报表
  ├── 概览仪表盘         （默认首页）
  ├── 交叉分析
  └── 明细导出
📚 字典管理              （仅超管可见）
  ├── 渠道管理
  ├── App管理
  └── 地区管理
📥 数据录入              （仅超管可见）
  └── 数据管理           （列表+操作入口）
🤖 AI 总结
  └── AI 分析报告
```

---

## 11. 项目初始化清单

### 11.1 后端初始化步骤

```bash
# 1. 创建项目
mkdir -p promo-data-analyzer/backend && cd promo-data-analyzer/backend
npm init -y
npm install @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/config @nestjs/typeorm typeorm pg
npm install class-validator class-transformer
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs
npm install exceljs multer
npm install openai   # 同时用于 DeepSeek（兼容 OpenAI SDK）和 OpenAI
npm install -D @types/node @types/bcryptjs @types/multer typescript ts-node

# 2. 配置 TypeORM
# 3. 创建数据库 promo_data
# 4. 运行迁移
```

### 11.2 前端初始化步骤

```bash
cd promo-data-analyzer
git clone --depth 1 https://github.com/ant-design/ant-design-pro.git frontend
cd frontend
npm install
npm run simple   # 切换到精简模式
npm install      # 更新依赖
```

### 11.3 数据库初始化

```sql
CREATE DATABASE promo_data
  WITH ENCODING 'UTF8'
  LC_COLLATE 'zh_CN.utf8'
  LC_CTYPE 'zh_CN.utf8'
  TEMPLATE template0;

-- 创建初始超管用户（通过后端 seed 脚本）
```

---

## 附录 A：技术选型对比

| 场景 | 候选方案 | 选择 | 理由 |
|------|---------|------|------|
| 前端框架 | Ant Design Pro v6 / vue-element-admin | Ant Design Pro v6 | 团队统一技术栈 |
| 图表库 | @ant-design/charts / ECharts / Recharts | @ant-design/charts | Pro v6 官方推荐，声明式 API |
| Excel 读写 | exceljs / xlsx / SheetJS | exceljs（后端）+ xlsx（前端） | exceljs 流式性能好；xlsx 轻量 |
| AI SDK | 各厂商原生 SDK / openai SDK | openai SDK | DeepSeek 兼容 OpenAI 格式，一个 SDK 覆盖双模型 |
| 认证 | JWT / Session | JWT | 无状态，与现有一致 |

## 附录 B：风险登记表

| ID | 风险 | 等级 | 影响 | 缓解措施 |
|----|------|------|------|---------|
| R1 | AI API 服务不稳定 | 🟡 中 | 用户无法生成 AI 总结 | 双模型 fallback；超时降级策略 |
| R2 | Excel 导入大量数据时性能瓶颈 | 🟡 中 | 导入超时 | 单次限制 10000 行；事务分批提交 |
| R3 | 指标计算逻辑与业务方预期不符 | 🟡 中 | 分析结果需要调整 | 阶段 1 已确认公式；后续按反馈调整 |
| R4 | Ant Design Pro v6 升级 breaking change | 🟢 低 | 前端需要适配 | 锁定版本号；参考 cheatsheet 文档 |

---

> **阶段状态**：等待老大审核确认，确认后进入阶段 3（编码实现）。
