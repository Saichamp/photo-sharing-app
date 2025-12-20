import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import '../../styles/Admin.css';

const PhotoManager = () => {
  const { loading, error } = useAdmin(); // photo calls will be added when backend is ready
  const [failedPhotos] = useState([]);

  useEffect(() => {
    // When backend endpoints are ready:
    // (async () => {
    //   const data = await fetchFailedPhotos();
    //   setFailedPhotos(data.photos || []);
    // })();
  }, []);

  const handleRetry = async (photoId) => {
    // await retryPhoto(photoId);
    // reload list after retry
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Photo Manager</h1>
        <p className="admin-page-subtitle">
          Monitor and retry failed photo processing jobs.
        </p>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      <div className="admin-panel-box">
        <div className="admin-panel-header">
          <h3>Failed Photos</h3>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo ID</th>
                <th>Event</th>
                <th>Error</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {failedPhotos.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No failed photos (or backend endpoint not wired yet)
                  </td>
                </tr>
              )}
              {failedPhotos.map((p) => (
                <tr key={p._id}>
                  <td>{p._id}</td>
                  <td>{p.eventName || p.eventId}</td>
                  <td>{p.processingError || 'Unknown error'}</td>
                  <td>
                    {p.uploadedAt
                      ? new Date(p.uploadedAt).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="admin-btn-primary small"
                      onClick={() => handleRetry(p._id)}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <div className="admin-loading">Loading...</div>}
    </div>
  );
};

export default PhotoManager;
