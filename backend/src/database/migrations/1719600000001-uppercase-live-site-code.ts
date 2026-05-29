import { MigrationInterface, QueryRunner } from 'typeorm';

export class UppercaseLiveSiteCode1719600000001 implements MigrationInterface {
  name = 'UppercaseLiveSiteCode1719600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 临��删除外键
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP CONSTRAINT IF EXISTS "FK_008f2ca8c545985ac553ded90e6"`);
    
    // 2. 先改关联表（site_code）
    await queryRunner.query(`UPDATE "live_stream_data" SET "site_code" = UPPER("site_code") WHERE "site_code" != UPPER("site_code")`);
    
    // 3. 再改主表（code）
    await queryRunner.query(`UPDATE "live_site" SET "code" = UPPER("code") WHERE "code" != UPPER("code")`);
    
    // 4. 恢复外键
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD CONSTRAINT "FK_008f2ca8c545985ac553ded90e6" FOREIGN KEY ("site_code") REFERENCES "live_site"("code")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 不提供回退 — 大写转换是单向迁移
  }
}
