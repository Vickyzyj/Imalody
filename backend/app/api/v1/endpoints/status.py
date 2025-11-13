from fastapi import APIRouter, HTTPException
from app.services.task_manager import tasks_db  # <-- Import the shared DB

# 1. Create a new ROUTER
router = APIRouter()

# 2. The API endpoint (uses @router, not @app)
@router.get("/status/{task_id}")
async def get_status(task_id: str):
    """This is the exact code from your old main.py file."""
    
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    status = task.get("status")
    
    if status == "complete":
        result = task.get("result")
        del tasks_db[task_id] 
        return {"status": "complete", "result": result}
    
    elif status == "failed":
        error = task.get("error", "Unknown error")
        del tasks_db[task_id]
        return {"status": "failed", "error": error}
    
    else:
        return {"status": status}