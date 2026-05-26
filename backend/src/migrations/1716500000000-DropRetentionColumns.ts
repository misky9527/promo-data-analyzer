import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropRetentionColumns1716500000000 implements MigrationInterface {
  name = 'DropRetentionColumns1716500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "promo_data" DROP COLUMN "retention_d1"`);
    await queryRunner.query(`ALTER TABLE "promo_data" DROP COLUMN "retention_d7"`);
    await queryRunner.query(`ALTER TABLE "promo_data" DROP COLUMN "retention_d30"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "promo_data" ADD "retention_d1" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "promo_data" ADD "retention_d7" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "promo_data" ADD "retention_d30" integer DEFAULT 0`);
  }
}
