/**
 * Node.js Wrapper for Python Face Recognition Service
 */
const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../../utils/logger');

const PYTHON_SCRIPT = path.join(__dirname, 'face_service.py');

function runPythonCommand(command, args) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [PYTHON_SCRIPT, command, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log Python print statements (like model loading)
      console.log('[Python]', data.toString().trim());
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        logger.error('Python script error', { stderr, code });
        reject(new Error(`Python script failed: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        logger.error('Failed to parse Python output', { stdout, err });
        reject(new Error('Invalid Python output'));
      }
    });
  });
}

async function extractFaceFromSelfie(imagePath) {
  try {
    logger.info('Extracting face from selfie', { imagePath });
    const result = await runPythonCommand('extract_selfie', [imagePath]);
    
    if (!result.success) {
      logger.warn('Face extraction failed', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('extractFaceFromSelfie error', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function extractFaces(imagePath) {
  try {
    logger.info('Extracting faces from photo', { imagePath });
    const result = await runPythonCommand('extract_photo', [imagePath]);
    
    if (!result.success) {
      logger.warn('Face extraction failed', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('extractFaces error', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function findMatchingPhotos(selfieEmbedding, eventPhotos) {
  try {
    logger.info('Finding matching photos', { totalPhotos: eventPhotos.length });
    
    const result = await runPythonCommand('match', [
      JSON.stringify(selfieEmbedding),
      JSON.stringify(eventPhotos)
    ]);
    
    if (!result.success) {
      logger.warn('Matching failed', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('findMatchingPhotos error', { error: error.message });
    return { success: false, error: error.message };
  }
}

module.exports = {
  extractFaceFromSelfie,
  extractFaces,
  findMatchingPhotos
};
