import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtExpire });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpire });
};

export const verifyAccessToken = (token) => jwt.verify(token, config.jwtSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwtRefreshSecret);
