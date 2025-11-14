import os
import uuid
import io
import base64
from fastapi import APIRouter, File, UploadFile, BackgroundTasks, HTTPException
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient, AsyncInferenceClient
from PIL import Image
import logging

# Set up a logger to make sure we can see the messages in Render
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
client = AsyncInferenceClient()


async def call_llava_hf_api(task_id: str, image_bytes: bytes):
    """Background task to call the HF Serverless API for LLaVA."""
    try:
        tasks_db[task_id] = {"status": "analyzing"}
        logger.info(f"Task {task_id}: Background task started for LLaVA.")

        # 1. Convert image bytes to a base64 Data URL
        img_base64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{img_base64}"
        logger.info(f"Task {task_id}: Image converted to data URL.")

        # 2. Define text prompt
        prompt_text = "Describe the mood, tone, and theme of this image."

        # 3. Build the "messages" payload for LLaVA
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
            }
        ]
        logger.info(f"Task {task_id}: LLaVA payload created.")

        # 4. Call client.chat_completion
        response = await client.chat_completion(
            messages=messages,
            model="llava-hf/llava-v1.6-mistral-7b-hf",  # The Pro-tier model
            max_tokens=100
        )
        logger.info(f"Task {task_id}: LLaVA API call successful.")

        # 5. Extract the text response
        final_description = response.choices[0].message.content
        tasks_db[task_id] = {"status": "complete", "result": final_description}
        logger.info(f"Task {task_id}: Task marked complete.")

    except BaseException as e:  # Catch BaseException to include StopIteration
        logger.exception(f"Task {task_id}: LLaVA background task FAILED.")
        tasks_db[task_id] = {"status": "failed", "error": f"Task failed: {type(e).__name__}"}


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
    background_tasks.add_task(call_llava_hf_api, task_id, image_bytes)  # Call the LLaVA function
    logger.info(f"Task {task_id}: [DEBUG 4] Task added successfully.")

    logger.info(f"Task {task_id}: [DEBUG 5] Returning 'Analysis started' response.")
    return {"message": "Analysis started", "task_id": task_id}