import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { UsersModule } from '../users/users.module';
import { ExternalModule } from 'src/external/external.module';
import { ActivityLogModule } from 'src/activityLog/activityLog.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), UsersModule, ExternalModule, ActivityLogModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}