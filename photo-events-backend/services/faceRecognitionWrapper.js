const { PythonShell } = require('python-shell');
const path = require('path');

class FaceRecognitionService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'faceRecognitionService.py');
  }

  async extractFaceEmbedding(imagePath) {
    try {
      console.log('🔍 Extracting face embedding from:', imagePath);
      
      const options = {
        mode: 'text',
        pythonPath: 'python', // or 'python3' on some systems
        pythonOptions: ['-u'],
        scriptPath: __dirname,
        args: ['extract', imagePath]
      };

      const results = await new Promise((resolve, reject) => {
        PythonShell.run('faceRecognitionService.py', options, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const result = JSON.parse(results[0]);
      console.log('✅ Face embedding extracted successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Face embedding extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async compareFaces(referenceEmbedding, targetEmbedding) {
    try {
      console.log('🔄 Comparing face embeddings...');
      
      const options = {
        mode: 'text',
        pythonPath: 'python',
        pythonOptions: ['-u'],
        scriptPath: __dirname,
        args: ['compare', JSON.stringify(referenceEmbedding), JSON.stringify(targetEmbedding)]
      };

      const results = await new Promise((resolve, reject) => {
        PythonShell.run('faceRecognitionService.py', options, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const result = JSON.parse(results[0]);
      console.log('✅ Face comparison completed, similarity:', result.similarity);
      return result;
      
    } catch (error) {
      console.error('❌ Face comparison failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new FaceRecognitionService();
