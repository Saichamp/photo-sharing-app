# 📸 PhotoManEa - AI-Powered Event Photo Delivery Platform

> Automatically deliver event photos to guests using facial recognition technology

 🎯 What is PhotoManEa?

PhotoManEa is a SaaS platform that revolutionizes event photography by using 
AI-powered face recognition to automatically identify and deliver photos to 
guests. Event organizers upload photos, guests register with a selfie, and 
our AI matches them with their photos instantly.

## ✨ Key Features

 For Event Organizers
- 📅 Create unlimited events with QR code registration
- 📤 Bulk photo upload with automatic face detection
- 📊 Real-time analytics dashboard
- 👥 Guest management and registration tracking
- 💾 Secure cloud storage with quota management

 For Event Guests
- 📱 Simple QR code-based registration
- 🤳 One-selfie face registration
- 🎭 Automatic photo matching using AI
- 📥 Instant photo delivery
- 🔒 Privacy-first design (GDPR compliant)

 Admin Features (Phase 1)
- 👥 User management (CRUD operations)
- 🔑 Password reset and account control
- 💳 Subscription management
- 📈 System health monitoring
- 🔄 Failed photo retry tools

## 🛠️ Tech Stack
 Backend
- **Node.js** + Express.js
- **MongoDB** + Mongoose
- **JWT** authentication
- **Multer** for file uploads
- RESTful API architecture

Frontend
- **React.js** (Hooks + Context API)
- **React Router** for navigation
- **Axios** for API calls
- Responsive CSS (mobile-first)

AI/ML
- **Python** face recognition service
- **face_recognition** library (dlib + OpenCV)
- **InsightFace** for advanced detection
- Cosine similarity matching algorithm

Infrastructure
- Child process communication (Node.js ↔ Python)
- Winston logger for debugging
- Rate limiting & security middleware
- Image optimization pipeline


