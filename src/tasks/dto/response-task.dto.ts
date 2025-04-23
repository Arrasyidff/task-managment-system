// src/tasks/dto/task-response.dto.ts
import { ResponseUserDto } from 'src/users/dto/response-user.dto';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

export class ResponseTaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  userId: string;
  user?: ResponseUserDto;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ResponseTaskDto>) {
    Object.assign(this, partial);
  }
}