#!/usr/bin/env python3
"""
Test if InsightFace is properly installed and can load models
"""
import sys
print("Python version:", sys.version)

try:
    import cv2
    print("✅ OpenCV installed:", cv2.__version__)
except ImportError as e:
    print("❌ OpenCV NOT installed:", e)
    sys.exit(1)

try:
    import numpy as np
    print("✅ NumPy installed:", np.__version__)
except ImportError as e:
    print("❌ NumPy NOT installed:", e)
    sys.exit(1)

try:
    from insightface.app import FaceAnalysis
    print("✅ InsightFace installed")
    
    print("\n📦 Initializing InsightFace model...")
    print("(This may take 1-5 minutes on first run to download models)")
    
    app = FaceAnalysis(
        name='buffalo_l',
        providers=['CPUExecutionProvider']
    )
    app.prepare(ctx_id=-1, det_size=(480, 480))
    
    print("✅ Model loaded successfully!")
    print("Ready for face detection!")
    
except Exception as e:
    print("❌ InsightFace initialization failed:", e)
    print("\nTry running: pip install insightface onnxruntime opencv-python")
    sys.exit(1)
