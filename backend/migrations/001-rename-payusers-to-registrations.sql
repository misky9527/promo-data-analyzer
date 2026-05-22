-- 迁移：去掉 paying_users 列，新增 registrations 列
-- 日期：2026-05-22
-- 注意：paying_users 数据将丢失（需求如此）

ALTER TABLE promo_data DROP COLUMN IF EXISTS paying_users;
ALTER TABLE promo_data ADD COLUMN IF NOT EXISTS registrations int DEFAULT 0;

-- 更新 CHECK 约束（PostgreSQL CHECK 约束需重建）
-- 删除旧的 paying_users check
ALTER TABLE promo_data DROP CONSTRAINT IF EXISTS "CHK_xxxxxxxx"; -- 如存在请手动删除
-- 添加新的 registrations check
ALTER TABLE promo_data ADD CONSTRAINT "promo_data_registrations_check" CHECK ("registrations" >= 0);
