"""
Test: Find ONE person across MULTIPLE group photos
Real PhotoEvents scenario:
- User registers with selfie
- Event has 10-100+ group photos
- Find which photos contain this person
- Return ONLY those photos
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis
import sys
import os
import glob

print("=" * 80)
print("PhotoEvents Real Scenario: Search Person Across Multiple Photos")
print("=" * 80)

# Check selfie exists
if not os.path.exists('selfie2.jpg'):
    print("\n❌ ERROR: selfie2.jpg not found!")
    print("Please add the person's SELFIE as 'selfie2.jpg'")
    sys.exit(1)

# Find all group photos
group_photos = glob.glob('group*.jpg')  # group1.jpg, group2.jpg, etc.

if len(group_photos) == 0:
    print("\n❌ ERROR: No group photos found!")
    print("Please add group photos named: group1.jpg, group2.jpg, group3.jpg, etc.")
    print("Make sure the person from selfie appears in SOME (not all) photos")
    sys.exit(1)

print(f"\n📁 Found {len(group_photos)} group photos to search")
for photo in group_photos:
    print(f"   • {photo}")

try:
    # Initialize InsightFace
    print("\n🔧 Loading InsightFace model...")
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    print("✅ Model ready!")
    
    # ========================================================================
    # STEP 1: Process User's SELFIE (Registration)
    # ========================================================================
    print("\n" + "=" * 80)
    print("STEP 1: User Registration - Processing Selfie")
    print("=" * 80)
    
    selfie = cv2.imread('selfie2.jpg')
    if selfie is None:
        print("❌ Could not read selfie2.jpg")
        sys.exit(1)
    
    print("📸 Detecting face in selfie...")
    selfie_faces = app.get(selfie)
    
    if len(selfie_faces) == 0:
        print("❌ No face detected in selfie!")
        sys.exit(1)
    
    # Store user's face embedding (this goes to MongoDB in real app)
    user_embedding = selfie_faces[0].embedding
    user_info = selfie_faces[0]
    
    print(f"✅ User registered successfully!")
    print(f"   Name: John Doe (example)")
    print(f"   Age: ~{int(user_info.age)} years")
    print(f"   Gender: {'Male' if user_info.gender == 1 else 'Female'}")
    print(f"   Embedding: {len(user_embedding)} dimensions")
    print(f"   💾 Stored in database")
    
    # ========================================================================
    # STEP 2: Process ALL Event Photos
    # ========================================================================
    print("\n" + "=" * 80)
    print("STEP 2: Event Photos Upload - Processing All Photos")
    print("=" * 80)
    
    def cosine_similarity(emb1, emb2):
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
    
    threshold = 0.4  # Match threshold
    
    # Track results
    photos_with_user = []
    photos_without_user = []
    total_faces_detected = 0
    
    print(f"\n🔍 Searching for user in {len(group_photos)} photos...")
    print(f"   Match threshold: {threshold}\n")
    
    for photo_path in sorted(group_photos):
        print(f"📸 Processing: {photo_path}")
        
        # Read photo
        img = cv2.imread(photo_path)
        if img is None:
            print(f"   ❌ Could not read {photo_path}")
            continue
        
        # Detect all faces in this photo
        faces = app.get(img)
        total_faces_detected += len(faces)
        print(f"   Detected {len(faces)} face(s) in photo")
        
        if len(faces) == 0:
            photos_without_user.append({
                'photo': photo_path,
                'reason': 'No faces detected'
            })
            print(f"   ⚠️  No faces detected - skipping\n")
            continue
        
        # Compare user embedding with each face in photo
        matches_in_photo = []
        
        for face_idx, face in enumerate(faces):
            face_embedding = face.embedding
            similarity = cosine_similarity(user_embedding, face_embedding)
            distance = 1 - similarity
            
            if distance < threshold:
                # MATCH FOUND!
                matches_in_photo.append({
                    'face_index': face_idx + 1,
                    'distance': distance,
                    'confidence': (1 - distance) * 100,
                    'bbox': face.bbox.tolist(),
                    'age': int(face.age),
                    'gender': 'Male' if face.gender == 1 else 'Female'
                })
        
        # Store result
        if len(matches_in_photo) > 0:
            photos_with_user.append({
                'photo': photo_path,
                'matches': matches_in_photo,
                'total_faces': len(faces)
            })
            print(f"   ✅ USER FOUND! ({len(matches_in_photo)} match(es))")
            for match in matches_in_photo:
                print(f"      Face #{match['face_index']}: Confidence {match['confidence']:.1f}%")
        else:
            photos_without_user.append({
                'photo': photo_path,
                'reason': 'User not in photo',
                'total_faces': len(faces)
            })
            print(f"   ❌ User not found in this photo")
        
        print()  # Blank line
    
    # ========================================================================
    # STEP 3: Final Results & Statistics
    # ========================================================================
    print("=" * 80)
    print("FINAL RESULTS - Photos to Send to User")
    print("=" * 80)
    
    if len(photos_with_user) == 0:
        print("\n❌ User not found in ANY photos!")
        print("\nPossible reasons:")
        print("   • User didn't attend the event")
        print("   • User avoided cameras")
        print("   • Face was obscured/hidden in photos")
        print("   • Poor photo quality")
    else:
        print(f"\n✅ USER FOUND IN {len(photos_with_user)} PHOTO(S)!")
        print("\n📧 Email notification sent:")
        print(f"   'Hi John, You appear in {len(photos_with_user)} photos from the event!'")
        
        print("\n📸 Photos containing user:")
        for result in photos_with_user:
            print(f"\n   {result['photo']}")
            print(f"   • Total faces in photo: {result['total_faces']}")
            print(f"   • User appearances: {len(result['matches'])}")
            for match in result['matches']:
                print(f"      - Face #{match['face_index']}: "
                      f"{match['confidence']:.1f}% match "
                      f"(Age ~{match['age']}, {match['gender']})")
    
    if len(photos_without_user) > 0:
        print(f"\n❌ Photos WITHOUT user: {len(photos_without_user)}")
        for result in photos_without_user:
            reason = result.get('reason', 'User not in photo')
            faces = result.get('total_faces', 0)
            print(f"   • {result['photo']} - {reason} ({faces} faces)")
    
    # ========================================================================
    # STEP 4: Performance Statistics
    # ========================================================================
    print("\n" + "=" * 80)
    print("📊 PERFORMANCE STATISTICS")
    print("=" * 80)
    
    total_photos = len(group_photos)
    photos_processed = len(photos_with_user) + len(photos_without_user)
    match_rate = (len(photos_with_user) / total_photos * 100) if total_photos > 0 else 0
    
    print(f"\n   Total photos processed: {photos_processed}")
    print(f"   Photos with user: {len(photos_with_user)}")
    print(f"   Photos without user: {len(photos_without_user)}")
    print(f"   Total faces detected: {total_faces_detected}")
    print(f"   User appearance rate: {match_rate:.1f}%")
    
    # Simulate what happens in your app
    print("\n" + "=" * 80)
    print("🎯 YOUR APP WORKFLOW")
    print("=" * 80)
    
    print("\n1️⃣  Database Operations:")
    print(f"   • Store user selfie embedding in MongoDB")
    print(f"   • Store {total_photos} event photos with face data")
    print(f"   • Create index on embeddings for fast search")
    
    print("\n2️⃣  API Response (to frontend):")
    print(f"   {{")
    print(f"     'user': 'John Doe',")
    print(f"     'photos_found': {len(photos_with_user)},")
    print(f"     'photos': [")
    for result in photos_with_user:
        print(f"       {{")
        print(f"         'photo_url': '/uploads/photos/{result['photo']}',")
        print(f"         'matches': {len(result['matches'])},")
        print(f"         'confidence': {result['matches'][0]['confidence']:.1f}%")
        print(f"       }},")
    print(f"     ]")
    print(f"   }}")
    
    print("\n3️⃣  Email Notification:")
    print(f"   To: john@example.com")
    print(f"   Subject: You appear in {len(photos_with_user)} event photos!")
    print(f"   Body: Click here to view and download your photos")
    
    print("\n" + "=" * 80)
    print("✅ Test Complete!")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
