"""Reject oversized bodies before JSON parsing; protect configured import writes."""
import hmac
import os
from starlette.responses import JSONResponse

class RequestLimits:
    def __init__(self,app):self.app=app
    async def __call__(self,scope,receive,send):
        if scope['type']!='http':return await self.app(scope,receive,send)
        chunks=[];size=0
        while True:
            message=await receive()
            if message['type']=='http.disconnect':return
            size+=len(message.get('body',b''))
            if size>2_000_000:return await JSONResponse({'detail':'Maximum request size is 2 MB'},status_code=413)(scope,receive,send)
            chunks.append(message.get('body',b''))
            if not message.get('more_body'):break
        token=os.getenv('FLAMEATLAS_WRITE_TOKEN')
        if token and scope['path']=='/api/import/commit':
            supplied=dict(scope.get('headers',[])).get(b'x-write-token',b'')
            if not hmac.compare_digest(token.encode(),supplied):
                return await JSONResponse({'detail':'Import token required'},status_code=403)(scope,receive,send)
        delivered=False
        async def replay():
            nonlocal delivered
            if delivered:return await receive()
            delivered=True
            return {'type':'http.request','body':b''.join(chunks),'more_body':False}
        await self.app(scope,replay,send)
