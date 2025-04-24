// src/tasks/dto/task-response.dto.ts
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { TaskStatus, TaskPriority } from '../entities/task.entity';
import { ResponseActivityLogDto } from 'src/activityLog/dto/response-activity.dto';

export class ResponseTaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  userId: string;
  user?: ResponseUserDto;
  logs?: ResponseActivityLogDto[] = [];
  isOnHoliday?: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ResponseTaskDto>) {
    Object.assign(this, partial);
  }
}