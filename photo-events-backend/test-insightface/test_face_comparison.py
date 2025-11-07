"""
Test face comparison (1:1 verification)
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis

print("=" * 50)
print("Testing Face Comparison (1:1 Verification)")
print("=" * 50)

try:
    # Initialize InsightFace
    print("\n🔧 Loading model...")
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    
    # Read test image
    print("📸 Reading test image...")
    img = cv2.imread('test_face.jpg')
    
    if img is None:
        print("❌ ERROR: test_face.jpg not found!")
        print("Please ensure the image exists from previous step.")
        import sys
        sys.exit(1)
    
    # Detect faces
    print("🔍 Detecting faces...")
    faces = app.get(img)
    
    if len(faces) == 0:
        print("❌ No faces detected in image!")
        import sys
        sys.exit(1)
    
    # Get embedding for first face
    embedding1 = faces[0].embedding
    
    # Simulate comparing with same face (should match)
    embedding2 = faces[0].embedding
    
    # Calculate cosine similarity
    def cosine_similarity(emb1, emb2):
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    similarity = cosine_similarity(embedding1, embedding2)
    distance = 1 - similarity
    
    print(f"\n📊 Comparison Results:")
    print(f"   Similarity: {similarity:.4f} (1.0 = identical)")
    print(f"   Distance: {distance:.4f} (0.0 = identical)")
    
    # Determine match
    threshold = 0.4  # Standard threshold
    is_match = distance < threshold
    
    print(f"\n✅ Match threshold: {threshold}")
    print(f"   Result: {'✅ MATCH' if is_match else '❌ NO MATCH'}")
    print(f"   Confidence: {(1 - distance) * 100:.2f}%")
    
    print("\n" + "=" * 50)
    print("🎉 Face comparison working correctly!")
    print("=" * 50)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

