import os
import uuid
import io
import base64
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient, AsyncInferenceClient
from PIL import Image
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
client = AsyncInferenceClient()


# --- THIS IS THE UPDATED BACKGROUND TASK ---
async def call_blip_hf_api(task_id: str, image_bytes: bytes):
    """Background task to call the free Serverless Inference API."""
    try:
        tasks_db[task_id] = {"status": "analyzing"}
        image = Image.open(io.BytesIO(image_bytes))

        response_list = await client.image_to_text(
            image_bytes,
            model="Salesforce/blip-image-captioning-large"
        )

        if not response_list or not isinstance(response_list, list) or len(response_list) == 0:
            raise Exception("API returned an empty or invalid response")

        final_description = response_list[0].get("generated_text")

        if not final_description:
            raise Exception("API response missing 'generated_text' key")

        tasks_db[task_id] = {"status": "complete", "result": final_description}

    # --- THIS IS THE FIX ---
    # We must catch BaseException to catch StopIteration
    except BaseException as e:
        # --- END OF FIX ---
        # This will now log the StopIteration error
        logger.exception(f"Task {task_id}: Image analysis background task FAILED.")
        tasks_db[task_id] = {"status": "failed", "error": f"Task failed: {type(e).__name__}"}


# --- YOUR ENDPOINT (NO CHANGES NEEDED) ---
@router.post("/analyze-image", status_code=202)
async def start_image_analysis(background_tasks: BackgroundTasks,
                               file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}
    logger.info(f"Task {task_id}: [DEBUG 1] Status set to pending.")

    try:
        image_bytes = await file.read()
        logger.info(f"Task {task_id}: [DEBUG 2] File read successful.")

        if not image_bytes:
            logger.warning(f"Task {task_id}: File was empty, raising 400 error.")
            tasks_db[task_id] = {"status": "failed", "error": "File was empty"}
            raise HTTPException(status_code=400, detail="No image data received. File might be empty.")

    except Exception as e:
        logger.error(f"Task {task_id}: [DEBUG ERROR] CRITICAL ERROR during file.read(): {e}")
        tasks_db[task_id] = {"status": "failed", "error": f"Failed to read file: {e}"}
        raise HTTPException(status_code=500, detail=f"Server error reading file stream: {e}")

    logger.info(f"Task {task_id}: [DEBUG 3] Adding task to background...")
    background_tasks.add_task(call_blip_hf_api, task_id, image_bytes)
    logger.info(f"Task {task_id}: [DEBUG 4] Task added successfully.")

    logger.info(f"Task {task_id}: [DEBUG 5] Returning 'Analysis started' response.")
    return {"message": "Analysis started", "task_id": task_id}