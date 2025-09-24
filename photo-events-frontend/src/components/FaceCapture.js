import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';

const FaceCapture = ({ onCapture, onBack }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoConstraints = {
    width: 300,
    height: 300,
    facingMode: "user"
  };

  const capturePhoto = useCallback(() => {
    setIsCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    
    setTimeout(() => {
      setIsCapturing(false);
      onCapture(imageSrc);
    }, 1500); // Show captured image for 1.5 seconds
  }, [webcamRef, onCapture]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1E2A38' }}>
        Capture Your Face
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#8A8A8A' }}>
        We'll use this to identify you in event photos
      </p>
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        <div style={{
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '4px solid #DEA193',
          position: 'relative',
          background: '#f0f0f0'
        }}>
          {!capturedImage ? (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured face"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
          
          {/* Camera overlay guide */}
          {!capturedImage && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '250px',
              border: '2px dashed rgba(222, 161, 147, 0.5)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              pointerEvents: 'none'
            }} />
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(222, 161, 147, 0.1)',
        borderRadius: '10px',
        border: '1px solid rgba(222, 161, 147, 0.3)'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#1E2A38' }}>
          📸 Position your face in the center and click capture
        </p>
      </div>

      {isCapturing && (
        <div style={{
          background: '#2AC4A0',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          ✓ Photo Captured! Processing...
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        
        {!capturedImage ? (
          <button 
            className="btn-primary" 
            onClick={capturePhoto}
            style={{ flex: 1 }}
            disabled={isCapturing}
          >
            {isCapturing ? 'Processing...' : '📸 Capture Photo'}
          </button>
        ) : (
          <button 
            className="btn-primary" 
            onClick={retakePhoto}
            style={{ flex: 1 }}
          >
            🔄 Retake Photo
          </button>
        )}
      </div>
    </div>
  );
};

export default FaceCapture;
