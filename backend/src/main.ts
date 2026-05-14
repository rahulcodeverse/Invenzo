import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:4200',
    credentials: true,
  });

  // Compression
  app.use(compression());

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Note: API versioning disabled - version is included in global prefix (api/v1)
  // If you need versioning later, remove 'v1' from prefix and enable versioning

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Invenzo API')
      .setDescription('Multi-tenant Inventory Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('tenants', 'Tenant/Company management')
      .addTag('products', 'Product catalog')
      .addTag('inventory', 'Inventory tracking')
      .addTag('purchases', 'Purchase management')
      .addTag('sales', 'Sales management')
      .addTag('accounting', 'Accounting & Finance')
      .addTag('reports', 'Reports & Analytics')
      .addTag('notifications', 'Notifications & Alerts')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🚀 Invenzo API Server is running!                  ║
    ║                                                       ║
    ║   📡 Server:  http://localhost:${port}                   ║
    ║   📚 API Docs: http://localhost:${port}/api/docs         ║
    ║   🌍 Environment: ${configService.get('NODE_ENV')}                ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();

