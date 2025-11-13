
import uuid
import time
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware # Kept from your file
from pydantic import BaseModel

# --- As per plan: Initialize FastAPI App ---
app = FastAPI(title="Image-to-Music Mock Backend")

# --- Your CORS Middleware ---
# We are keeping this from your original file.
# You may need to add your new Render URL to this list later.
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- As per plan: In-Memory Task DB (simple Python dict) ---
tasks_db = {}


# --- Pydantic Models for API ---
class TaskResponse(BaseModel):
    """Immediate response model when a task is started"""
    message: str
    task_id: str

class MusicRequest(BaseModel):
    """Input model for Endpoint 2"""
    prompt: str


# --- Mock Simulation Functions (for BackgroundTasks) ---

def simulate_image_analysis(task_id: str):
    """
    Mock function to simulate a long-running image analysis.
    This replaces the 'call_minigpt4_hf' function.
    """
    print(f"Task {task_id}: Starting mock image analysis...")
    tasks_db[task_id]["status"] = "analyzing"
    
    # Simulate a 5-second analysis
    time.sleep(5)
    
    # Set the final "complete" status with a mock result
    mock_description = "A mock description of a serene, calm lake at sunset."
    tasks_db[task_id]["status"] = "complete"
    tasks_db[task_id]["result"] = mock_description
    print(f"Task {task_id}: Mock analysis complete.")

def simulate_music_generation(task_id: str):
    """
    Mock function to simulate long-running music generation.
    This replaces the 'call_musicgen_hf' function.
    """
    print(f"Task {task_id}: Starting mock music generation...")
    tasks_db[task_id]["status"] = "generating_music"

    # Simulate a 10-second generation
    time.sleep(10)
    
    # Set the final "complete" status with a mock result (a tiny, silent base64 audio file)
    mock_audio_base64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    tasks_db[task_id]["status"] = "complete"
    tasks_db[task_id]["result"] = mock_audio_base64
    print(f"Task {task_id}: Mock music generation complete.")


# --- As per plan: API Endpoints ---

@app.get("/")
def read_root():
    """A simple health check endpoint."""
    return {"message": "Imalody Mock Backend is live!"}

# Endpoint 1: Start Image Analysis
@app.post("/analyze-image", response_model=TaskResponse, status_code=202)
async def start_analysis(background_tasks: BackgroundTasks, image: UploadFile = File(...)):
    # 1. Generate task_id
    task_id = str(uuid.uuid4())
    
    # 2. Set pending status
    tasks_db[task_id] = {"status": "pending"}
    
    # 3. Start mock background task
    background_tasks.add_task(simulate_image_analysis, task_id)
    
    # 4. Return immediately
    return {"message": "Analysis started", "task_id": task_id}


# Endpoint 2: Start Music Generation
@app.post("/generate-music-from-text", response_model=TaskResponse, status_code=202)
async def start_generation(request: MusicRequest, background_tasks: BackgroundTasks):
    # 1. Generate task_id
    task_id = str(uuid.uuid4())
    
    # 2. Set pending status
    tasks_db[task_id] = {"status": "pending"}
    
    # 3. Start mock background task
    background_tasks.add_task(simulate_music_generation, task_id)
    
    # 4. Return immediately
    return {"message": "Music generation started", "task_id": task_id}


# Endpoint 3: Get Task Status
@app.get("/status/{task_id}")
async def get_status(task_id: str):
    # Find the task
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    status = task.get("status")
    
    if status == "complete":
        # As per plan: delete entry from DB after returning "complete" status
        result = task.get("result")
        del tasks_db[task_id] 
        return {"status": "complete", "result": result}
    
    elif status == "failed":
        # As per plan: delete entry from DB after returning "failed" status
        error = task.get("error", "Unknown error")
        del tasks_db[task_id]
        return {"status": "failed", "error": error}
    
    else:
        # Return pending/analyzing/generating_music status
        return {"status": status}