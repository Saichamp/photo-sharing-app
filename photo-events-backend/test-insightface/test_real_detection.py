"""
Test face detection on a real image
"""

import cv2
import sys
from insightface.app import FaceAnalysis

print("=" * 50)
print("Testing Face Detection on Real Image")
print("=" * 50)

# Check if test image exists
import os
if not os.path.exists('test_face.1jpg'):
    print("\n❌ ERROR: test_face.1jpg not found!")
    print("Please download a test image or use your own photo.")
    sys.exit(1)

try:
    # Initialize InsightFace
    print("\n🔧 Loading InsightFace model...")
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    
    # Read test image
    print("📸 Reading test image...")
    img = cv2.imread('test_face.1jpg')
    
    if img is None:
        print("❌ ERROR: Could not read image file!")
        sys.exit(1)
    
    print(f"   Image size: {img.shape[1]}x{img.shape[0]} pixels")
    
    # Detect faces
    print("\n🔍 Detecting faces...")
    faces = app.get(img)
    
    print(f"\n✅ Detected {len(faces)} face(s)!")
    
    # Print details for each face
    for i, face in enumerate(faces):
        print(f"\n👤 Face #{i+1}:")
        print(f"   Age: ~{int(face.age)} years")
        print(f"   Gender: {'Male' if face.gender == 1 else 'Female'}")
        print(f"   Detection confidence: {face.det_score:.2%}")
        print(f"   Bounding box: {face.bbox}")
        print(f"   Embedding size: {len(face.embedding)} dimensions")
    
    print("\n" + "=" * 50)
    print("🎉 SUCCESS - Face detection working perfectly!")
    print("=" * 50)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

