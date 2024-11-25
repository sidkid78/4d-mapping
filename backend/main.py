from fastapi import FastAPI, Request, Response
import httpx
import os

app = FastAPI()

FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8000")

@app.api_route("/items/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_request(path: str, request: Request):
    url = f"{FASTAPI_URL}/items/{path}"
    method = request.method
    headers = {"Content-Type": "application/json"}

    body = None
    if method != "GET":
        body = await request.body()

    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=body,
            )
            return Response(content=response.content, status_code=response.status_code, media_type="application/json")
        except httpx.RequestError:
            return Response(content='{"error": "Error connecting to the backend server"}', status_code=500, media_type="application/json")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)