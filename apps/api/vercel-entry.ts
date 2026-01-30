import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';

let cachedApp: any;

export default async function (req: any, res: any) {
    if (!cachedApp) {
        const app = await NestFactory.create(AppModule);
        app.setGlobalPrefix('api/v1');
        app.enableCors();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));
        await app.init();
        cachedApp = app.getHttpAdapter().getInstance();
    }
    return cachedApp(req, res);
}
