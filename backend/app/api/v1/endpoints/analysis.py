import os
import uuid
import io
import base64
from fastapi import APIRouter, File, UploadFile, BackgroundTasks
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient
from PIL import Image

# 1. Create a new ROUTER, not an app
router = APIRouter()

# 2. Initialize the client
client = InferenceClient()

# 3. The background task (uses the imported tasks_db)
async def call_llava_hf_api(task_id: str, image_bytes: bytes):
    """Background task to call the free Serverless Inference API."""
    try:
        tasks_db[task_id] = {"status": "analyzing"}

        image = Image.open(io.BytesIO(image_bytes))
        prompt = "Describe the mood, tone, and theme of this image."

        description = client.image_to_text(
            image,
            prompt=f"USER: <image>\n{prompt}\nASSISTANT:",
            model="llava-hf/llava-1.5-7b-hf"
        )
        
        final_description = description.split("ASSISTANT:")[-1].strip()
        tasks_db[task_id] = {"status": "complete", "result": final_description}

    except Exception as e:
        tasks_db[task_id] = {"status": "failed", "error": str(e)}

# 4. The API endpoint (uses @router, not @app)
@router.post("/analyze-image", status_code=202)
async def start_image_analysis(background_tasks: BackgroundTasks,
                               file: UploadFile = File(...)):
    
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}
    
    image_bytes = await file.read()
    
    background_tasks.add_task(call_llava_hf_api, task_id, image_bytes)
    
    return {"message": "Analysis started", "task_id": task_id}