import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;
    // NOTE: role is intentionally NOT accepted from the request body.
    // Public registration always creates 'customer' accounts.
    // Only admins can create users with elevated roles via POST /api/users.

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }

    const user = await User.create({
      email,
      password,
      role: 'customer',
      firstName,
      lastName,
      phone,
      address
    });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 403));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token is required', 400));
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken }
    });
  } catch (error) {
    next(new AppError('Invalid refresh token', 401));
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
