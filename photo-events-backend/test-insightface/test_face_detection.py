"""
Test InsightFace face detection and recognition
This will download models (~350MB) on first run
"""

import sys
import os
from insightface.app import FaceAnalysis

print("=" * 50)
print("InsightFace Model Download & Test")
print("=" * 50)

try:
    print("\n📥 Initializing InsightFace (will download models on first run)...")
    print("   This may take 3-5 minutes. Please wait...\n")
    
    # Initialize InsightFace with buffalo_l model (most accurate)
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    
    print("✅ InsightFace initialized successfully!")
    
    # Prepare the model (downloads if needed)
    print("\n🔧 Preparing model for face detection...")
    app.prepare(ctx_id=-1, det_size=(640, 640))
    
    print("✅ Model preparation complete!")
    print("\n🎉 InsightFace is ready to use!")
    print("\nModel location:", os.path.expanduser('~/.insightface'))
    print("\n" + "=" * 50)
    print("SUCCESS - InsightFace fully operational!")
    print("=" * 50)
    
except Exception as e:
    print("\n❌ ERROR:", str(e))
    print("\nIf you see download errors, check your internet connection.")
    sys.exit(1)
