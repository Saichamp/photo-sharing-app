import sys
import json
import numpy as np

def cosine_similarity(emb1, emb2):
    """Calculate cosine similarity between two embeddings"""
    emb1 = np.array(emb1)
    emb2 = np.array(emb2)
    return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

def find_matches(user_embedding, event_photos, threshold=0.4):
    """Find photos containing the user based on face embedding similarity"""
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
            
            # Calculate similarity
            similarity = cosine_similarity(user_embedding, face_embedding)
            distance = 1 - similarity
            
            # If match found
            if distance < threshold:
                matched_photos.append({
                    'photo_id': photo_id,
                    'face_index': face_idx,
                    'similarity': float(similarity),
                    'distance': float(distance),
                    'confidence': float(similarity * 100)
                })
    
    return {
        'success': True,
        'matched_photos': matched_photos,
        'total_matches': len(matched_photos),
        'total_faces_searched': total_faces_searched
    }

if __name__ == '__main__':
    try:
        # Read input file path from command line
        input_file = sys.argv[1]
        
        # Load data from file
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        user_embedding = data['user_embedding']
        event_photos = data['event_photos']
        
        # Perform matching
        result = find_matches(user_embedding, event_photos)
        
        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)
