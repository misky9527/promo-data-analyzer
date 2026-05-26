import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLiveSite1718190000000 implements MigrationInterface {
  name = 'CreateLiveSite1718190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'live_site',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'code', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('live_site');
  }
}
