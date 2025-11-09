/**
 * Face Recognition Service
 * Node.js wrapper for Python InsightFace
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class FaceRecognitionService {
  constructor() {
    // Path to Python script
    this.pythonScript = path.join(__dirname, '../python/face_service.py');
    
    // Path to Python executable in venv
    this.pythonPath = this._getPythonPath();
    
    // Configuration
    this.config = {
      matchThreshold: 0.4,  // Default matching threshold
      timeout: 30000        // 30 second timeout
    };
  }

  /**
   * Get Python executable path (venv or system)
   */
  _getPythonPath() {
    const venvPath = path.join(__dirname, '../venv');
    
    // Check if running on Windows or Unix
    const isWindows = process.platform === 'win32';
    const pythonBin = isWindows 
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');
    
    // Check if venv exists, otherwise use system python
    try {
      require('fs').accessSync(pythonBin);
      return pythonBin;
    } catch (e) {
      return isWindows ? 'python' : 'python3';
    }
  }

  /**
   * Execute Python script with arguments
   */
  /**
   * Execute Python script with arguments
   * IMPROVED: Filters stdout to extract only JSON
   */
  _executePython(args, inputData = null) {
    return new Promise((resolve, reject) => {
      console.log('🐍 Executing Python:', this.pythonPath, args.join(' '));
      
      const python = spawn(this.pythonPath, [this.pythonScript, ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log Python errors/warnings to console
        if (data.toString().includes('Error') || data.toString().includes('error')) {
          console.log('Python stderr:', data.toString());
        }
      });

      // Timeout handling
      const timeout = setTimeout(() => {
        python.kill();
        reject(new Error('Python script execution timeout'));
      }, this.config.timeout);

      python.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          console.error('❌ Python script failed with code:', code);
          console.error('stderr:', stderr);
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // CRITICAL FIX: Extract JSON from mixed output
          // Look for lines starting with { or containing "success"
          const lines = stdout.split('\n');
          let jsonLine = '';
          
          // Find the line that looks like JSON
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.includes('"success"')) {
              jsonLine = trimmed;
              break;
            }
          }
          
          if (!jsonLine) {
            // Fallback: try to find JSON in the entire output
            const jsonMatch = stdout.match(/\{[\s\S]*"success"[\s\S]*\}/);
            if (jsonMatch) {
              jsonLine = jsonMatch[0];
            }
          }
          
          if (!jsonLine) {
            console.error('❌ No valid JSON found in output');
            console.error('stdout:', stdout.substring(0, 500));
            reject(new Error('No valid JSON found in Python output'));
            return;
          }
          
          const result = JSON.parse(jsonLine);
          
          if (!result.success) {
            reject(new Error(result.error || 'Unknown Python error'));
            return;
          }
          
          console.log('✅ Python script succeeded');
          resolve(result);
        } catch (e) {
          console.error('❌ Failed to parse JSON from output');
          console.error('Error:', e.message);
          console.error('stdout (first 500 chars):', stdout.substring(0, 500));
          reject(new Error(`Failed to parse Python output: ${e.message}`));
        }
      });

      python.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Failed to start Python process:', error);
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Send input data if provided
      if (inputData) {
        python.stdin.write(JSON.stringify(inputData));
        python.stdin.end();
      }
    });
  }


  /**
   * Extract face embeddings from an image
   * @param {string} imagePath - Absolute path to image file
   * @returns {Promise<Object>} - { facesDetected, faces: [{faceIndex, embedding, boundingBox, age, gender, confidence}], processingTime }
   */
  async extractFaces(imagePath) {
    console.log('📸 Extracting faces from:', imagePath);
    
    // Verify file exists
    try {
      await fs.access(imagePath);
    } catch (e) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const result = await this._executePython(['extract', imagePath]);
    
    console.log(`✅ Extracted ${result.facesDetected} face(s) in ${result.processingTime}s`);
    return result;
  }

  /**
   * Search for a face in database of embeddings
   * @param {Array<number>} queryEmbedding - User's face embedding (512 numbers)
   * @param {Array<Object>} database - Array of {photoId, faceIndex, embedding, boundingBox}
   * @param {number} threshold - Match threshold (default: 0.4)
   * @returns {Promise<Object>} - { matchesFound, matches: [{photoId, faceIndex, distance, confidence, boundingBox}], searchTime }
   */
  async searchFaces(queryEmbedding, database, threshold = null) {
    console.log(`🔍 Searching ${database.length} faces for matches...`);
    
    const searchThreshold = threshold || this.config.matchThreshold;
    
    const result = await this._executePython(
      ['search', JSON.stringify(queryEmbedding), JSON.stringify(database), searchThreshold.toString()]
    );
    
    console.log(`✅ Found ${result.matchesFound} match(es) in ${result.searchTime}s`);
    return result;
  }

  /**
   * Compare two face embeddings
   * @param {Array<number>} embedding1 - First face embedding
   * @param {Array<number>} embedding2 - Second face embedding
   * @returns {Object} - { distance, similarity, confidence }
   */
  compareEmbeddings(embedding1, embedding2) {
    // Simple cosine similarity (can do this in JavaScript for single comparison)
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const norm1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const norm2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    
    const similarity = dotProduct / (norm1 * norm2);
    const distance = 1 - similarity;
    const confidence = (1 - distance) * 100;
    
    return {
      distance: distance,
      similarity: similarity,
      confidence: confidence,
      isMatch: distance < this.config.matchThreshold
    };
  }

  /**
   * Validate face embedding format
   * @param {Array<number>} embedding - Face embedding to validate
   * @returns {boolean}
   */
  isValidEmbedding(embedding) {
    return Array.isArray(embedding) && 
           embedding.length === 512 && 
           embedding.every(n => typeof n === 'number');
  }

  /**
   * Set match threshold
   * @param {number} threshold - New threshold (0.0 - 1.0)
   */
  setMatchThreshold(threshold) {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.config.matchThreshold = threshold;
    console.log(`✅ Match threshold set to ${threshold}`);
  }
}

// Export singleton instance
module.exports = new FaceRecognitionService();
