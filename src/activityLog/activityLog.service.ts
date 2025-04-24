import { Injectable, Logger } from "@nestjs/common";
import { ActivityLog } from "./entities/activityLog.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ResponseTaskDto } from "src/tasks/dto/response-task.dto";
import { CreateActivityLogDto } from "./dto/create-activity.dto";
import { Task } from "src/tasks/entities/task.entity";
import { User } from "src/users/entities/user.entity";

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>
  ) {}

  buildLogEntity(dto: CreateActivityLogDto, task: Task, assignedBy: User, assignedTo: User): ActivityLog
  {
    return this.activityLogRepository.create({
      task,
      assignedBy,
      assignedTo,
      action: dto.action,
    });
  }
}