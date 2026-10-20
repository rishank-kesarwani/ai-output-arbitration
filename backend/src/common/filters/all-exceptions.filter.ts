import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId =
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      uuidv4();

    let clientMessage = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        clientMessage = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors || null;
      } else if (typeof exceptionResponse === 'string') {
        clientMessage = exceptionResponse;
      } else {
        clientMessage = exception.message;
      }
    } else if (status >= 500) {
      // 5xx unexpected error: strictly sanitize to avoid leaking database details, credentials, or prompts
      clientMessage = 'An unexpected server error occurred. Please contact system administrator.';
    }

    if (status >= 500) {
      const errorMessage = exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} 5xx Internal Error: ${errorMessage}`,
        stack,
      );
    } else {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.url} ${status} Client Error: ${JSON.stringify(
          clientMessage,
        )}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: clientMessage,
      errors: errors || undefined,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
