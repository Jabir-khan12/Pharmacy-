import Joi from 'joi';

export const createUserSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).max(128).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('admin', 'pharmacist', 'customer').required().messages({
      'any.required': 'Role is required',
      'any.only': 'Role must be admin, pharmacist, or customer'
    }),
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().min(1).max(50).required(),
    phone: Joi.string().trim().min(7).max(20).required(),
    address: Joi.object({
      street: Joi.string().trim().allow(''),
      city: Joi.string().trim().allow(''),
      state: Joi.string().trim().allow(''),
      zipCode: Joi.string().trim().allow(''),
      country: Joi.string().trim().allow('')
    }).optional()
  })
};

export const updateUserSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    firstName: Joi.string().trim().min(1).max(50),
    lastName: Joi.string().trim().min(1).max(50),
    email: Joi.string().email(),
    phone: Joi.string().trim().min(7).max(20),
    address: Joi.object({
      street: Joi.string().trim().allow(''),
      city: Joi.string().trim().allow(''),
      state: Joi.string().trim().allow(''),
      zipCode: Joi.string().trim().allow(''),
      country: Joi.string().trim().allow('')
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

export const userIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
