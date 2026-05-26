import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLiveStreamData1716681600000 implements MigrationInterface {
  name = 'CreateLiveStreamData1716681600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'live_stream_data',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'site', type: 'varchar', length: '100', isNullable: false },
          { name: 'live_date', type: 'date', isNullable: false },
          { name: 'room_id', type: 'varchar', length: '50', isNullable: false },
          { name: 'live_info', type: 'varchar', length: '500', isNullable: true },
          { name: 'category', type: 'varchar', length: '50', isNullable: true },
          { name: 'host', type: 'varchar', length: '100', isNullable: true },
          { name: 'start_time', type: 'timestamp', isNullable: false },
          { name: 'duration', type: 'int', isNullable: true },
          { name: 'comment_count', type: 'int', default: 0 },
          { name: 'avg_stay_visit', type: 'int', isNullable: true },
          { name: 'avg_stay_person', type: 'int', isNullable: true },
          { name: 'peak_online', type: 'int', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('live_stream_data');
  }
}
