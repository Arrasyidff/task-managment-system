import { Injectable } from '@nestjs/common';

@Injectable()
export class MockHolidayApiService {
  async getHolidays(year: number) {
    return [
      {
        date: `${year}-01-01`,
        localName: 'New Year',
        name: 'New Year',
        countryCode: 'ID',
        fixed: true,
        global: true,
        counties: null,
        launchYear: null,
        types: ['Public']
      },
      {
        date: `${year}-05-01`,
        localName: 'Labor Day',
        name: 'Labor Day',
        countryCode: 'ID',
        fixed: true,
        global: true,
        counties: null,
        launchYear: null,
        types: ['Public']
      }
    ];
  }

  async isHoliday(date: Date): Promise<boolean> {
    const formattedDate = date.toISOString().split('T')[0];
    const year = date.getFullYear();
    const holidays = await this.getHolidays(year);
    return holidays.some(holiday => holiday.date === formattedDate);
  }
}