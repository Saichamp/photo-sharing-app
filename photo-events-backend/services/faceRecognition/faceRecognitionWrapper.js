/**
 * Node.js Wrapper for Python Face Recognition Service
 * Uses PERSISTENT Python process with model caching
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { logger } = require('../../utils/logger');

const PYTHON_SCRIPT = path.join(__dirname, 'face_service.py');
const PYTHON_TIMEOUT = 120000; // 120 seconds for first load

// ✅ PERSISTENT Python process
let pythonProcess = null;
let pythonReady = false;
let pendingRequests = new Map();
let requestId = 0;

/**
 * Start persistent Python process
 */
function startPythonProcess() {
  if (pythonProcess) {
    return pythonProcess;
  }

  logger.info('Starting persistent Python process');
  
  pythonProcess = spawn('python', [PYTHON_SCRIPT, 'server'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stderrBuffer = '';

 pythonProcess.stderr.on('data', (data) => {
  const message = data.toString();
  stderrBuffer += message;
  
  // ✅ Only log important messages (ignore InsightFace debug spam)
  if (message.includes('Model loaded') || 
      message.includes('Error') || 
      message.includes('Exception') ||
      message.includes('WARNING')) {
    console.log('[Python]', message.trim());
  }
  
  if (message.includes('Model loaded successfully')) {
    pythonReady = true;
    logger.info('Python model ready');
  }
});
  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const response = JSON.parse(line);
        const reqId = response.requestId;
        
        if (pendingRequests.has(reqId)) {
          const { resolve } = pendingRequests.get(reqId);
          pendingRequests.delete(reqId);
          resolve(response.result);
        }
      } catch (err) {
        logger.error('Failed to parse Python response', { line });
      }
    }
  });

  pythonProcess.on('close', (code) => {
    logger.warn('Python process closed', { code });
    pythonProcess = null;
    pythonReady = false;
    
    // Reject all pending requests
    for (const [reqId, { reject }] of pendingRequests.entries()) {
      reject(new Error('Python process died'));
    }
    pendingRequests.clear();
  });

  pythonProcess.on('error', (err) => {
    logger.error('Python process error', { err });
    pythonProcess = null;
    pythonReady = false;
  });

  return pythonProcess;
}

/**
 * Send command to persistent Python process
 */
function runPythonCommand(command, args, timeout = PYTHON_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const process = startPythonProcess();
    
    const reqId = ++requestId;
    const timeoutHandle = setTimeout(() => {
      if (pendingRequests.has(reqId)) {
        pendingRequests.delete(reqId);
        reject(new Error(`Python command timed out after ${timeout}ms`));
      }
    }, timeout);

    pendingRequests.set(reqId, { 
      resolve: (result) => {
        clearTimeout(timeoutHandle);
        resolve(result);
      },
      reject: (err) => {
        clearTimeout(timeoutHandle);
        reject(err);
      }
    });

    const request = {
      requestId: reqId,
      command,
      args
    };

    process.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Extract face from selfie
 */
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

/**
 * Extract all faces from photo
 */
async function extractFaces(imagePath) {
  try {
    logger.info('Extracting faces from photo', { imagePath });
    const result = await runPythonCommand('extract_photo', [imagePath], PYTHON_TIMEOUT);
    
    if (!result.success) {
      logger.warn('Face extraction failed', { error: result.error });
    } else {
      logger.info('Faces extracted', { 
        faces: result.faces_detected,
        file: path.basename(imagePath)
      });
    }

    return result;
  } catch (error) {
    logger.error('extractFaces error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Find matching photos
 */
async function findMatchingPhotos(selfieEmbedding, eventPhotos) {
  let tempFile = null;

  try {
    logger.info('Finding matching photos', { totalPhotos: eventPhotos.length });

    const tempDir = path.join(__dirname, '../../temp');
    await fs.ensureDir(tempDir);

    tempFile = path.join(tempDir, `match-input-${Date.now()}.json`);

    const inputData = {
      user_embedding: selfieEmbedding,
      event_photos: eventPhotos,
      threshold: 0.6
    };

    await fs.writeJson(tempFile, inputData);

    const timeout = 60000 + (eventPhotos.length * 100);
    const result = await runPythonCommand('match_from_file', [tempFile], timeout);

    if (!result.success) {
      logger.warn('Matching failed', { error: result.error });
    } else {
      logger.info('Matching completed', {
        matches: result.total_matches || 0,
        faces_searched: result.total_faces_searched || 0,
      });
    }

    return result;

  } catch (error) {
    logger.error('findMatchingPhotos error', { error: error.message });
    return { success: false, error: error.message };
    
  } finally {
    if (tempFile) {
      await fs.remove(tempFile).catch((err) => {
        logger.warn('Failed to delete temp file', { tempFile, error: err.message });
      });
    }
  }
}

/**
 * Extract face embedding (alias)
 */
async function extractFaceEmbedding(imagePath) {
  try {
    logger.info('Extracting face embedding', { imagePath });
    const result = await runPythonCommand('extract_embedding', [imagePath]);

    if (!result.success) {
      logger.warn('Embedding extraction failed', { error: result.error });
    }

    return result;
  } catch (error) {
    logger.error('extractFaceEmbedding error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Get model status
 */
function getModelStatus() {
  return {
    loaded: pythonReady,
    model: 'buffalo_l',
    processActive: pythonProcess !== null
  };
}

/**
 * Cleanup on shutdown
 */
process.on('SIGINT', () => {
  if (pythonProcess) {
    logger.info('Shutting down Python process');
    pythonProcess.kill();
  }
});

module.exports = {
  extractFaceFromSelfie,
  extractFaces,
  findMatchingPhotos,
  extractFaceEmbedding,
  getModelStatus
};
