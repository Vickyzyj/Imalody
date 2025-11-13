import os
import uuid
import base64
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient

# 1. Create a new ROUTER
router = APIRouter()

# 2. Initialize the client
client = InferenceClient()

# 3. Move your Pydantic model here
class MusicRequest(BaseModel):
    prompt: str

# 4. The background task (uses the imported tasks_db)
async def call_stable_audio_api(task_id: str, prompt: str):
    """Background task to call the free Serverless Inference API."""
    try:
        tasks_db[task_id] = {"status": "generating_music"}

        audio_bytes = client.text_to_audio(
            prompt,
            model="stabilityai/stable-audio-open-1.0"
        )
        
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        audio_data_url = f"data:audio/wav;base64,{audio_base64}"

        tasks_db[task_id] = {"status": "complete", "result": audio_data_url}

    except Exception as e:
        tasks_db[task_id] = {"status": "failed", "error": str(e)}

# 5. The API endpoint (uses @router, not @app)
@router.post("/generate-music-from-text", status_code=202)
async def start_music_generation(request: MusicRequest, 
                                 background_tasks: BackgroundTasks):
    
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}
    
    background_tasks.add_task(call_stable_audio_api, task_id, request.prompt)
    
    return {"message": "Music generation started", "task_id": task_id}