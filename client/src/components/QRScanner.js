/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScanSuccess }) => {
  const videoRef = useRef(null);
  const qrBoxRef = useRef(null);
  const scannerRef = useRef(null);
  const [qrOn, setQrOn] = useState(true);
  const [scannedResult, setScannedResult] = useState('');

  const onScanSuccessHandler = (result) => {
    console.log('QR Scanned:', result);
    setScannedResult(result?.data || result);
    setTimeout(() => {
      onScanSuccess(result?.data || result);
    }, 1000);
  };

  const onScanFail = (err) => {
    console.log('QR Scan Error:', err);
  };

  useEffect(() => {
    if (videoRef?.current && !scannerRef.current) {
      scannerRef.current = new QrScanner(
        videoRef?.current,
        onScanSuccessHandler,
        {
          onDecodeError: onScanFail,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: qrBoxRef?.current || undefined,
        }
      );

      scannerRef?.current
        ?.start()
        .then(() => setQrOn(true))
        .catch((err) => {
          if (err) setQrOn(false);
        });
    }

    return () => {
      if (scannerRef?.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!qrOn)
      alert(
        'Camera is blocked or not accessible. Please allow camera in your browser permissions and reload.'
      );
  }, [qrOn]);

  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1E2A38' }}>
        Scan QR Code
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '30px', color: '#8A8A8A' }}>
        Point your camera at the event QR code
      </p>
      
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '300px',
        borderRadius: '15px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <video 
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <div 
          ref={qrBoxRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200px',
            height: '200px',
            border: '3px solid #DEA193',
            borderRadius: '15px',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        />
      </div>

      {scannedResult && (
        <div style={{
          background: '#2AC4A0',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          ✓ QR Code Detected! Proceeding...
        </div>
      )}

      <button 
        className="btn-primary" 
        onClick={() => onScanSuccess('demo-event-123')}
      >
        Demo: Skip QR Scan
      </button>
    </div>
  );
};

export default QRScanner;
