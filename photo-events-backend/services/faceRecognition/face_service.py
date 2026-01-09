#!/usr/bin/env python3
"""
Face Recognition Service for PhotoManEa
Handles face detection, embedding extraction, and matching
"""

import sys
import json
import cv2
import numpy as np
from insightface.app import FaceAnalysis

app = None


def initialize_model():
  """Initialize the face recognition model"""
  global app
  if app is None:
      print("[Python] Loading InsightFace model...", file=sys.stderr)
      app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
      app.prepare(ctx_id=-1, det_size=(640, 640))
      print("[Python] Model loaded successfully!", file=sys.stderr)
  return app


def extract_selfie(image_path):
  """Extract face embedding from a selfie"""
  try:
      app = initialize_model()
      img = cv2.imread(image_path)
      if img is None:
          return {'success': False, 'error': 'Could not read image'}

      faces = app.get(img)
      if len(faces) == 0:
          return {'success': False, 'error': 'No face detected in selfie'}
      if len(faces) > 1:
          return {
              'success': False,
              'error': 'Multiple faces detected. Please use a clear selfie with only one person.'
          }

      face = faces[0]
      embedding = face.embedding.tolist()

      return {
          'success': True,
          'embedding': embedding,
          'face_detected': True,
          'confidence': float(face.det_score)
      }
  except Exception as e:
      return {'success': False, 'error': str(e)}


def extract_photo(image_path):
  """Extract all faces from an event photo"""
  try:
      app = initialize_model()
      img = cv2.imread(image_path)
      if img is None:
          return {'success': False, 'error': 'Could not read image'}

      faces = app.get(img)
      faces_data = []
      for idx, face in enumerate(faces):
          faces_data.append({
              'faceIndex': idx,
              'embedding': face.embedding.tolist(),
              'boundingBox': face.bbox.tolist(),
              'confidence': float(face.det_score),
              'age': int(face.age),
              'gender': 'M' if int(face.gender) == 1 else 'F',
          })

      return {
          'success': True,
          'faces': faces_data,
          'faces_detected': len(faces_data)
      }
  except Exception as e:
      return {'success': False, 'error': str(e)}


def extract_embedding(image_path):
  """Alias for extract_selfie"""
  return extract_selfie(image_path)


def cosine_similarity(emb1, emb2):
  emb1 = np.array(emb1)
  emb2 = np.array(emb2)
  return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))


def match_faces(user_embedding, event_photos, threshold=0.6):
  matched_photos = []
  total_faces_searched = 0

  for photo in event_photos:
      photo_id = photo['id']
      faces = photo.get('faces', [])

      for face_idx, face in enumerate(faces):
          total_faces_searched += 1
          face_embedding = face.get('embedding')
          if not face_embedding:
              continue

          similarity = cosine_similarity(user_embedding, face_embedding)
          distance = 1 - similarity

          if distance < threshold:
              matched_photos.append({
                  'photo_id': photo_id,
                  'face_index': face_idx,
                  'similarity': float(similarity),
                  'distance': float(distance),
                  'confidence': float(similarity * 100),
              })

  return {
      'success': True,
      'matched_photos': matched_photos,
      'total_matches': len(matched_photos),
      'total_faces_searched': total_faces_searched,
  }


def match_from_file(file_path):
  try:
      with open(file_path, 'r') as f:
          data = json.load(f)

      user_embedding = data['user_embedding']
      event_photos = data['event_photos']
      threshold = data.get('threshold', 0.6)  # value from Node / config

      return match_faces(user_embedding, event_photos, threshold)
  except Exception as e:
      return {'success': False, 'error': f'File matching error: {str(e)}'}


def main():
  if len(sys.argv) < 2:
      print(json.dumps({'success': False, 'error': 'No command provided'}))
      sys.exit(1)

  command = sys.argv[1]

  try:
      if command == 'extract_selfie':
          if len(sys.argv) < 3:
              result = {'success': False, 'error': 'Image path required'}
          else:
              result = extract_selfie(sys.argv[2])

      elif command == 'extract_photo':
          if len(sys.argv) < 3:
              result = {'success': False, 'error': 'Image path required'}
          else:
              result = extract_photo(sys.argv[2])

      elif command == 'extract_embedding':
          if len(sys.argv) < 3:
              result = {'success': False, 'error': 'Image path required'}
          else:
              result = extract_embedding(sys.argv[2])

      elif command == 'match':
          if len(sys.argv) < 4:
              result = {'success': False, 'error': 'Embedding and photos required'}
          else:
              user_embedding = json.loads(sys.argv[2])
              event_photos = json.loads(sys.argv[3])
              result = match_faces(user_embedding, event_photos)

      elif command == 'match_from_file':
          if len(sys.argv) < 3:
              result = {'success': False, 'error': 'File path required'}
          else:
              result = match_from_file(sys.argv[2])

      else:
          result = {'success': False, 'error': f'Unknown command: {command}'}

      print(json.dumps(result))
      sys.exit(0)
  except Exception as e:
      print(json.dumps({'success': False, 'error': str(e)}))
      sys.exit(1)


if __name__ == '__main__':
  main()