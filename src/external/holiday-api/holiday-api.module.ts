import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HolidayApiService } from './holiday-api.service';
import { HolidayApiController } from './holiday-api.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HolidayApiController],
  providers: [HolidayApiService],
  exports: [HolidayApiService],
})
export class HolidayApiModule {}