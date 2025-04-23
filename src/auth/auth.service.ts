import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';
import { ResponseUserDto } from 'src/users/dto/response-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    const user = await this.usersService.create(createUserDto)
    return this.usersService.userWithoutPassword(user);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: ResponseUserDto }> {
    const { username, password } = loginDto;
    let user: User;

    try {
      user = await this.usersService.findOneByUsername(username);
    } catch (error) {
      this.logger.warn(`Login attempt with non-existent username: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for user: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      username: user.username,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    
    this.logger.log(`User logged in: ${user.id}`);
    
    return {
      accessToken,
      user: this.usersService.userWithoutPassword(user),
    };
  }
}