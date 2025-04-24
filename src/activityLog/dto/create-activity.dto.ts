import { IsUUID, IsEnum } from 'class-validator';

export enum ActivityAction {
  ASSIGNED = 'assigned',
  UPDATED = 'updated',
  COMPLETED = 'completed',
  DELETED = 'deleted',
}

export class CreateActivityLogDto {
  @IsUUID()
  task: string;

  @IsUUID()
  assignedBy: string;

  @IsUUID()
  assignedTo: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;
}
