import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToChannelRegion1719500000000 implements MigrationInterface {
  name = 'AddDeletedAtToChannelRegion1719500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "channel" ADD COLUMN "deletedAt" timestamptz`);
    await queryRunner.query(`ALTER TABLE "region" ADD COLUMN "deletedAt" timestamptz`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "region" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "deletedAt"`);
  }
}
