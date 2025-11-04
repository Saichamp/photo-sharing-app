import React, { useState } from 'react';
import './FaceRecognitionTest.css';

const FaceRecognitionTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleFaceRecognition = async () => {
    if (!selectedFile) {
      setError('Please select a selfie image first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('selfie', selectedFile);
      formData.append('eventId', 'test-event-123'); // Mock event ID

      // Call your face matching API
      const response = await fetch('http://localhost:5000/api/face-matching/find-photos', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        console.log('🎉 Face recognition completed!', data);
      } else {
        setError(data.error || 'Face recognition failed');
      }
    } catch (err) {
      console.error('❌ Face recognition error:', err);
      setError('Network error - make sure your backend is running');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTest = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="face-recognition-test">
      <div className="test-container">
        <h1>🤖 Face Recognition Test</h1>
        <p>Test your AI-powered face matching system</p>

        {/* File Upload Section */}
        <div className="upload-section">
          <label htmlFor="selfie-upload" className="upload-button">
            📸 Select Selfie Image
          </label>
          <input
            id="selfie-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {previewUrl && (
            <div className="preview-section">
              <img src={previewUrl} alt="Selfie preview" className="preview-image" />
              <p>Selfie ready for processing</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="button-section">
          <button 
            onClick={handleFaceRecognition}
            disabled={!selectedFile || isProcessing}
            className={`process-button ${isProcessing ? 'processing' : ''}`}
          >
            {isProcessing ? '🔄 Processing...' : '🔍 Find My Photos'}
          </button>
          
          {(selectedFile || results) && (
            <button onClick={resetTest} className="reset-button">
              🔄 Reset Test
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-section">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="results-section">
            <h3>✅ {results.message}</h3>
            <div className="stats">
              <div className="stat">
                <strong>Photos Scanned:</strong> {results.totalPhotosScanned}
              </div>
              <div className="stat">
                <strong>Matches Found:</strong> {results.matchesFound}
              </div>
              <div className="stat">
                <strong>Processing Status:</strong> {results.selfieProcessed ? '✅ Success' : '❌ Failed'}
              </div>
            </div>

            {results.matches && results.matches.length > 0 && (
              <div className="matches-section">
                <h4>🎯 Matching Photos:</h4>
                {results.matches.map((match, index) => (
                  <div key={index} className="match-item">
                    <img src={match.imageUrl} alt={`Match ${index + 1}`} className="match-image" />
                    <div className="match-info">
                      <p><strong>Confidence:</strong> {(match.confidence * 100).toFixed(1)}%</p>
                      <p><strong>Photo ID:</strong> {match.photoId}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRecognitionTest;
