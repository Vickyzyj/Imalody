from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Import your new router files
from app.api.v1.endpoints import analysis, generation, status

app = FastAPI(title="Image-to-Music API")

# 2. Copy your CORS middleware block
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://imalody.onrender.com",
    # Note: allow_origin_regex is not a standard parameter.
    # Let's add all origins explicitly.
    # If your Vercel URL is not static, we can revisit this.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # <-- Your list of allowed frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Include all your routers
app.include_router(analysis.router, tags=["Image Analysis"])
app.include_router(generation.router, tags=["Music Generation"])
app.include_router(status.router, tags=["Task Status"])

# 4. Keep your health check
@app.get("/")
async def read_root():
    """A simple endpoint to confirm the API is running."""
    return {"status": "ok", "message": "Backend is running!"}