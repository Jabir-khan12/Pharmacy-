import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Not authorized to access this route', 401));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};
