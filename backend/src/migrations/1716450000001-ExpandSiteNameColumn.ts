import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandSiteNameColumn1716450000001 implements MigrationInterface {
  name = 'ExpandSiteNameColumn1716450000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "name" TYPE VARCHAR(200)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site" ALTER COLUMN "name" TYPE VARCHAR(100)`);
  }
}
