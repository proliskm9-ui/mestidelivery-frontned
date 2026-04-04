"""
File Upload Router - Improved Version
Handles file uploads with Supabase Storage and local fallback
"""
import os
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List

from config import UPLOAD_DIR, MAX_UPLOAD_SIZE, ALLOWED_EXTENSIONS, SUPABASE_STORAGE_BUCKET
from models import AdminUser
from routers.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["upload"])
logger = logging.getLogger(__name__)

# Ensure upload directory exists
upload_path = Path(UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)


def sanitize_filename(filename: str) -> str:
    """Remove potentially dangerous characters from filename"""
    return "".join(c for c in filename if c.isalnum() or c in "._-")


def validate_file(file: UploadFile, content: bytes) -> str:
    """
    Validate file and return file extension.
    Raises HTTPException if validation fails.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in ALLOWED_EXTENSIONS:
        logger.warning(f"Invalid file type attempted: {file_ext}")
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_UPLOAD_SIZE / 1024 / 1024:.1f}MB"
        )
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Basic magic bytes check for images
    magic_bytes = {
        b'\xff\xd8\xff': '.jpg',  # JPEG
        b'\x89PNG': '.png',        # PNG
        b'RIFF': '.webp',          # WebP (starts with RIFF...WEBP)
    }
    
    detected_type = None
    for magic, ext in magic_bytes.items():
        if content[:len(magic)] == magic:
            detected_type = ext
            break
    
    if detected_type and detected_type != file_ext:
        # Allow jpg/jpeg mismatch
        if not (detected_type == '.jpg' and file_ext == '.jpeg'):
            logger.warning(f"File extension mismatch: {file_ext} vs {detected_type}")
    
    return file_ext


async def upload_to_supabase(content: bytes, filename: str, content_type: str) -> str:
    """
    Upload file to Supabase Storage.
    
    Returns:
        Public URL of the uploaded file
    """
    from supabase_client import get_supabase
    supabase = get_supabase()
    
    if not supabase:
        raise Exception("Supabase not configured")
    
    # Upload to Supabase Storage
    supabase.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
        file=content,
        path=filename,
        file_options={"content-type": content_type}
    )
    
    # Get public URL
    public_url = supabase.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(filename)
    
    return public_url


async def upload_to_local(content: bytes, filename: str) -> str:
    """
    Upload file to local storage.
    
    Returns:
        Relative URL path to the file
    """
    filepath = upload_path / filename
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    return f"/uploads/{filename}"


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Upload a single image file.
    
    Attempts to upload to Supabase Storage first, falls back to local storage.
    
    Returns:
        success: boolean
        url: URL to access the uploaded file
    """
    # Read file content
    content = await file.read()
    
    # Validate
    file_ext = validate_file(file, content)
    
    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{file_ext}"
    
    # Try Supabase first
    try:
        url = await upload_to_supabase(content, filename, file.content_type or "image/jpeg")
        logger.info(f"File uploaded to Supabase: {filename} by {current_user.username}")
        return {"success": True, "url": url, "storage": "supabase"}
    except Exception as e:
        logger.warning(f"Supabase upload failed: {e}. Falling back to local storage.")
    
    # Fallback to local storage
    try:
        url = await upload_to_local(content, filename)
        logger.info(f"File uploaded to local: {filename} by {current_user.username}")
        return {"success": True, "url": url, "storage": "local"}
    except Exception as e:
        logger.error(f"Local upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.post("/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Upload multiple image files (max 10).
    
    Returns:
        success: boolean
        files: list of uploaded file info
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files per request")
    
    results = []
    
    for file in files:
        content = await file.read()
        
        try:
            file_ext = validate_file(file, content)
            filename = f"{uuid.uuid4().hex}{file_ext}"
            
            # Try Supabase first
            try:
                url = await upload_to_supabase(content, filename, file.content_type or "image/jpeg")
                storage = "supabase"
            except:
                url = await upload_to_local(content, filename)
                storage = "local"
            
            results.append({
                "original_name": file.filename,
                "url": url,
                "storage": storage,
                "success": True
            })
            
        except HTTPException as e:
            results.append({
                "original_name": file.filename,
                "error": e.detail,
                "success": False
            })
    
    logger.info(f"Bulk upload: {len([r for r in results if r['success']])}/{len(files)} by {current_user.username}")
    
    return {
        "success": all(r['success'] for r in results),
        "files": results
    }


@router.delete("/{filename}")
async def delete_file(
    filename: str,
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Delete an uploaded file.
    
    Attempts to delete from both Supabase and local storage.
    """
    # Sanitize filename to prevent path traversal
    safe_filename = sanitize_filename(filename)
    
    if not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    deleted_from = []
    
    # Try to delete from Supabase
    try:
        from supabase_client import get_supabase
        supabase = get_supabase()
        if supabase:
            supabase.storage.from_(SUPABASE_STORAGE_BUCKET).remove([safe_filename])
            deleted_from.append("supabase")
    except Exception as e:
        logger.debug(f"Supabase delete failed (may not exist): {e}")
    
    # Try to delete from local storage
    local_path = upload_path / safe_filename
    if local_path.exists():
        try:
            os.remove(local_path)
            deleted_from.append("local")
        except Exception as e:
            logger.error(f"Failed to delete local file: {e}")
    
    if not deleted_from:
        raise HTTPException(status_code=404, detail="File not found")
    
    logger.info(f"File deleted: {safe_filename} from {deleted_from} by {current_user.username}")
    return {"success": True, "deleted_from": deleted_from}
