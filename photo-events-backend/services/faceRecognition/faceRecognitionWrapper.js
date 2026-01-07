/**
 * Node.js Wrapper for Python Face Recognition Service (buffalo_l)
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { logger } = require('../../utils/logger');

const PYTHON_SCRIPT = path.join(__dirname, 'face_service.py');
const PYTHON_TIMEOUT = 300000; // ✅ Increased to 5 minutes (300 seconds)

function runPythonCommand(command, args) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [PYTHON_SCRIPT, command, ...args]);

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // ✅ Add timeout handler
    const timeout = setTimeout(() => {
      timedOut = true;
      python.kill();
      reject(new Error(`Python command timed out after ${PYTHON_TIMEOUT}ms`));
    }, PYTHON_TIMEOUT);

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log Python messages (model loading, etc.)
      console.log('[Python]', data.toString().trim());
    });

    python.on('close', (code) => {
      clearTimeout(timeout);
      
      if (timedOut) return; // Already rejected

      if (code !== 0) {
        logger.error('Python script error', { stderr, code });
        reject(new Error(`Python script failed: ${stderr}`));
        return;
      }

      try {
        // Extract JSON from mixed output
        let jsonLine = '';

        const lines = stdout.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.includes('"success"')) {
            jsonLine = trimmed;
            break;
          }
        }

        if (!jsonLine) {
          const jsonMatch = stdout.match(/\{[\s\S]*"success"[\s\S]*\}/);
          if (jsonMatch) {
            jsonLine = jsonMatch[0];
          }
        }

        if (!jsonLine) {
          logger.error('No valid JSON found in output', {
            stdout: stdout.substring(0, 500),
          });
          reject(new Error('No valid JSON found in Python output'));
          return;
        }

        const result = JSON.parse(jsonLine);

        if (!result.success) {
          logger.warn('Python returned error', { error: result.error });
        }

        resolve(result);
      } catch (err) {
        logger.error('Failed to parse Python output', {
          stdout: stdout.substring(0, 500),
          err,
        });
        reject(new Error('Invalid Python output'));
      }
    });
  });
}

/**
 * Extract face from selfie (for registration etc.)
 * Uses buffalo_l embedding from face_service.py
 */
async function extractFaceFromSelfie(imagePath) {
  try {
    logger.info('Extracting face from selfie', { imagePath });
    const result = await runPythonCommand('extract_selfie', [imagePath]);

    if (!result.success) {
      logger.warn('Face extraction failed', { error: result.error });
    }

    return result; // { success, embedding, confidence, ... }
  } catch (error) {
    logger.error('extractFaceFromSelfie error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Extract all faces from a photo (for event photos)
 */
async function extractFaces(imagePath) {
  try {
    logger.info('Extracting faces from photo', { imagePath });
    const result = await runPythonCommand('extract_photo', [imagePath]);

    if (!result.success) {
      logger.warn('Face extraction failed', { error: result.error });
    }

    return result; // { success, faces, faces_detected }
  } catch (error) {
    logger.error('extractFaces error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Find matching photos using temp file instead of long CLI args.
 * selfieEmbedding: buffalo_l embedding from extractFaceFromSelfie / extract_embedding
 * eventPhotos: [{ id: string, faces: [{ embedding: [...], ... }] }]
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
      threshold: 0.4 // ✅ Lower threshold for better matches
    };
    await fs.writeJson(tempFile, inputData);

    logger.info('Created temp file for matching', { tempFile });

    const result = await runPythonCommand('match_from_file', [tempFile]);

    if (!result.success) {
      logger.warn('Matching failed', { error: result.error });
    }

    logger.info('Matching completed', {
      matches: result.total_matches || 0,
      faces_searched: result.total_faces_searched || 0,
    });

    return result;
  } catch (error) {
    logger.error('findMatchingPhotos error', { error: error.message });
    return { success: false, error: error.message };
  } finally {
    if (tempFile) {
      await fs.remove(tempFile).catch((err) => {
        logger.warn('Failed to delete temp file', {
          tempFile,
          error: err.message,
        });
      });
    }
  }
}

/**
 * Extract face embedding from an image (generic endpoint)
 * Same as extract_selfie but kept for compatibility
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

module.exports = {
  extractFaceFromSelfie,
  extractFaces,
  findMatchingPhotos,
  extractFaceEmbedding,
};
