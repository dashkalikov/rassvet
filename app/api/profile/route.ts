import { getDb } from '../../../db';
import { authenticated, apiError, readJson } from '../../../lib/api';
import { createAccountSettings } from '../../../lib/account-settings';
export async function GET() {
  try {
    const user = await authenticated();
    const profile = await createAccountSettings(getDb(), user.userId).getProfile();
    return Response.json({ profile }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) { return apiError(e); }
}
export async function PUT(request: Request) {
  try {
    const user = await authenticated(request);
    const profile = await createAccountSettings(getDb(), user.userId).saveProfile(await readJson(request));
    return Response.json({ profile }, {headers:{'Cache-Control':'private, no-store'}});
  } catch (e) { return apiError(e); }
}
