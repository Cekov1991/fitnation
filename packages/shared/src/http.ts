import { getConfig } from './config';
import { getAuthStorage, AUTH_TOKEN_KEY, notifyUnauthorized } from './auth';

/**
 * The typed HTTP seam (spec 0025).
 *
 * Two request helpers used to return `Promise<any>` — so every one of the 79
 * API methods and every hook behind them did too, and 711 lines of clean types
 * sat unused — and threw an `any` with two undeclared properties. A network
 * failure was indistinguishable from a 422; a 401 had its side effects before
 * the caller saw it and nothing said so; seven call sites unwrapped
 * `string | string[]` by hand because nobody knew which the server sends.
 *
 * One `request<T>()`, with authentication as an argument so the choice is
 * visible at the call site, and one failure type a caller branches on by tag.
 */

export type ApiFailureKind =
  /** 422: the server rejected the input; `errors` names the fields. */
  | 'validation'
  /** 401: the token was rejected; `unauthorizedHandled` says whether it was already cleared. */
  | 'unauthorized'
  /** Any other non-2xx, with its status. */
  | 'http'
  /** The request never got an HTTP answer — offline, DNS, TLS, aborted. */
  | 'network';

export class ApiFailure extends Error {
  readonly kind: ApiFailureKind;
  readonly status: number | null;
  /** Field → messages. Laravel sends arrays; a scalar is wrapped so callers never check. */
  readonly errors: Record<string, string[]>;
  /** True when this 401 already cleared the stored token and notified the app. */
  readonly unauthorizedHandled: boolean;

  constructor(
    kind: ApiFailureKind,
    message: string,
    options: { status?: number | null; errors?: unknown; unauthorizedHandled?: boolean; cause?: unknown } = {}
  ) {
    super(message);
    this.name = 'ApiFailure';
    this.kind = kind;
    this.status = options.status ?? null;
    this.errors = normaliseFieldErrors(options.errors);
    this.unauthorizedHandled = options.unauthorizedHandled ?? false;
    if (options.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
  }
}

export function isApiFailure(error: unknown): error is ApiFailure {
  return error instanceof ApiFailure;
}

/**
 * Whatever was thrown, as an ApiFailure — so a catch block has one shape to
 * look at. A `TypeError` is what `fetch` rejects with when there is no answer.
 */
export function failureOf(error: unknown): ApiFailure {
  if (isApiFailure(error)) return error;
  if (error instanceof TypeError) return new ApiFailure('network', 'Could not reach the server.', { cause: error });
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Something went wrong.';
  return new ApiFailure('http', message, { cause: error });
}

/** The first message for a field, or undefined — no `Array.isArray` at the call site. */
export function firstFieldError(failure: ApiFailure, field: string): string | undefined {
  return failure.errors[field]?.[0];
}

export function normaliseFieldErrors(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string[]> = {};
  for (const [field, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) out[field] = value.filter((v): v is string => typeof v === 'string');
    else if (typeof value === 'string') out[field] = [value];
  }
  return out;
}

export interface RequestOptions extends RequestInit {
  /** `bearer` sends the stored token and treats a rejected one as a sign-out; `none` sends nothing. */
  auth: 'bearer' | 'none';
}

export async function request<T>(url: string, { auth, ...init }: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  // FormData sets its own multipart boundary.
  if (!(init.body instanceof FormData) && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  let token: string | null = null;
  if (auth === 'bearer') {
    const stored = getAuthStorage().getItem(AUTH_TOKEN_KEY);
    token = stored instanceof Promise ? await stored : stored;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getConfig().baseUrl}${url}`, { ...init, headers });
  } catch (cause) {
    throw new ApiFailure('network', 'Could not reach the server.', { cause });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: unknown };
    const message = body.message || `Request failed (${response.status})`;
    if (response.status === 422) {
      throw new ApiFailure('validation', message, { status: 422, errors: body.errors });
    }
    if (response.status === 401) {
      // A present token the server rejected: user deleted, token revoked, session
      // expired. Clear it and tell the app, and say so on the failure.
      let handled = false;
      if (auth === 'bearer' && token) {
        try {
          await getAuthStorage().removeItem(AUTH_TOKEN_KEY);
        } catch {
          // best effort
        }
        await notifyUnauthorized();
        handled = true;
      }
      throw new ApiFailure('unauthorized', message, { status: 401, unauthorizedHandled: handled });
    }
    throw new ApiFailure('http', message, { status: response.status, errors: body.errors });
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await response.json()) as T;
}
