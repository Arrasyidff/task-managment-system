import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './enums/role.enum';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      this.logger.warn(`Attempted to create a duplicate user: ${username} / ${email}`);
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || Role.USER,
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`User created: ${savedUser.id}`);
    return savedUser;
  }

  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
      return this.userWithoutPassword(user);
    })
  }

  async findOneById(id: string, isIncludePassword: boolean = true): Promise<ResponseUserDto | User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    
    if (isIncludePassword) return user

    return this.userWithoutPassword(user);
  }

  async findOneByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    
    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }
    
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }
    
    return user;
  }

  userWithoutPassword(user: User): ResponseUserDto
  {
    const { password, ...userWithoutPassword } = user;
    return new ResponseUserDto(userWithoutPassword);
  }
}