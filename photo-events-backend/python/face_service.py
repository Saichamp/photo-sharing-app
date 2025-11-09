#!/usr/bin/env python3
"""
Face Recognition Service for PhotoEvents Backend
Fixed: Properly separates stdout (JSON) from stderr (logs)
"""

import sys
import json
import time
import os
import cv2
import numpy as np

# CRITICAL FIX: Redirect InsightFace logs to stderr BEFORE importing
import logging
logging.basicConfig(stream=sys.stderr, level=logging.WARNING)

# Now import InsightFace (its logs will go to stderr)
from insightface.app import FaceAnalysis

class FaceRecognitionService:
    """Singleton service with model caching"""
    
    _instance = None
    _app = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def initialize(self):
        """Initialize InsightFace model (called once)"""
        if self._initialized:
            return
        
        try:
            # Print to stderr (not stdout!)
            print("Initializing InsightFace model...", file=sys.stderr)
            start = time.time()
            
            self._app = FaceAnalysis(
                name='buffalo_l',
                providers=['CPUExecutionProvider']
            )
            self._app.prepare(ctx_id=-1, det_size=(480, 480))
            
            elapsed = time.time() - start
            print(f"Model loaded in {elapsed:.2f}s", file=sys.stderr)
            self._initialized = True
            
        except Exception as e:
            print(f"Model initialization error: {e}", file=sys.stderr)
            raise
    
    def preprocess_image(self, image_path, max_dim=1280):
        """Load and resize image"""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        
        height, width = img.shape[:2]
        if max(height, width) > max_dim:
            scale = max_dim / max(height, width)
            new_size = (int(width * scale), int(height * scale))
            img = cv2.resize(img, new_size, interpolation=cv2.INTER_AREA)
        
        return img
    
    def extract_faces(self, image_path):
        """Extract all face embeddings from image"""
        self.initialize()
        
        img = self.preprocess_image(image_path)
        faces = self._app.get(img)
        
        results = []
        for idx, face in enumerate(faces):
            results.append({
                'faceIndex': idx,
                'embedding': face.embedding.tolist(),
                'boundingBox': face.bbox.tolist(),
                'age': int(face.age),
                'gender': 'M' if face.gender == 1 else 'F',
                'confidence': float(face.det_score)
            })
        
        return results
    
    def compare_embeddings(self, embedding1, embedding2):
        """Compare two face embeddings"""
        emb1 = np.array(embedding1)
        emb2 = np.array(embedding2)
        
        similarity = np.dot(emb1, emb2) / (
            np.linalg.norm(emb1) * np.linalg.norm(emb2)
        )
        distance = 1 - similarity
        
        return {
            'distance': float(distance),
            'similarity': float(similarity),
            'confidence': float((1 - distance) * 100)
        }
    
    def search_faces(self, query_embedding, database, threshold=0.4):
        """Search for matching faces in database"""
        query_emb = np.array(query_embedding)
        matches = []
        
        for item in database:
            db_emb = np.array(item['embedding'])
            
            similarity = np.dot(query_emb, db_emb) / (
                np.linalg.norm(query_emb) * np.linalg.norm(db_emb)
            )
            distance = 1 - similarity
            
            if distance < threshold:
                matches.append({
                    'photoId': item['photoId'],
                    'faceIndex': item['faceIndex'],
                    'distance': float(distance),
                    'confidence': float((1 - distance) * 100),
                    'boundingBox': item.get('boundingBox', [])
                })
        
        matches.sort(key=lambda x: x['distance'])
        return matches


def main():
    """CLI interface for Node.js - ONLY outputs JSON to stdout"""
    if len(sys.argv) < 2:
        # Error messages to stdout as JSON
        print(json.dumps({'success': False, 'error': 'No command specified'}))
        sys.exit(1)
    
    command = sys.argv[1]
    service = FaceRecognitionService()
    
    try:
        if command == 'extract':
            # Extract faces from image
            image_path = sys.argv[2]
            start = time.time()
            
            faces = service.extract_faces(image_path)
            elapsed = time.time() - start
            
            result = {
                'success': True,
                'facesDetected': len(faces),
                'faces': faces,
                'processingTime': round(elapsed, 3)
            }
            
            # CRITICAL: ONLY print JSON to stdout
            print(json.dumps(result), flush=True)
        
        elif command == 'search':
            # Search for face in database
            query_embedding = json.loads(sys.argv[2])
            database = json.loads(sys.argv[3])
            threshold = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4
            
            start = time.time()
            matches = service.search_faces(query_embedding, database, threshold)
            elapsed = time.time() - start
            
            result = {
                'success': True,
                'matchesFound': len(matches),
                'matches': matches,
                'searchTime': round(elapsed, 3)
            }
            
            # CRITICAL: ONLY print JSON to stdout
            print(json.dumps(result), flush=True)
        
        else:
            raise ValueError(f'Unknown command: {command}')
    
    except Exception as e:
        # Log error to stderr
        print(f"Error: {str(e)}", file=sys.stderr)
        
        # Return error as JSON to stdout
        result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(result), flush=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
