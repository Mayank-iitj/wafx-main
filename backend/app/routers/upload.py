import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()

# In-memory upload tracking
uploads_db: dict = {}


@router.post("/resumes", summary="Upload one or more resume files for AI processing")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    job_id: str = None,
    current_user: dict = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    results = []
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    for file in files:
        if not file.filename.endswith((".pdf", ".docx")):
            results.append({"filename": file.filename, "status": "error", "error": "Unsupported file type"})
            continue

        # Check size
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            results.append({"filename": file.filename, "status": "error", "error": "File too large"})
            continue

        file_id = str(uuid.uuid4())
        # Save file
        save_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_{file.filename}")
        with open(save_path, "wb") as f:
            f.write(content)

        upload_record = {
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "job_id": job_id,
            "status": "queued",
            "path": save_path,
        }
        uploads_db[file_id] = upload_record

        # In production: enqueue Celery task here
        # process_resume.delay(file_id)

        results.append({
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "status": "queued",
            "message": "Queued for AI processing",
        })

    return {
        "uploaded": len([r for r in results if r["status"] == "queued"]),
        "errors": len([r for r in results if r["status"] == "error"]),
        "files": results,
    }


@router.get("/status/{upload_id}", summary="Get processing status of an uploaded file")
async def get_upload_status(upload_id: str, current_user: dict = Depends(get_current_user)):
    upload = uploads_db.get(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload


@router.get("/", summary="List all uploads")
async def list_uploads(current_user: dict = Depends(get_current_user)):
    return {"uploads": list(uploads_db.values())}
