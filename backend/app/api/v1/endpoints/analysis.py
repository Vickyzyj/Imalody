import os
import uuid
import io
import base64
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient, AsyncInferenceClient
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# 1. Create a new ROUTER, not an app
router = APIRouter()

# Initialize the ASYNC client
client = AsyncInferenceClient()

async def call_blip_hf_api(task_id: str, image_bytes: bytes):
    """Background task to call the free Serverless Inference API."""
    try:
        tasks_db[task_id] = {"status": "analyzing"}

        # Convert bytes to a PIL Image object
        image = Image.open(io.BytesIO(image_bytes))

        # Use the simpler 'image_to_text' function
        # This is a different, simpler function than chat_completion
        response_list = await client.image_to_text(
            image_bytes,
            model="Salesforce/blip-image-captioning-large"
        )

        # --- FIX 2: Add a check for a valid, non-empty response ---
        if not response_list or not isinstance(response_list, list) or len(response_list) == 0:
            raise Exception("API returned an empty or invalid response")

        # This model returns a list, e.g., [{'generated_text': 'a calm lake...'}]
        final_description = response_list[0]["generated_text"]

        if not final_description:
            raise Exception("API response missing 'generated_text' key")
        # --- End of Fix 2 ---

        tasks_db[task_id] = {"status": "complete", "result": final_description}

    except Exception as e:
        tasks_db[task_id] = {"status": "failed", "error": str(e)}


@router.post("/analyze-image", status_code=202)
async def start_image_analysis(background_tasks: BackgroundTasks,
                               file: UploadFile = File(...)):

    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}

    # --- THIS IS THE FIX ---
    # We will wrap the file read in a try/except block
    try:
        image_bytes = await file.read()
        if not image_bytes:
            # Handle empty file upload
            raise HTTPException(status_code=400, detail="No image data received. File might be empty.")

    except Exception as e:
        # If file.read() itself fails (e.g., StopIteration, stream closed)
        # We must log it, set the task to failed, and raise an HTTP error
        logger.error(f"Failed to read image file stream for task {task_id}: {e}")
        tasks_db[task_id] = {"status": "failed", "error": f"Failed to read file: {e}"}
        raise HTTPException(status_code=500, detail=f"Server error reading file stream: {e}")
    # --- END OF FIX ---

    # If the file read succeeds, we add the task to the background
    background_tasks.add_task(call_blip_hf_api, task_id, image_bytes)

    # Make sure to call the new background task function
    background_tasks.add_task(call_blip_hf_api, task_id, image_bytes)

    return {"message": "Analysis started", "task_id": task_id}