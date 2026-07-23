from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from starlette.concurrency import run_in_threadpool
from core.deps import get_current_user
import models
from services.ai_pipeline import pipeline

router = APIRouter()

@router.post("/")
async def protect_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    contents = await file.read()
    
    # Run CPU-bound ML processing in a threadpool to avoid blocking the event loop
    protected_base64, metrics = await run_in_threadpool(pipeline.process_image, contents)
    
    if protected_base64 is None:
        raise HTTPException(status_code=400, detail=metrics.get("error", "Unknown error"))
        
    return {
        "message": "Image protected successfully",
        "protected_image": protected_base64,
        "metrics": metrics
    }
