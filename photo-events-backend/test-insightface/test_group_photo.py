"""
Test: Find person from SELFIE in GROUP PHOTO
This simulates your PhotoEvents app workflow:
1. User registers with selfie
2. Event has group photos
3. Find user in group photos
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis
import sys
import os

print("=" * 70)
print("Testing: Find Person from Selfie in Group Photo")
print("This is EXACTLY how your PhotoEvents app will work!")
print("=" * 70)

# Check files
if not os.path.exists('selfie.jpg'):
    print("\n❌ ERROR: selfie.jpg not found!")
    print("Please add a SELFIE photo and name it 'selfie.jpg'")
    sys.exit(1)

if not os.path.exists('group.jpg'):
    print("\n❌ ERROR: group.jpg not found!")
    print("Please add a GROUP PHOTO and name it 'group.jpg'")
    print("Make sure the person from selfie.jpg is IN the group photo!")
    sys.exit(1)

try:
    # Initialize InsightFace
    print("\n🔧 Loading InsightFace model...")
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    print("✅ Model loaded!")
    
    # STEP 1: Process SELFIE (Registration photo)
    print("\n" + "=" * 70)
    print("STEP 1: Processing SELFIE (User Registration)")
    print("=" * 70)
    
    selfie = cv2.imread('selfie.jpg')
    if selfie is None:
        print("❌ Could not read selfie.jpg")
        sys.exit(1)
    
    print("📸 Detecting face in selfie...")
    selfie_faces = app.get(selfie)
    
    if len(selfie_faces) == 0:
        print("❌ No face detected in selfie!")
        print("Please use a clear selfie with visible face")
        sys.exit(1)
    
    print(f"✅ Detected {len(selfie_faces)} face(s) in selfie")
    
    # Get selfie embedding (this is what we store in database)
    selfie_embedding = selfie_faces[0].embedding
    selfie_person = selfie_faces[0]
    
    print(f"\n👤 Selfie Analysis:")
    print(f"   Estimated Age: ~{int(selfie_person.age)} years")
    print(f"   Gender: {'Male' if selfie_person.gender == 1 else 'Female'}")
    print(f"   Detection Confidence: {selfie_person.det_score:.2%}")
    print(f"   Embedding: {len(selfie_embedding)} dimensions")
    print(f"   ✅ Stored in database (simulated)")
    
    # STEP 2: Process GROUP PHOTO (Event photos)
    print("\n" + "=" * 70)
    print("STEP 2: Processing GROUP PHOTO (Event Photos)")
    print("=" * 70)
    
    group_photo = cv2.imread('group.jpg')
    if group_photo is None:
        print("❌ Could not read group.jpg")
        sys.exit(1)
    
    print("📸 Detecting ALL faces in group photo...")
    group_faces = app.get(group_photo)
    
    print(f"✅ Detected {len(group_faces)} face(s) in group photo!")
    
    if len(group_faces) == 0:
        print("❌ No faces detected in group photo!")
        sys.exit(1)
    
    # Show all detected faces
    print(f"\n👥 All Detected Faces:")
    for i, face in enumerate(group_faces):
        print(f"   Face #{i+1}: Age ~{int(face.age)}, "
              f"Gender: {'M' if face.gender == 1 else 'F'}, "
              f"Confidence: {face.det_score:.2%}")
    
    # STEP 3: Compare selfie with EACH face in group
    print("\n" + "=" * 70)
    print("STEP 3: Finding Selfie Person in Group Photo")
    print("=" * 70)
    
    def cosine_similarity(emb1, emb2):
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    matches = []
    threshold = 0.4  # Standard matching threshold
    
    print(f"\n🔍 Comparing selfie against {len(group_faces)} faces...")
    print(f"   Threshold: {threshold} (lower distance = better match)\n")
    
    for i, group_face in enumerate(group_faces):
        group_embedding = group_face.embedding
        similarity = cosine_similarity(selfie_embedding, group_embedding)
        distance = 1 - similarity
        
        is_match = distance < threshold
        
        print(f"   Face #{i+1}: Distance = {distance:.4f} ", end="")
        
        if is_match:
            print("✅ MATCH FOUND!")
            matches.append({
                'face_index': i + 1,
                'distance': distance,
                'confidence': (1 - distance) * 100,
                'bbox': group_face.bbox,
                'age': int(group_face.age),
                'gender': 'Male' if group_face.gender == 1 else 'Female'
            })
        else:
            print("❌ No match")
    
    # STEP 4: Display Results
    print("\n" + "=" * 70)
    print("FINAL RESULTS")
    print("=" * 70)
    
    if len(matches) == 0:
        print("\n❌ PERSON NOT FOUND in group photo!")
        print("\nPossible reasons:")
        print("   • Different person in selfie vs group photo")
        print("   • Face too small/blurry in group photo")
        print("   • Face partially hidden/obscured")
        print("   • Poor lighting in one of the photos")
    else:
        print(f"\n✅ FOUND {len(matches)} MATCHING FACE(S)!")
        
        for match in matches:
            print(f"\n🎯 Match #{matches.index(match) + 1}:")
            print(f"   Face Index: #{match['face_index']}")
            print(f"   Match Confidence: {match['confidence']:.2f}%")
            print(f"   Distance: {match['distance']:.4f}")
            print(f"   Estimated Age: ~{match['age']} years")
            print(f"   Gender: {match['gender']}")
            print(f"   Bounding Box: {match['bbox']}")
        
        print("\n📸 In your PhotoEvents app:")
        print("   ✅ This group photo will be sent to user")
        print("   ✅ Face will be highlighted in the photo")
        print("   ✅ User gets email: 'You appear in 1 photo!'")
    
    print("\n" + "=" * 70)
    print("🎉 Test Complete!")
    print("=" * 70)
    
    # Statistics
    print(f"\n📊 Statistics:")
    print(f"   Total faces in group: {len(group_faces)}")
    print(f"   Matches found: {len(matches)}")
    print(f"   Match rate: {(len(matches)/len(group_faces)*100) if len(group_faces) > 0 else 0:.1f}%")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
