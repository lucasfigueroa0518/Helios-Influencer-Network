export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INSTAGRAM_API_ERROR'
  | 'GEMINI_API_ERROR'
  | 'TOKEN_EXPIRED'
  | 'DUPLICATE_CONTENT'
  | 'BATCH_PROCESSING'
  | 'INTERNAL_ERROR';

export function apiSuccess<T>(data: T, meta?: ApiSuccess<T>['meta']): ApiSuccess<T> {
  return { ok: true, data, ...(meta ? { meta } : {}) };
}

export function apiError(code: ErrorCode, message: string, details?: unknown): ApiError {
  return { ok: false, error: { code, message, ...(details !== undefined ? { details } : {}) } };
}
