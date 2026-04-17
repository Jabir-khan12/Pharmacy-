import Joi from 'joi';

export const createReturnSchema = {
  body: Joi.object({
    originalSale: Joi.string().required().messages({
      'any.required': 'Original sale ID is required'
    }),
    items: Joi.array().items(
      Joi.object({
        medicine: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().trim().min(1).max(500).required().messages({
          'any.required': 'Return reason is required'
        }),
        restockable: Joi.boolean().default(true)
      })
    ).min(1).required().messages({
      'array.min': 'Return must contain at least one item',
      'any.required': 'Items are required'
    })
  })
};

export const approveReturnSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    approvalNotes: Joi.string().trim().max(1000).allow('')
  })
};

export const rejectReturnSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    approvalNotes: Joi.string().trim().max(1000).allow('')
  })
};

export const returnIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
