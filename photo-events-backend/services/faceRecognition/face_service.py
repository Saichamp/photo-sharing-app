"""
Face Recognition Service using InsightFace
TESTED and WORKING based on test_multiple_photos_BALANCED.py
"""

import os
import sys
import json
import cv2
import numpy as np

# ========================================================================
# Redirect stdout so ONLY JSON goes to Node
# All other logs (InsightFace model loading, debug) go to stderr
# ========================================================================

class StdoutToStderr:
    def write(self, s):
        sys.stderr.write(s)
    def flush(self):
        sys.stderr.flush()

# Redirect prints used by libraries to stderr
sys.stdout = StdoutToStderr()

from insightface.app import FaceAnalysis

# ========================================================================
# Initialize InsightFace (same config as your tests)
# ========================================================================

print("🔧 Loading InsightFace buffalo_l model...", file=sys.stderr)

app = FaceAnalysis(
    name='buffalo_l',           # Best accuracy model
    providers=['CPUExecutionProvider']
)

app.prepare(
    ctx_id=-1,
    det_size=(480, 480),        # Balanced speed/accuracy
    det_thresh=0.5
)

print("✅ InsightFace model loaded successfully", file=sys.stderr)

# ========================================================================
# Helper Functions
# ========================================================================

def preprocess_image(img, max_dimension=1280):
    """Smart resizing: only resize if image is too large."""
    height, width = img.shape[:2]
    max_side = max(height, width)

    if max_side > max_dimension:
        scale = max_dimension / max_side
        new_width = int(width * scale)
        new_height = int(height * scale)
        img = cv2.resize(
            img,
            (new_width, new_height),
            interpolation=cv2.INTER_AREA
        )

    return img


def cosine_similarity(emb1, emb2):
    """Calculate cosine similarity between two embeddings."""
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

# ========================================================================
# Main Functions
# ========================================================================

def extract_face_embedding(image_path):
    """
    Extract face embedding from a single image (selfie).
    Returns a dict: { success, embedding?, confidence?, faces_detected?, error? }
    """
    try:
        if not os.path.exists(image_path):
            return {"success": False, "error": "Image file not found"}

        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": "Could not read image"}

        img = preprocess_image(img)
        faces = app.get(img)

        if len(faces) == 0:
            return {"success": False, "error": "No face detected in image"}

        face = faces[0]
        embedding = face.embedding.tolist()

        return {
            "success": True,
            "embedding": embedding,
            "confidence": float(face.det_score),
            "faces_detected": len(faces)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def extract_faces_from_photo(image_path):
    """
    Extract ALL faces from an event photo.
    Returns embeddings + confidence for each detected face.
    """
    try:
        if not os.path.exists(image_path):
            return {"success": False, "error": "Image file not found"}

        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": "Could not read image"}

        img = preprocess_image(img)
        faces = app.get(img)

        face_list = []
        for idx, face in enumerate(faces):
            face_list.append({
                "index": idx,
                "embedding": face.embedding.tolist(),
                "confidence": float(face.det_score)
            })

        return {
            "success": True,
            "faces": face_list,
            "faces_detected": len(faces)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def find_matching_photos(selfie_embedding, event_photos):
    """
    Compare selfie embedding with all event photos.

    selfie_embedding: list of floats (512D)
    event_photos: [{ id: str, faces: [{ embedding: [...], confidence: float }] }]
    """
    try:
        user_embedding = np.array(selfie_embedding)
        threshold = 0.40  # Same as your BALANCED test

        matched_photos = []

        for photo in event_photos:
            photo_id = photo.get("id")
            faces = photo.get("faces", [])

            for face_idx, face_data in enumerate(faces):
                if "embedding" not in face_data:
                    continue

                face_embedding = np.array(face_data["embedding"])
                similarity = cosine_similarity(user_embedding, face_embedding)
                distance = 1 - similarity

                if distance < threshold:
                    match_confidence = (1 - distance) * 100.0

                    matched_photos.append({
                        "photo_id": photo_id,
                        "face_index": face_idx + 1,
                        "similarity": float(match_confidence),
                        "distance": float(distance)
                    })

        return {
            "success": True,
            "matched_photos": matched_photos,
            "total_matches": len(matched_photos)
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ========================================================================
# CLI Handler (single JSON line to stdout ONLY)
# ========================================================================

if __name__ == "__main__":
    # NOTE: At this point sys.stdout is redirected to stderr for libraries,
    # but print(json.dumps(...)) below still writes to that object.
    # For Node, we care only about the *captured* stdout from the child process,
    # which is what these prints produce.
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "extract_selfie":
        image_path = sys.argv[2]
        result = extract_face_embedding(image_path)
        print(json.dumps(result))

    elif command == "extract_photo":
        image_path = sys.argv[2]
        result = extract_faces_from_photo(image_path)
        print(json.dumps(result))

    elif command == "match":
        selfie_embedding = json.loads(sys.argv[2])
        event_photos = json.loads(sys.argv[3])
        result = find_matching_photos(selfie_embedding, event_photos)
        print(json.dumps(result))

    else:
        print(json.dumps({"success": False, "error": "Unknown command"}))
