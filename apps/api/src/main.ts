import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 🌍 Global Configuration
  app.setGlobalPrefix('api/v1');
  app.enableCors(); // Allow Mobile App to connect
  
  // ✅ Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`🚀 DentalOS API running on: http://localhost:${PORT}/api/v1`);
}
bootstrap();
