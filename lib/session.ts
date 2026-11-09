import { cookies } from 'next/headers';
import { getDb } from '../db';
import { createAuth } from './auth-core';
import {SESSION_COOKIE} from './cookies';
export {SESSION_COOKIE,sessionCookie} from './cookies';
export async function getCurrentUser() {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  return token?createAuth(getDb()).resolve(token):null;
}
