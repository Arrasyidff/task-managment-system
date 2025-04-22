import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  app.getHttpAdapter().get('/api-health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Task Management API',
      version: '1.0.0'
    });
  });

  const port = process.env.PORT ?? 3000
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
