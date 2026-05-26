import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventFieldsToLiveStream1719400000000 implements MigrationInterface {
  name = 'AddEventFieldsToLiveStream1719400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "event_time" varchar(10)`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "league" varchar(100)`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "event_name" varchar(500)`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" ADD COLUMN IF NOT EXISTS "event_id" varchar(50)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "event_time"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "league"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "event_name"`);
    await queryRunner.query(`ALTER TABLE "live_stream_data" DROP COLUMN IF EXISTS "event_id"`);
  }
}
