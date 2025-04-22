import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTaskDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}