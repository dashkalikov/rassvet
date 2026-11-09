import { authenticateRequest } from '../../../../lib/auth-http';
export async function POST(request:Request){return authenticateRequest(request,'register');}
