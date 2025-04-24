export class ResponseActivityLogDto {
  id: string;
  action: string;
  assignedBy: { id: string; name: string };
  assignedTo: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}
