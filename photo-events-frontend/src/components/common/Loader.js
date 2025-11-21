import React from 'react';

export const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: '24px',
    md: '40px',
    lg: '60px'
  };

  return (
    <div className="loading-container">
      <div 
        className="loading-spinner" 
        style={{ width: sizes[size], height: sizes[size] }}
      />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};
