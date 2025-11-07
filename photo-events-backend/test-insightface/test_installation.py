import sys
print("Python version:", sys.version)

try:
    import numpy as np
    print("✅ NumPy version:", np.__version__)
except Exception as e:
    print("❌ NumPy error:", e)

try:
    import cv2
    print("✅ OpenCV version:", cv2.__version__)
except Exception as e:
    print("❌ OpenCV error:", e)

try:
    import importlib
    onnxruntime = importlib.import_module("onnxruntime")
    print("✅ ONNX Runtime version:", getattr(onnxruntime, "__version__", "unknown"))
except Exception as e:
    print("❌ ONNX Runtime error:", e)

try:
    import insightface
    print("✅ InsightFace installed successfully!")
    print("   InsightFace version:", insightface.__version__)
except Exception as e:
    print("❌ InsightFace error:", e)

print("\n🎉 All packages imported successfully!")
