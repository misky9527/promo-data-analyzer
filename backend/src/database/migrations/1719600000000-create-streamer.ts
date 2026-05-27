import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateStreamer1719600000000 implements MigrationInterface {
  name = 'CreateStreamer1719600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'streamer',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'site_id', type: 'bigint', isNullable: true },
          { name: 'baseSalary', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'level', type: 'varchar', length: '20', default: "'普通'" },
          { name: 'remark', type: 'varchar', length: '500', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('streamer');
  }
}
