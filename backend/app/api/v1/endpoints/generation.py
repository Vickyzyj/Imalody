import os
import uuid
import base64
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from app.services.task_manager import tasks_db  # <-- Import the shared DB
from huggingface_hub import InferenceClient, AsyncInferenceClient
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Get your API token from the environment
API_TOKEN = os.getenv("HF_TOKEN")
API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-audio-open-1.0"
HEADERS = {"Authorization": f"Bearer {API_TOKEN}"}


class MusicRequest(BaseModel):
    prompt: str


async def call_stable_audio_api(task_id: str, prompt: str):
    """Background task to call the Serverless API for Stable Audio."""
    try:
        tasks_db[task_id] = {"status": "generating_music"}
        logger.info(f"Task {task_id}: Audio generation task started for prompt: {prompt}")

        # Use httpx to make the API call manually
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                API_URL,
                headers=HEADERS,
                json={"inputs": prompt}
            )

            # Check for errors from the API
            response.raise_for_status()

            # The response body is the raw audio bytes
            audio_bytes = response.content

        logger.info(f"Task {task_id}: Audio API call successful.")

        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        audio_data_url = f"data:audio/wav;base64,{audio_base64}"

        tasks_db[task_id] = {"status": "complete", "result": audio_data_url}
        logger.info(f"Task {task_id}: Audio task marked complete.")

    except BaseException as e:
        logger.exception(f"Task {task_id}: Audio generation background task FAILED.")
        tasks_db[task_id] = {"status": "failed", "error": f"Task failed: {type(e).__name__}"}


@router.post("/generate-music-from-text", status_code=202)
async def start_music_generation(request: MusicRequest,
                                 background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}

    background_tasks.add_task(call_stable_audio_api, task_id, request.prompt)

    return {"message": "Music generation started", "task_id": task_id}