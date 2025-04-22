import { Controller, Get, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { HolidayApiService } from './holiday-api.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('holidays')
@UseGuards(JwtAuthGuard)
export class HolidayApiController {
  constructor(private readonly holidayApiService: HolidayApiService) {}

  @Get(':year')
  getHolidays(@Param('year', ParseIntPipe) year: number) {
    return this.holidayApiService.getHolidays(year);
  }

  @Get('check')
  async checkIfHoliday(@Query('date') dateStr: string) {
    const date = new Date(dateStr);
    const isHoliday = await this.holidayApiService.isHoliday(date);
    
    return {
      date: dateStr,
      isHoliday,
    };
  }
}