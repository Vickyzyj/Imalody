import os
import uuid
import io
import base64
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient, AsyncInferenceClient
from PIL import Image
import logging

# --- ADD THIS ---
# Set up a logger to make sure we can see the messages in Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# --- END ADD ---

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
    logger.info(f"Task {task_id}: [DEBUG 1] Status set to pending.")  # <-- LOG 1

    try:
        image_bytes = await file.read()
        logger.info(f"Task {task_id}: [DEBUG 2] File read successful.")  # <-- LOG 2

        if not image_bytes:
            logger.warning(f"Task {task_id}: File was empty, raising 400 error.")
            tasks_db[task_id] = {"status": "failed", "error": "File was empty"}
            raise HTTPException(status_code=400, detail="No image data received. File might be empty.")

    except Exception as e:
        # This will catch the StopIteration if it happens during file.read()
        logger.error(f"Task {task_id}: [DEBUG ERROR] CRITICAL ERROR during file.read(): {e}")
        tasks_db[task_id] = {"status": "failed", "error": f"Failed to read file: {e}"}
        raise HTTPException(status_code=500, detail=f"Server error reading file stream: {e}")

    logger.info(f"Task {task_id}: [DEBUG 3] Adding task to background...")  # <-- LOG 3
    background_tasks.add_task(call_blip_hf_api, task_id, image_bytes)
    logger.info(f"Task {task_id}: [DEBUG 4] Task added successfully.")  # <-- LOG 4

    logger.info(f"Task {task_id}: [DEBUG 5] Returning 'Analysis started' response.")
    return {"message": "Analysis started", "task_id": task_id}