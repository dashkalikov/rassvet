import { getDb } from '../../../db';
import { authenticated, apiError, readJson } from '../../../lib/api';
import { createRecords } from '../../../lib/records';
export async function GET() {
  try {
    const user = await authenticated();
    return Response.json({ tickets: await createRecords(getDb(), user.userId).getTickets() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) { return apiError(e); }
}
export async function POST(request: Request) {
  try {
    const user = await authenticated(request);
    const ticket = await createRecords(getDb(), user.userId).addTicket(await readJson(request));
    return Response.json({ ticket }, { status: 201 });
  } catch (e) { return apiError(e); }
}
