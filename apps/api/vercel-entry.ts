import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ValidationPipe } from '@nestjs/common';
import serverlessExpress from '@vendia/serverless-express';

let cachedServer: any;

async function bootstrap() {
    if (!cachedServer) {
        try {
            const app = await NestFactory.create(AppModule);
            app.setGlobalPrefix('api/v1');
            app.enableCors({
                origin: ['https://noble-os.vercel.app', 'http://localhost:3000'],
                methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                credentials: true,
            });
            app.useGlobalPipes(new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }));
            await app.init();
            const expressApp = app.getHttpAdapter().getInstance();
            cachedServer = serverlessExpress({ app: expressApp });
        } catch (error) {
            console.error('❌ NestJS Bootstrap Error:', error);
            throw error;
        }
    }
    return cachedServer;
}

export default async (req: any, res: any) => {
    try {
        const server = await bootstrap();
        return server(req, res);
    } catch (error: any) {
        console.error('🔥 Vercel Serverless Function Crash:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
