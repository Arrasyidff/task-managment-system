import { Module } from '@nestjs/common';
import { HolidayApiModule } from './holiday-api/holiday-api.module';

@Module({
  imports: [HolidayApiModule],
  exports: [HolidayApiModule],
})
export class ExternalModule {}