import os
import uuid
import io
import base64
from fastapi import APIRouter, File, UploadFile, BackgroundTasks
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

        # This model returns a list, e.g., [{'generated_text': 'a calm lake...'}]
        final_description = response_list[0]["generated_text"]

        tasks_db[task_id] = {"status": "complete", "result": final_description}

    except Exception as e:
        tasks_db[task_id] = {"status": "failed", "error": str(e)}


@router.post("/analyze-image", status_code=202)
async def start_image_analysis(background_tasks: BackgroundTasks,
                               file: UploadFile = File(...)):

    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}

    image_bytes = await file.read()

    # Make sure to call the new background task function
    background_tasks.add_task(call_blip_hf_api, task_id, image_bytes)

    return {"message": "Analysis started", "task_id": task_id}