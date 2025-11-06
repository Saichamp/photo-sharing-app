// Calculate Euclidean distance between two vectors
const euclideanDistance = (vec1, vec2) => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  
  return Math.sqrt(sum);
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vec1, vec2) => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  return dotProduct / (mag1 * mag2);
};

// Generate unique QR code
const generateQRCode = (eventName) => {
  const timestamp = Date.now();
  const cleanName = eventName.toLowerCase().replace(/\s+/g, '-');
  return `event-${cleanName}-${timestamp}`;
};

module.exports = {
  euclideanDistance,
  cosineSimilarity,
  generateQRCode
};
