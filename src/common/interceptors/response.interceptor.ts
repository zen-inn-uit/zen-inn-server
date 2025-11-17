import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T | null;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => {
        const statusCode = response.statusCode || HttpStatus.OK;
        const message = this.getMessageByStatusCode(statusCode);

        return {
          statusCode,
          message,
          data: data || null,
        };
      }),
    );
  }

  private getMessageByStatusCode(statusCode: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.OK]: 'Success',
      [HttpStatus.CREATED]: 'Created successfully',
      [HttpStatus.ACCEPTED]: 'Accepted',
      [HttpStatus.NO_CONTENT]: 'No content',
      [HttpStatus.BAD_REQUEST]: 'Bad request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
    };

    return messages[statusCode] || 'Unknown error';
  }
}
