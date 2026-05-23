import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPromotionDates1716400000000 implements MigrationInterface {
  name = 'AddProductPromotionDates1716400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" ADD "start_date" date`);
    await queryRunner.query(`ALTER TABLE "product" ADD "end_date" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "end_date"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "start_date"`);
  }
}
