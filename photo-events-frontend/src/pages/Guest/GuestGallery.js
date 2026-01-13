import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { faceAPI } from '../../services/api';
import './GuestGallery.css';

const GuestGallery = () => {
  const { registrationId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ ADDED: selection state
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await faceAPI.getMatchedPhotos(registrationId);
        const data = res.data?.data || res.data;
        console.log('🔍 API Response:', data);
        setPhotos(data?.matches || data?.photos || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your photos');
      } finally {
        setLoading(false);
      }
    };

    if (registrationId) load();
  }, [registrationId]);

  // ✅ ADDED: toggle selection
  const toggleSelect = (id) => {
    setSelectedPhotos(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  // ✅ ADDED: single download
  const downloadSingle = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ ADDED: bulk download (placeholder for zip later)
  const downloadSelected = () => {
    selectedPhotos.forEach(id => {
      const photo = photos.find(
        p => (p.photoId || p.id || p._id) === id
      );
      if (photo) downloadSingle(photo.url || photo.path);
    });
  };

  // ✅ ADDED: clear selection
  const clearSelection = () => setSelectedPhotos([]);

  if (loading) return <div>Loading your photos…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="guest-gallery">

      <h1>Your Event Photos</h1>

      {/* ✅ ADDED: Bulk action bar */}
      {selectedPhotos.length > 0 && (
        <div className="photo-toolbar">
          <span>{selectedPhotos.length} selected</span>
          <button onClick={downloadSelected} className="btn btn-primary">
            Download Selected
          </button>
          <button onClick={clearSelection} className="btn btn-outline">
            Clear
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <p>
          We don&apos;t have any photos for you yet. Please check again after the
          organizer uploads and processes event photos.
        </p>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => {
            const id = photo.photoId || photo.id || photo._id;
            const url = photo.url || photo.path;

            return (
              <div key={id} className="photo-card">

                {/* ✅ ADDED: checkbox */}
                <input
                  type="checkbox"
                  className="photo-checkbox"
                  checked={selectedPhotos.includes(id)}
                  onChange={() => toggleSelect(id)}
                />

                <img src={url} alt="" />

                {/* ✅ ADDED: single download */}
                <button
                  className="photo-download-btn"
                  onClick={() => downloadSingle(url)}
                  title="Download photo"
                >
                  ⬇
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuestGallery;
