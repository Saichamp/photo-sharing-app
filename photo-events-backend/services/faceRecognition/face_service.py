#!/usr/bin/env python3
"""
Face Recognition Service - Persistent Server Mode + CLI
Loads model ONCE and keeps it in memory
"""

import sys
import json
import cv2
import numpy as np
import os

# ✅ GLOBAL model variable (loads once, reuses forever)
_face_app = None

def get_face_app():
    """Get or initialize the face recognition model (singleton)"""
    global _face_app
    
    if _face_app is None:
        print("[Python] Loading InsightFace buffalo_l model...", file=sys.stderr, flush=True)
        
        from insightface.app import FaceAnalysis
        
        _face_app = FaceAnalysis(
            name='buffalo_l',
            providers=['CPUExecutionProvider']
        )
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))
        
        print("[Python] Model loaded successfully!", file=sys.stderr, flush=True)
    
    return _face_app

def extract_selfie(image_path):
    """Extract face embedding from a selfie"""
    try:
        app = get_face_app()
        
        if not os.path.exists(image_path):
            return {'success': False, 'error': f'Image not found: {image_path}'}
        
        img = cv2.imread(image_path)
        if img is None:
            return {'success': False, 'error': 'Could not read image'}
        
        faces = app.get(img)
        
        if len(faces) == 0:
            return {'success': False, 'error': 'No face detected in selfie'}
        
        if len(faces) > 1:
            return {
                'success': False,
                'error': 'Multiple faces detected. Please use a clear selfie with only one person.'
            }
        
        face = faces[0]
        
        return {
            'success': True,
            'embedding': face.embedding.tolist(),
            'face_detected': True,
            'confidence': float(face.det_score),
            'age': int(face.age),
            'gender': 'M' if int(face.gender) == 1 else 'F'
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def extract_photo(image_path):
    """Extract all faces from an event photo"""
    try:
        app = get_face_app()
        
        if not os.path.exists(image_path):
            return {'success': False, 'error': f'Image not found: {image_path}'}
        
        img = cv2.imread(image_path)
        if img is None:
            return {'success': False, 'error': 'Could not read image'}
        
        faces = app.get(img)
        faces_data = []
        
        for idx, face in enumerate(faces):
            faces_data.append({
                'faceIndex': idx,
                'embedding': face.embedding.tolist(),
                'boundingBox': face.bbox.tolist(),
                'confidence': float(face.det_score),
                'age': int(face.age),
                'gender': 'M' if int(face.gender) == 1 else 'F',
            })
        
        return {
            'success': True,
            'faces': faces_data,
            'faces_detected': len(faces_data)
        }
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def extract_embedding(image_path):
    """Alias for extract_selfie"""
    return extract_selfie(image_path)

def cosine_similarity(emb1, emb2):
    """Calculate cosine similarity"""
    emb1 = np.array(emb1)
    emb2 = np.array(emb2)
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

def match_faces(user_embedding, event_photos, threshold=0.6):
    """Find matching faces"""
    matched_photos = []
    total_faces_searched = 0
    
    for photo in event_photos:
        photo_id = photo['id']
        faces = photo.get('faces', [])
        
        for face_idx, face in enumerate(faces):
            total_faces_searched += 1
            face_embedding = face.get('embedding')
            
            if not face_embedding:
                continue
            
            similarity = cosine_similarity(user_embedding, face_embedding)
            distance = 1 - similarity
            
            if distance < threshold:
                matched_photos.append({
                    'photo_id': photo_id,
                    'face_index': face_idx,
                    'similarity': float(similarity),
                    'distance': float(distance),
                    'confidence': float(similarity * 100),
                })
    
    return {
        'success': True,
        'matched_photos': matched_photos,
        'total_matches': len(matched_photos),
        'total_faces_searched': total_faces_searched,
    }

def match_from_file(file_path):
    """Load match data from file and process"""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        user_embedding = data['user_embedding']
        event_photos = data['event_photos']
        threshold = data.get('threshold', 0.6)
        
        result = match_faces(user_embedding, event_photos, threshold)
        
        # Cleanup temp file
        try:
            os.remove(file_path)
        except:
            pass
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': f'File matching error: {str(e)}'}

def server_mode():
    """
    ✅ NEW: Persistent server mode
    Reads JSON requests from stdin, returns JSON responses
    Model stays loaded between requests
    """
    print("[Python] Starting server mode...", file=sys.stderr, flush=True)
    
    # Pre-load model
    get_face_app()
    print("[Python] Server ready to accept requests", file=sys.stderr, flush=True)
    
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            request = json.loads(line)
            request_id = request.get('requestId')
            command = request.get('command')
            args = request.get('args', [])
            
            # Execute command
            if command == 'extract_selfie':
                result = extract_selfie(args[0])
            elif command == 'extract_photo':
                result = extract_photo(args[0])
            elif command == 'extract_embedding':
                result = extract_embedding(args[0])
            elif command == 'match_from_file':
                result = match_from_file(args[0])
            else:
                result = {'success': False, 'error': f'Unknown command: {command}'}
            
            # Send response
            response = {
                'requestId': request_id,
                'result': result
            }
            print(json.dumps(response), flush=True)
            
        except Exception as e:
            error_response = {
                'requestId': request.get('requestId', 0),
                'result': {'success': False, 'error': str(e)}
            }
            print(json.dumps(error_response), flush=True)

def main():
    """CLI interface"""
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'No command provided'}), flush=True)
        sys.exit(1)
    
    command = sys.argv[1]
    
    # ✅ NEW: Server mode
    if command == 'server':
        server_mode()
        return
    
    # Original CLI commands
    try:
        if command == 'extract_selfie':
            if len(sys.argv) < 3:
                result = {'success': False, 'error': 'Image path required'}
            else:
                result = extract_selfie(sys.argv[2])
        
        elif command == 'extract_photo':
            if len(sys.argv) < 3:
                result = {'success': False, 'error': 'Image path required'}
            else:
                result = extract_photo(sys.argv[2])
        
        elif command == 'extract_embedding':
            if len(sys.argv) < 3:
                result = {'success': False, 'error': 'Image path required'}
            else:
                result = extract_embedding(sys.argv[2])
        
        elif command == 'match':
            if len(sys.argv) < 4:
                result = {'success': False, 'error': 'Embedding and photos required'}
            else:
                user_embedding = json.loads(sys.argv[2])
                event_photos = json.loads(sys.argv[3])
                result = match_faces(user_embedding, event_photos)
        
        elif command == 'match_from_file':
            if len(sys.argv) < 3:
                result = {'success': False, 'error': 'File path required'}
            else:
                result = match_from_file(sys.argv[2])
        
        else:
            result = {'success': False, 'error': f'Unknown command: {command}'}
        
        print(json.dumps(result), flush=True)
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}), flush=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
