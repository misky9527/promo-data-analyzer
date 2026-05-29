import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('live_site')
export class LiveSite {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @BeforeInsert()
  @BeforeUpdate()
  toUpperCaseCode() {
    if (this.code) {
      this.code = this.code.toUpperCase();
    }
  }
}
