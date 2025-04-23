import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '../src/users/enums/role.enum';
import { TaskStatus, TaskPriority } from '../src/tasks/entities/task.entity';
import { TestModule } from './test.module'; // Use TestModule instead of AppModule

describe('Task Management API (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let taskRepository: Repository<Task>;
  
  // Test users data
  const adminUser = {
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'password123',
    role: Role.ADMIN
  };
  
  const regularUser = {
    username: 'user_test',
    email: 'user@test.com',
    password: 'password123',
    role: Role.USER
  };
  
  // Store token and ids for testing
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule], // Use TestModule which includes SQLite and mocks
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    
    userRepository = moduleFixture.get(getRepositoryToken(User));
    taskRepository = moduleFixture.get(getRepositoryToken(Task));

    await app.init();
    await setupTestData();
  });

  async function setupTestData() {
    // Clear data
    await taskRepository.delete({});
    await userRepository.delete({});
    
    // Create admin user
    const salt = await bcrypt.genSalt();
    const adminHashedPassword = await bcrypt.hash(adminUser.password, salt);
    const createdAdmin = await userRepository.save({
      ...adminUser,
      password: adminHashedPassword
    });
    adminId = createdAdmin.id;
    
    // Create regular user
    const userHashedPassword = await bcrypt.hash(regularUser.password, salt);
    const createdUser = await userRepository.save({
      ...regularUser,
      password: userHashedPassword
    });
    userId = createdUser.id;
    
    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: adminUser.username, password: adminUser.password })
      .expect(200);
    
    adminToken = adminLogin.body.accessToken;
    
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: regularUser.username, password: regularUser.password })
      .expect(200);
    
    userToken = userLogin.body.accessToken;
  }

  afterAll(async () => {
    await taskRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'new_test_user',
          email: 'newuser@test.com',
          password: 'password123'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('new_test_user');
      expect(response.body.email).toBe('newuser@test.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: adminUser.username,
          password: adminUser.password
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(adminUser.username);
    });

    it('should fail login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: adminUser.username,
          password: 'wrong_password'
        })
        .expect(401);
    });
  });

  describe('Tasks Management', () => {
    it('should create a new task', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.PENDING,
          dueDate: new Date('2025-05-01').toISOString()
        })
        .expect(201);
      
      taskId = response.body.id;
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
      expect(response.body.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should get all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should get a single task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', taskId);
      expect(response.body.title).toBe('Test Task');
    });

    it('should update a task', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Test Task',
          status: TaskStatus.IN_PROGRESS
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('id', taskId);
      expect(response.body.title).toBe('Updated Test Task');
      expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should allow admin to assign task to another user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: userId
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('id', taskId);
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should not allow non-admin to assign tasks', async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: adminId
        })
        .expect(403);
    });

    it('should sort tasks by createdAt', async () => {
      // Create another task for sorting test
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Another Test Task',
          description: 'This is another test task',
          priority: TaskPriority.HIGH
        })
        .expect(201);
      
      const response = await request(app.getHttpServer())
        .get('/tasks?sortBy=createdAt&sortOrder=DESC')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Check sorting order (latest first)
      const dates = response.body.map(task => new Date(task.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });

    it('should delete a task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Holiday API Integration', () => {
    it('should get holidays for a specific year', async () => {
      const response = await request(app.getHttpServer())
        .get('/holidays/2025')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});