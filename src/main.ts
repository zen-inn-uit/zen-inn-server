import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* =======================
     Middleware cơ bản
  ======================= */
  app.use(cookieParser());

  app.use(
    helmet({
      crossOriginResourcePolicy: false, // ⚠️ BẮT BUỘC khi dùng CORS
    }),
  );

  /* =======================
     Chrome Private Network Access
  ======================= */
  app.use((req, res, next) => {
    // Chrome yêu cầu header này cho private network
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  /* =======================
     CORS (CHUẨN CHO NGROK)
  ======================= */
  app.enableCors({
    origin: (origin, callback) => {
      // Cho Postman, server-to-server
      if (!origin) {
        return callback(null, true);
      }

      // Local dev
      if (origin === 'http://localhost:3000') {
        return callback(null, true);
      }

      // ✅ TẤT CẢ domain ngrok (restart không chết)
      if (origin.endsWith('.ngrok-free.dev')) {
        return callback(null, true);
      }

      // Còn lại chặn
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  /* =======================
     Global prefix
  ======================= */
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'oauth/google', method: RequestMethod.ALL },
      { path: 'oauth/google/callback', method: RequestMethod.ALL },
      { path: 'auth/facebook', method: RequestMethod.ALL },
      { path: 'auth/facebook/callback', method: RequestMethod.ALL },
    ],
  });

  /* =======================
     Validation
  ======================= */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  /* =======================
     Swagger
  ======================= */
  const config = new DocumentBuilder()
    .setTitle('ZenInn API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  /* =======================
     Start server
  ======================= */
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API running: http://localhost:${port}/api`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
