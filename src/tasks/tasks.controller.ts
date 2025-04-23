import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { ResponseTaskDto } from './dto/response-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req): Promise<ResponseTaskDto>
  {
    const user = req.user as User;
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  findAll(@Req() req): Promise<ResponseTaskDto[]>
  {
    const user = req.user as User;
    return this.tasksService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req): Promise<ResponseTaskDto>
  {
    const user = req.user as User;
    return this.tasksService.findOne(id, user, true);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req,
  ): Promise<ResponseTaskDto> {
    const user = req.user as User;
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req): Promise<void>
  {
    const user = req.user as User;
    return this.tasksService.remove(id, user);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  assignTask(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
  ): Promise<ResponseTaskDto> {
    return this.tasksService.assignTask(id, assignTaskDto);
  }
}