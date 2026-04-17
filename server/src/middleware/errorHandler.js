import AppError from '../utils/AppError.js';
import config from '../config/env.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  if (err.name === 'CastError') {
    error = new AppError('Resource not found', 404);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new AppError(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    }
  });
};

export default errorHandler;
