import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRetentionToSiteDaily1716500000001 implements MigrationInterface {
  name = 'AddRetentionToSiteDaily1716500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_daily_data" ADD "retention_d1" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "site_daily_data" ADD "retention_d7" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "site_daily_data" ADD "retention_d30" integer DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_daily_data" DROP COLUMN "retention_d1"`);
    await queryRunner.query(`ALTER TABLE "site_daily_data" DROP COLUMN "retention_d7"`);
    await queryRunner.query(`ALTER TABLE "site_daily_data" DROP COLUMN "retention_d30"`);
  }
}
