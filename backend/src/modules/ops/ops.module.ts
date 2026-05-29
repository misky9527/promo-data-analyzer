import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { LogModule } from '../log/log.module';

@Module({
  imports: [LogModule],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
