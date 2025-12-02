#!/usr/bin/env python3
"""
Pre-download InsightFace models to avoid timeout during first registration
"""
import sys
import os
from insightface.app import FaceAnalysis

print("📦 Downloading InsightFace models...")
print("This is a one-time setup (~300MB download)")
print("Please wait 2-5 minutes...\n")

try:
    # This will download models to ~/.insightface/models/
    app = FaceAnalysis(
        name='buffalo_l',
        providers=['CPUExecutionProvider']
    )
    
    print("✅ Model downloaded successfully!")
    
    # Prepare the model
    print("📝 Preparing model...")
    app.prepare(ctx_id=-1, det_size=(480, 480))
    
    print("✅ Model ready!")
    print("You can now use face recognition in your app.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check your internet connection")
    print("2. Try: pip install --upgrade insightface")
    sys.exit(1)
