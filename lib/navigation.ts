export function safeReturnPath(value:string|undefined) {
  if(!value||!value.startsWith('/')||value.startsWith('//'))return '/account';
  try {const url=new URL(value,'http://rassvet.local');if(url.origin!=='http://rassvet.local'||url.pathname.startsWith('/auth')||url.pathname.startsWith('/api/'))return '/account';return url.pathname+url.search+url.hash;}catch{return '/account';}
}
