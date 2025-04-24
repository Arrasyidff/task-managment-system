import { Injectable, NotFoundException, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../users/enums/role.enum';
import { ResponseTaskDto } from './dto/response-task.dto';
import { HolidayApiService } from 'src/external/holiday-api/holiday-api.service';
import { ActivityLog } from 'src/activityLog/entities/activityLog.entity';
import { ActivityLogService } from 'src/activityLog/activityLog.service';
import { ActivityAction } from 'src/activityLog/dto/create-activity.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private holidayApiService: HolidayApiService,
    private activityLogService: ActivityLogService,
    private dataSource: DataSource,
  ) {}

  async create(createTaskDto: CreateTaskDto, currentUser: User): Promise<ResponseTaskDto> {
    if (createTaskDto.dueDate) {
      const dueDate = new Date(createTaskDto.dueDate);
      const isHoliday = await this.holidayApiService.isHoliday(dueDate);
      
      if (isHoliday) {
        throw new BadRequestException('Cannot schedule task on a holiday. Please select a different date.');
      }
    }
    
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId: currentUser.id
    });

    const savedTask = await this.tasksRepository.save(task);
    this.logger.log(`Task created: ${savedTask.id} by user: ${currentUser.id}`);

    return this.responseTaskDto(savedTask, currentUser);
  }

  async findAll(currentUser: User): Promise<ResponseTaskDto[]> {
    let tasks: Task[];
    
    if (currentUser.role === Role.ADMIN) {
      tasks = await this.tasksRepository.find({
        relations: ['user'],
      });
    } else {
      tasks = await this.tasksRepository.find({
        where: { userId: currentUser.id },
        relations: ['user'],
      });
    }
    
    return Promise.all(tasks.map(task => 
      this.responseTaskDto(task, task.user as User)
    ));
  }

  async findOneWithLogs(id: string, currentUser: User): Promise<ResponseTaskDto | Task> {
    return this.findOne(id, currentUser, true);
  }

  async findOne(id: string, currentUser: User, isDtoResponse: boolean = false): Promise<ResponseTaskDto | Task> {
    const options = {
      where: { id },
      relations: ['user'],
    }
    if (isDtoResponse) {
      options.relations = [
        ...options.relations, 'activityLogs', 'activityLogs.assignedBy', 'activityLogs.assignedTo'
      ];
    }
    const task = await this.tasksRepository.findOne(options);

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // Check if user has access to this task
    if (currentUser.role !== Role.ADMIN && task.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    if (isDtoResponse) {
      return this.responseTaskDto(task, currentUser);
    }

    return task;
  }

  async responseTaskDto(task: Task, user: User): Promise<ResponseTaskDto>
  {
    let isOnHoliday = false;
    if (task.dueDate) {
      isOnHoliday = await this.holidayApiService.isHoliday(new Date(task.dueDate));
    }

    const copyTask = JSON.parse(JSON.stringify(task))
    const logs = copyTask?.activityLogs;
    delete copyTask.activityLogs;

    return new ResponseTaskDto({
      ...copyTask,
      isOnHoliday: isOnHoliday,
      user: this.usersService.userWithoutPassword(user),
      logs: logs ? logs.map((log: ActivityLog) => ({
        id: log.id,
        action: log.action,
        assignedBy: {
          id: log.assignedBy.id,
          name: log.assignedBy.username,
        },
        assignedTo: {
          id: log.assignedTo.id,
          name: log.assignedTo.username,
        },
        createdAt: log.createdAt,
        updatedAt: log.createdAt
      })) : []
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUser: User): Promise<ResponseTaskDto> {
    const task = await this.findOne(id, currentUser) as Task;

    // Only task owner or admin can update tasks
    if (currentUser.role !== Role.ADMIN && task.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    // Validasi tanggal baru jika ada perubahan due date
    if (updateTaskDto.dueDate) {
      const newDueDate = new Date(updateTaskDto.dueDate);
      const isHoliday = await this.holidayApiService.isHoliday(newDueDate);
      
      if (isHoliday) {
        throw new BadRequestException('Cannot reschedule task to a holiday. Please select a different date.');
      }
    }

    // Update the task properties
    Object.assign(task, updateTaskDto);
    
    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(`Task updated: ${id} by user: ${currentUser.id}`);
    return this.responseTaskDto(updatedTask, currentUser);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const task = await this.findOne(id, currentUser) as Task;

    // Only task owner or admin can delete tasks
    if (currentUser.role !== Role.ADMIN && task.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.tasksRepository.remove(task);
    this.logger.log(`Task deleted: ${id} by user: ${currentUser.id}`);
  }

  async assignTask(id: string, assignTaskDto: AssignTaskDto, currentUser: User): Promise<ResponseTaskDto> {
    const { userId } = assignTaskDto;

    // Use a transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const userRepo = queryRunner.manager.getRepository(User);
      const taskRepo = queryRunner.manager.getRepository(Task);
      const activiityLogRepo = queryRunner.manager.getRepository(ActivityLog);
      
      const task = await taskRepo.findOneByOrFail({ id: id });
      if (!task) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      task.userId = userId;
      const updatedTask = await queryRunner.manager.save(task);

      const assignedTo = await userRepo.findOneByOrFail({ id: userId });

      const log = this.activityLogService.buildLogEntity(
        { task: task.id, assignedBy: currentUser.id, assignedTo: userId, action: ActivityAction.ASSIGNED },
        task,
        currentUser,
        assignedTo,
      );
      await activiityLogRepo.save(log);
      
      await queryRunner.commitTransaction();
      this.logger.log(`Task ${id} assigned to user ${userId}`);
      
      return new ResponseTaskDto({...updatedTask, user: assignedTo});
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to assign task ${id} to user ${userId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}