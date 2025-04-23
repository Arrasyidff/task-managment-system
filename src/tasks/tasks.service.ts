import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
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

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async create(createTaskDto: CreateTaskDto, currentUser: User): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId: currentUser.id,
      user: currentUser,
    });

    const savedTask = await this.tasksRepository.save(task);
    this.logger.log(`Task created: ${savedTask.id} by user: ${currentUser.id}`);
    return savedTask;
  }

  async findAll(currentUser: User): Promise<Task[]> {
    // Admin can see all tasks, users can only see their own
    if (currentUser.role === Role.ADMIN) {
      return this.tasksRepository.find({
        relations: ['user'],
      });
    } else {
      return this.tasksRepository.find({
        where: { userId: currentUser.id },
        relations: ['user'],
      });
    }
  }

  async findOne(id: string, currentUser: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // Check if user has access to this task
    if (currentUser.role !== Role.ADMIN && task.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUser: User): Promise<Task> {
    const task = await this.findOne(id, currentUser);

    // Only task owner or admin can update tasks
    if (currentUser.role !== Role.ADMIN && task.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    // Update the task properties
    Object.assign(task, updateTaskDto);
    
    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(`Task updated: ${id} by user: ${currentUser.id}`);
    return updatedTask;
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const task = await this.findOne(id, currentUser);

    // Only task owner or admin can delete tasks
    if (currentUser.role !== Role.ADMIN && task.userId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.tasksRepository.remove(task);
    this.logger.log(`Task deleted: ${id} by user: ${currentUser.id}`);
  }

  async assignTask(id: string, assignTaskDto: AssignTaskDto): Promise<ResponseTaskDto> {
    const { userId } = assignTaskDto;
    const user = await this.usersService.findOneById(userId);

    // Use a transaction to ensure data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const task = await this.tasksRepository.findOne({ where: { id } });
      
      if (!task) {
        throw new NotFoundException(`Task with ID "${id}" not found`);
      }
      
      task.userId = userId;
      
      const updatedTask = await queryRunner.manager.save(task);
      
      await queryRunner.commitTransaction();
      this.logger.log(`Task ${id} assigned to user ${userId}`);
      
      return new ResponseTaskDto({...updatedTask, user: user});
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to assign task ${id} to user ${userId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}