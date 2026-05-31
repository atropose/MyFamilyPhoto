"""
Windows AI Inference Service
얼굴 감지를 위한 InsightFace + ONNX Runtime (CUDA) 서비스
포트: 8100
"""
import io
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# InsightFace app (loaded once at startup)
_face_analyzer = None


def load_face_analyzer():
    global _face_analyzer
    try:
        import insightface
        from insightface.app import FaceAnalysis
        analyzer = FaceAnalysis(
            name="buffalo_l",
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
        )
        analyzer.prepare(ctx_id=0, det_size=(640, 640))
        _face_analyzer = analyzer
        logger.info("InsightFace 모델 로드 완료 (CUDA)")
    except Exception as e:
        logger.warning(f"InsightFace 로드 실패: {e}. 더미 모드로 실행됩니다.")
        _face_analyzer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_face_analyzer()
    yield


app = FastAPI(title="MyPicManager AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pil_to_cv2(img: Image.Image) -> np.ndarray:
    img_rgb = img.convert("RGB")
    arr = np.array(img_rgb)
    # PIL RGB → OpenCV BGR
    return arr[:, :, ::-1].copy()


def _detect_faces(img: Image.Image) -> int:
    if _face_analyzer is None:
        return 0
    img_bgr = _pil_to_cv2(img)
    faces = _face_analyzer.get(img_bgr)
    return len(faces)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": _face_analyzer is not None,
        "backend": "cuda" if _face_analyzer is not None else "none",
    }


@app.post("/detect-faces")
async def detect_faces(file: UploadFile = File(...)):
    """단일 이미지에서 얼굴 수 감지"""
    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        raise HTTPException(status_code=400, detail="이미지를 읽을 수 없습니다")

    # 너무 큰 이미지는 리사이즈 (메모리 절약)
    max_dim = 1920
    if max(img.width, img.height) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    face_count = _detect_faces(img)
    return {"face_count": face_count, "filename": file.filename}


@app.post("/detect-faces/batch")
async def detect_faces_batch(files: list[UploadFile] = File(...)):
    """여러 이미지 일괄 얼굴 감지"""
    results = []
    for f in files:
        data = await f.read()
        try:
            img = Image.open(io.BytesIO(data))
            img.load()
            max_dim = 1920
            if max(img.width, img.height) > max_dim:
                img.thumbnail((max_dim, max_dim), Image.LANCZOS)
            face_count = _detect_faces(img)
            results.append({"filename": f.filename, "face_count": face_count, "error": None})
        except Exception as e:
            results.append({"filename": f.filename, "face_count": 0, "error": str(e)})
    return {"results": results}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8100))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
