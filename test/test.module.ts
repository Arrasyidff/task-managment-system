import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { TasksModule } from '../src/tasks/tasks.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { User } from '../src/users/entities/user.entity';
import { Task } from '../src/tasks/entities/task.entity';
import * as memoryStore from 'cache-manager-memory-store';
import { MockHolidayApiService } from './mocks/holiday-api.service.mock';
import { HolidayApiService } from '../src/external/holiday-api/holiday-api.service';

/**
 * Test Module for end-to-end tests
 * Uses in-memory SQLite database and memory cache
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './test/.env.test',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Task],
      synchronize: true,
    }),
    CacheModule.register({
      isGlobal: true,
      store: memoryStore,
    }),
    JwtModule.register({
      secret: 'test_secret_key',
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: HolidayApiService,
      useClass: MockHolidayApiService,
    }
  ],
})
export class TestModule {}