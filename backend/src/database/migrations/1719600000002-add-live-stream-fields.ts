import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLiveStreamFields1719600000002 implements MigrationInterface {
  name = 'AddLiveStreamFields1719600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "league_id" varchar(50)`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "is_paid" varchar(10)`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "total_comments" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "platform_comments" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "external_comments" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "host_comments" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "uv" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "unlock_count" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "unlock_amount" decimal(12,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "tip_count" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "tip_amount" decimal(12,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "coupon_count" int DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "plan_amount" decimal(12,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "package_amount" decimal(12,2) DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "league_id"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "is_paid"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "total_comments"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "platform_comments"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "external_comments"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "host_comments"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "uv"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "unlock_count"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "unlock_amount"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "tip_count"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "tip_amount"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "coupon_count"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "plan_amount"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "package_amount"`);
  }
}
