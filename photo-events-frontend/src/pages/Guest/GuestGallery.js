import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { faceAPI } from '../../services/api';

const GuestGallery = () => {
  const { registrationId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await faceAPI.getMatchedPhotos(registrationId);
        const data = res.data?.data || res.data;
        setPhotos(data?.photos || []);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load your photos'
        );
      } finally {
        setLoading(false);
      }
    };

    if (registrationId) load();
  }, [registrationId]);

  if (loading) return <div>Loading your photos…</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Your Event Photos</h1>
      {photos.length === 0 ? (
        <p>We don&apos;t have any photos for you yet. Please check again after the organizer uploads and processes event photos.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {photos.map((photo) => (
            <div key={photo.id}>
              <img src={photo.url || photo.path} alt="" style={{ width: '100%', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestGallery;
