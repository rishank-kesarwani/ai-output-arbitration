import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(compression());

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-tenant-id',
      'x-workspace-id',
      'x-correlation-id',
      'x-request-id',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('api/v1', {
    exclude: [
      'health',
      'health/live',
      'health/ready',
      'api/v1/health',
      'api/v1/health/live',
      'api/v1/health/ready',
      '/',
    ],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Output Arbitration & Trust Layer API')
    .setDescription(
      'Evidence-aware response evaluation, deterministic validation, citation checking, calibrated abstention, and human review engine.',
    )
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'x-tenant-id')
    .addTag('Arbitration', 'Core multi-candidate evaluation and decision endpoints')
    .addTag('Policies', 'Tenant arbitration policies and rules')
    .addTag('Human Review Queue', 'Escalation adjudication and audit resolutions')
    .addTag('Test Scenarios', 'Reproducible test console evaluation scenarios')
    .addTag('Health', 'Kubernetes/Render liveness and readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'AI Output Arbitration & Trust Layer API Docs',
  });
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AI Output Arbitration & Trust Layer API Docs',
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 AI Output Arbitration API running on http://0.0.0.0:${port}/api/v1`);
  logger.log(`🩺 Health probes available at http://0.0.0.0:${port}/health`);
  logger.log(`📚 Swagger documentation at http://0.0.0.0:${port}/docs`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Fatal application startup error: ${err.message}`, err.stack);
  process.exit(1);
});
