import { getDb } from '../../../db';
import { authenticated, apiError, HttpError, readJson } from '../../../lib/api';
import { createRecords } from '../../../lib/records';
export async function GET() {
  try {
    const user = await authenticated();
    return Response.json({ orders: await createRecords(getDb(), user.userId).getOrders() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) { return apiError(e); }
}
export async function POST(request: Request) {
  try {
    const user = await authenticated(request);
    const order = await createRecords(getDb(), user.userId).addOrder(await readJson(request));
    return Response.json({ order }, { status: 201 });
  } catch (e) { return apiError(e); }
}
export async function DELETE(request: Request) {
  try {
    const user = await authenticated(request); const { id } = await readJson(request);
    if (typeof id !== 'string' || id.length > 80) throw new HttpError('Некорректный номер заявки', 400);
    if (!await createRecords(getDb(), user.userId).cancelOrder(id)) throw new HttpError('Заявка не найдена или уже отменена', 404);
    return Response.json({ ok: true });
  } catch (e) { return apiError(e); }
}
