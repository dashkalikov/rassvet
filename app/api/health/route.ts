export async function GET(){return Response.json({ok:true,mode:'local',time:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});}
