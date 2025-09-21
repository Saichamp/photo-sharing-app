import React, { useState } from 'react';

const PhotoUpload = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedEvent || uploadedFiles.length === 0) {
      alert('Please select an event and choose files to upload');
      return;
    }

    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      alert(`${uploadedFiles.length} photos uploaded successfully!`);
      setUploadedFiles([]);
      setIsUploading(false);
    }, 2000);
  };

  const activeEvents = events.filter(event => event.status === 'active' || event.status === 'upcoming');

  return (
    <div>
      <h2 style={{ color: '#1E2A38', marginBottom: '25px' }}>Upload Event Photos</h2>
      
      {activeEvents.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#8A8A8A'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📸</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1E2A38' }}>No active events</h3>
          <p style={{ margin: 0 }}>Create an active event first to upload photos!</p>
        </div>
      ) : (
        <>
          {/* Event Selection */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px',
              color: '#1E2A38',
              fontWeight: '600'
            }}>
              Select Event *
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '16px',
                background: 'white'
              }}
            >
              <option value="">Choose an event...</option>
              {activeEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div style={{
            border: '2px dashed #DEA193',
            borderRadius: '15px',
            padding: '40px 20px',
            textAlign: 'center',
            marginBottom: '25px',
            background: 'rgba(222, 161, 147, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📸</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1E2A38' }}>
              Drop photos here or click to browse
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#8A8A8A' }}>
              Supports JPG, PNG files. Max 50 photos at once.
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{
                padding: '12px 30px',
                background: 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Selected Files */}
          {uploadedFiles.length > 0 && (
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#1E2A38', marginBottom: '15px' }}>
                Selected Files ({uploadedFiles.length})
              </h4>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                padding: '15px'
              }}>
                {uploadedFiles.map((file, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < uploadedFiles.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <span style={{ color: '#1E2A38' }}>{file.name}</span>
                    <span style={{ color: '#8A8A8A', fontSize: '12px' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedEvent || uploadedFiles.length === 0 || isUploading}
            style={{
              width: '100%',
              padding: '15px 30px',
              background: (!selectedEvent || uploadedFiles.length === 0 || isUploading) 
                ? '#e0e0e0' 
                : 'linear-gradient(135deg, #DEA193 0%, #C8907F 100%)',
              color: (!selectedEvent || uploadedFiles.length === 0 || isUploading) 
                ? '#8A8A8A' 
                : 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (!selectedEvent || uploadedFiles.length === 0 || isUploading) 
                ? 'not-allowed' 
                : 'pointer'
            }}
          >
            {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} Photos`}
          </button>
        </>
      )}
    </div>
  );
};

export default PhotoUpload;
