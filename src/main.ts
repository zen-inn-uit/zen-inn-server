// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common'; // ⬅️ thêm RequestMethod
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });

  // ⬇️ Dùng RequestMethod.ALL thay vì để undefined
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'oauth/google', method: RequestMethod.ALL },
      { path: 'oauth/google/callback', method: RequestMethod.ALL },
      { path: 'auth/facebook', method: RequestMethod.ALL },
      { path: 'auth/facebook/callback', method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('ZenInn API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  await app.listen(process.env.PORT || 3000);
  console.log(`http://localhost:${process.env.PORT || 3000}/api/docs`);
}
bootstrap();
