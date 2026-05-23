import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteAndSiteDailyData1716450000000 implements MigrationInterface {
  name = 'AddSiteAndSiteDailyData1716450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "site" ("id" BIGSERIAL PRIMARY KEY, "name" VARCHAR(100) NOT NULL, "remark" VARCHAR(500), "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE "site_daily_data" ("id" BIGSERIAL PRIMARY KEY, "date" DATE NOT NULL, "site_id" BIGINT NOT NULL REFERENCES "site"("id"), "registrations" INT DEFAULT 0, "paying_users" INT DEFAULT 0, "first_charge_users" INT DEFAULT 0, "entertainment_revenue" DECIMAL(12,2) DEFAULT 0, "entertainment_users" INT DEFAULT 0, "recharge_gold" DECIMAL(12,2) DEFAULT 0, "exchange_amount" DECIMAL(12,2) DEFAULT 0, "exchange_users" INT DEFAULT 0, UNIQUE("date", "site_id"))`);
    await queryRunner.query(`ALTER TABLE "product" ADD "site_id" BIGINT REFERENCES "site"("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "site_id"`);
    await queryRunner.query(`DROP TABLE "site_daily_data"`);
    await queryRunner.query(`DROP TABLE "site"`);
  }
}
