export class ResponseUserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ResponseUserDto>) {
    Object.assign(this, partial);
  }
}