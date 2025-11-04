import sys
import json
import cv2
import numpy as np
from deepface import DeepFace
import base64
from io import BytesIO
from PIL import Image

def extract_face_embedding(image_path):
    """Extract face embedding from image using ArcFace model"""
    try:
        # Use ArcFace model for high accuracy
        embedding = DeepFace.represent(
            img_path=image_path,
            model_name='ArcFace',
            enforce_detection=False  # Handle blurry images
        )
        
        return {
            'success': True,
            'embedding': embedding[0]['embedding'],
            'confidence': 0.95
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def compare_faces(reference_embedding, target_embedding):
    """Compare two face embeddings and return similarity score"""
    try:
        # Calculate cosine similarity
        ref_array = np.array(reference_embedding)
        target_array = np.array(target_embedding)
        
        # Normalize vectors
        ref_norm = ref_array / np.linalg.norm(ref_array)
        target_norm = target_array / np.linalg.norm(target_array)
        
        # Calculate similarity (0-1, higher is more similar)
        similarity = np.dot(ref_norm, target_norm)
        
        return {
            'success': True,
            'similarity': float(similarity),
            'is_match': similarity > 0.6  # Threshold for match
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No command provided'}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'extract':
        image_path = sys.argv[2]
        result = extract_face_embedding(image_path)
        print(json.dumps(result))
    
    elif command == 'compare':
        ref_embedding = json.loads(sys.argv[2])
        target_embedding = json.loads(sys.argv[3])
        result = compare_faces(ref_embedding, target_embedding)
        print(json.dumps(result))
