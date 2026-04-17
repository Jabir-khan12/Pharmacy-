import Joi from 'joi';

export const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().trim().min(1).max(50).required().messages({
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().trim().min(1).max(50).required().messages({
      'any.required': 'Last name is required'
    }),
    phone: Joi.string().trim().min(7).max(20).required().messages({
      'any.required': 'Phone number is required'
    }),
    address: Joi.object({
      street: Joi.string().trim().allow(''),
      city: Joi.string().trim().allow(''),
      state: Joi.string().trim().allow(''),
      zipCode: Joi.string().trim().allow(''),
      country: Joi.string().trim().allow('')
    }).optional()
  })
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  })
};

export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  })
};

export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).max(128).required()
      .disallow(Joi.ref('currentPassword'))
      .messages({
        'string.min': 'New password must be at least 6 characters',
        'any.required': 'New password is required',
        'any.invalid': 'New password must be different from current password'
      })
  })
};
