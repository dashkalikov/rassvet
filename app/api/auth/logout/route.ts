import { logoutRequest } from '../../../../lib/auth-http';
export async function POST(request:Request){return logoutRequest(request);}
