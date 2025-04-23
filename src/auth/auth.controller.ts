import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/auth.dto';
import { Public } from '../common/decorators/public.decorator';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<ResponseUserDto>
  {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto): Promise<{ accessToken: string; user: ResponseUserDto }>
  {
    return this.authService.login(loginDto);
  }
}