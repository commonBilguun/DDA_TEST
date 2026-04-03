import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting DDA Agent server...")
    yield
    print("Shutting down server...")


app = FastAPI(
    title="DDA Agent",
    description="Poor Bilguun trying to get hired by DDA. it is the test project",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 7860))
    print(f"Starting server at http://localhost:{port}")
    print(f"API docs available at http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)