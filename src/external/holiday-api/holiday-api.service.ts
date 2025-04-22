import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

@Injectable()
export class HolidayApiService {
  private readonly logger = new Logger(HolidayApiService.name);
  private readonly baseUrl = 'https://date.nager.at/api/v3';
  private readonly countryCode: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.countryCode = this.configService.get<string>('COUNTRY_CODE', 'ID'); // Default to Indonesia
  }

  async getHolidays(year: number): Promise<Holiday[]> {
    const cacheKey = `holidays:${this.countryCode}:${year}`;
    
    // Try to get from cache first
    const cachedData = await this.cacheManager.get<Holiday[]>(cacheKey);
    if (cachedData) {
      this.logger.log(`Retrieved holidays for ${year} from cache`);
      return cachedData;
    }

    try {
      const url = `${this.baseUrl}/PublicHolidays/${year}/${this.countryCode}`;
      this.logger.log(`Fetching holidays for ${year} from API: ${url}`);
      
      const { data } = await firstValueFrom(this.httpService.get<Holiday[]>(url));
      
      // Store in cache
      await this.cacheManager.set(cacheKey, data, 60 * 60 * 24); // Cache for 24 hours
      
      return data;
    } catch (error) {
      this.logger.error(`Failed to fetch holidays for ${year}: ${error.message}`);
      throw error;
    }
  }

  async isHoliday(date: Date): Promise<boolean> {
    const year = date.getFullYear();
    const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const holidays = await this.getHolidays(year);
    return holidays.some(holiday => holiday.date === formattedDate);
  }
}