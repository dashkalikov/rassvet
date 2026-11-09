import { getCurrentUser } from './session';
import { AuthError } from './auth-core';
import {HttpError,assertSameOrigin} from './request';
export {HttpError,assertSameOrigin,readJson} from './request';
export async function authenticated(request?: Request) {
  const user = await getCurrentUser();
  if (!user) throw new HttpError('Войдите в аккаунт, чтобы продолжить', 401);
  if (request && !['GET', 'HEAD'].includes(request.method)) {
    assertSameOrigin(request);
  }
  return user;
}
export function apiError(error: unknown) {
  if (error instanceof HttpError || error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && /^(Выберите|Укажите|Введите|Некорректные)/.test(error.message)) return Response.json({ error: error.message }, { status: 400 });
  console.error('Account API failure', error instanceof Error ? error.name : 'Unknown');
  return Response.json({ error: 'Не удалось сохранить данные. Попробуйте ещё раз.' }, { status: 500 });
}
