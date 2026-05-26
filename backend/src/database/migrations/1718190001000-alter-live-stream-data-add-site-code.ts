import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AlterLiveStreamDataAddSiteCode1718190001000 implements MigrationInterface {
  name = 'AlterLiveStreamDataAddSiteCode1718190001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'live_stream_data',
      new TableColumn({
        name: 'site_code',
        type: 'varchar',
        length: '50',
        isNullable: false,
        default: "''",
      }),
    );

    await queryRunner.createForeignKey(
      'live_stream_data',
      new TableForeignKey({
        columnNames: ['site_code'],
        referencedTableName: 'live_site',
        referencedColumnNames: ['code'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.dropColumn('live_stream_data', 'site');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'live_stream_data',
      new TableColumn({
        name: 'site',
        type: 'varchar',
        length: '100',
        isNullable: false,
        default: "''",
      }),
    );

    const table = await queryRunner.getTable('live_stream_data');
    const fk = table?.foreignKeys.find((fk) => fk.columnNames.includes('site_code'));
    if (fk) {
      await queryRunner.dropForeignKey('live_stream_data', fk);
    }

    await queryRunner.dropColumn('live_stream_data', 'site_code');
  }
}
