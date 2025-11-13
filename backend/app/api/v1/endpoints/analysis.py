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

# Initialize the client
client = AsyncInferenceClient()


# This is the corrected background task
async def call_llava_hf_api(task_id: str, image_bytes: bytes):
    """Background task to call the free Serverless Inference API."""
    try:
        tasks_db[task_id] = {"status": "analyzing"}

        # 1. Convert your image bytes to a base64 Data URL
        img_base64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{img_base64}"

        # 2. Define your text prompt
        prompt_text = "Describe the mood, tone, and theme of this image."

        # 3. Build the special "messages" payload for LLaVA
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
            }
        ]

        # 4. Call client.chat_completion (the correct function)
        response = await client.chat_completion(
            messages=messages,
            model="llava-hf/llava-1.5-7b-hf",
            max_tokens=100  # Limit the response to 100 tokens
        )

        # 5. Extract the text response
        final_description = getattr(response.choices[0].message, "content", None)
        tasks_db[task_id] = {"status": "complete", "result": final_description}

    except Exception as e:
        logger.exception("Error during LLaVA analysis.")
        tasks_db[task_id] = {"status": "failed", "error": str(e)}


# Your endpoint definition stays exactly the same
@router.post("/analyze-image", status_code=202)
async def start_image_analysis(background_tasks: BackgroundTasks,
                               file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}

    image_bytes = await file.read()

    background_tasks.add_task(call_llava_hf_api, task_id, image_bytes)

    return {"message": "Analysis started", "task_id": task_id}