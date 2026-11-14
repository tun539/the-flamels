import { NextRequest } from 'next/server';
async function proxy(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;
 if(path.some(p=>!/^[-a-zA-Z0-9_]+$/.test(p)))return new Response('Invalid path',{status:400});
 const body=request.method==='GET'?undefined:await request.text();
 if(body && new TextEncoder().encode(body).length>2_000_000)return new Response('File too large',{status:413});
 try {const result=await fetch(`${process.env.BACKEND_URL||'http://localhost:8000'}/api/${path.join('/')}${request.nextUrl.search}`,{method:request.method,headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(20000),cache:'no-store'});return new Response(result.body,{status:result.status,headers:{'Content-Type':result.headers.get('Content-Type')||'application/json',...(result.headers.get('Content-Disposition')?{'Content-Disposition':result.headers.get('Content-Disposition')!}:{})}})}catch{return Response.json({detail:'Backend unavailable. Please retry.'},{status:503})}
}
export const GET=proxy;export const POST=proxy;
