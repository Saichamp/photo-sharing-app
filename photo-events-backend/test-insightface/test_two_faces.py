"""
PROPER Test: Compare TWO different faces
This will show if InsightFace can distinguish between different people
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis
import sys
import os

print("=" * 60)
print("Testing Face Comparison with TWO Different Images")
print("=" * 60)

# Check if both images exist
if not os.path.exists('face4.jpg'):
    print("\n❌ ERROR: face4.jpg not found!")
    print("Please add face4.jpg to test-insightface folder")
    sys.exit(1)

if not os.path.exists('face2.jpg'):
    print("\n❌ ERROR: face2.jpg not found!")
    print("Please add face2.jpg to test-insightface folder")
    sys.exit(1)

try:
    # Initialize InsightFace
    print("\n🔧 Loading InsightFace model...")
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    print("✅ Model loaded successfully!")
    
    # Read first image
    print("\n📸 Reading first image (face4.jpg)...")
    img1 = cv2.imread('face4.jpg')
    if img1 is None:
        print("❌ ERROR: Could not read face4.jpg")
        sys.exit(1)
    
    # Read second image
    print("📸 Reading second image (face2.jpg)...")
    img2 = cv2.imread('face2.jpg')
    if img2 is None:
        print("❌ ERROR: Could not read face2.jpg")
        sys.exit(1)
    
    # Detect faces in first image
    print("\n🔍 Detecting face in first image...")
    faces1 = app.get(img1)
    if len(faces1) == 0:
        print("❌ No face detected in face4.jpg!")
        sys.exit(1)
    print(f"✅ Detected {len(faces1)} face(s)")
    
    # Detect faces in second image
    print("🔍 Detecting face in second image...")
    faces2 = app.get(img2)
    if len(faces2) == 0:
        print("❌ No face detected in face2.jpg!")
        sys.exit(1)
    print(f"✅ Detected {len(faces2)} face(s)")
    
    # Get embeddings
    embedding1 = faces1[0].embedding
    embedding2 = faces2[0].embedding
    
    print(f"\n📊 Embedding Information:")
    print(f"   Embedding 1 size: {len(embedding1)} dimensions")
    print(f"   Embedding 2 size: {len(embedding2)} dimensions")
    
    # Calculate cosine similarity
    def cosine_similarity(emb1, emb2):
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    similarity = cosine_similarity(embedding1, embedding2)
    distance = 1 - similarity
    
    print(f"\n🔬 Comparison Results:")
    print(f"   Cosine Similarity: {similarity:.4f}")
    print(f"   Distance: {distance:.4f}")
    print(f"   (Lower distance = more similar faces)")
    
    # Standard thresholds
    threshold_strict = 0.3   # Very strict (99.9% sure)
    threshold_normal = 0.4   # Normal (industry standard)
    threshold_loose = 0.6    # Loose (allow some variance)
    
    print(f"\n✅ Threshold Analysis:")
    print(f"   Strict (0.3):  {'✅ MATCH' if distance < threshold_strict else '❌ NO MATCH'}")
    print(f"   Normal (0.4):  {'✅ MATCH' if distance < threshold_normal else '❌ NO MATCH'} ⭐ Recommended")
    print(f"   Loose (0.6):   {'✅ MATCH' if distance < threshold_loose else '❌ NO MATCH'}")
    
    # Determine final result with normal threshold
    is_match = distance < threshold_normal
    confidence = (1 - distance) * 100
    
    print(f"\n🎯 FINAL RESULT (Normal threshold):")
    if is_match:
        print(f"   ✅ SAME PERSON")
        print(f"   Confidence: {confidence:.2f}%")
    else:
        print(f"   ❌ DIFFERENT PEOPLE")
        print(f"   Confidence: {confidence:.2f}%")
    
    # Explain the result
    print(f"\n💡 Interpretation:")
    if distance < 0.2:
        print("   Very similar faces - likely same person or twins")
    elif distance < 0.4:
        print("   Similar faces - same person with different conditions")
    elif distance < 0.6:
        print("   Somewhat similar - could be same person with major changes")
    else:
        print("   Very different faces - definitely different people")
    
    print("\n" + "=" * 60)
    print("✅ Test Complete!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
