# In backend/app/test_main.py
import pytest
from fastapi.testclient import TestClient
from app.main import app  # Import your main app
from app.services import task_manager # Import the real tasks_db
import time

# Create a test client that can call our app
client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_task_db():
    """This fixture runs before each test to clear the database."""
    task_manager.tasks_db.clear()

def test_health_check():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Backend is running!"}

def test_image_analysis_flow(mocker):
    """
    Full end-to-end test for the /analyze-image flow.
    We mock the 'call_llava_hf_api' background task itself.
    """
    # 1. Mock the background task function
    mock_task = mocker.patch(
        "app.api.v1.endpoints.analysis.call_llava_hf_api", 
        autospec=True
    )

    # 2. Call the API to *start* the task
    # We send a tiny fake image file
    fake_image_bytes = b"fake-image-data"
    response = client.post(
        "/analyze-image",
        files={"file": ("test.jpg", fake_image_bytes, "image/jpeg")}
    )

    # 3. Check the immediate response
    assert response.status_code == 202
    data = response.json()
    assert "task_id" in data
    task_id = data["task_id"]

    # 4. Check that the mock task was called correctly in the background
    mock_task.assert_called_once_with(task_id, fake_image_bytes)

    # 5. Manually set the task as 'complete' in the DB (to simulate the task finishing)
    task_manager.tasks_db[task_id] = {
        "status": "complete",
        "result": "a mock description"
    }

    # 6. Check the /status endpoint
    response = client.get(f"/status/{task_id}")
    assert response.status_code == 200
    assert response.json() == {
        "status": "complete",
        "result": "a mock description"
    }

def test_music_generation_flow(mocker):
    """Full end-to-end test for the /generate-music-from-text flow."""

    # 1. Mock the background task function
    mock_task = mocker.patch(
        "app.api.v1.endpoints.generation.call_stable_audio_api", 
        autospec=True
    )

    # 2. Call the API to *start* the task
    prompt_text = "a test prompt"
    response = client.post(
        "/generate-music-from-text",
        json={"prompt": prompt_text}
    )

    # 3. Check the immediate response
    assert response.status_code == 202
    task_id = response.json()["task_id"]

    # 4. Check that the mock task was called correctly
    mock_task.assert_called_once_with(task_id, prompt_text)

    # 5. Manually set the task as 'complete'
    mock_audio_url = "data:audio/wav;base64,..."
    task_manager.tasks_db[task_id] = {
        "status": "complete",
        "result": mock_audio_url
    }

    # 6. Check the /status endpoint
    response = client.get(f"/status/{task_id}")
    assert response.status_code == 200
    assert response.json() == {
        "status": "complete",
        "result": mock_audio_url
    }