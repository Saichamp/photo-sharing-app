// backend/middleware/adminAuth.js
const { AppError, asyncHandler } = require('./errorHandler');

const adminAuth = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.role) {
    throw new AppError('Not authenticated', 401);
  }

  if (req.user.role !== 'admin') {
    throw new AppError('Admin access only', 403);
  }

  next();
});

module.exports = adminAuth;
