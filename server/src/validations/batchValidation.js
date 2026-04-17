import Joi from 'joi';

export const createBatchSchema = {
  body: Joi.object({
    medicine: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid medicine ID'
    }),
    batchNumber: Joi.string().trim().required().max(100),
    expiryDate: Joi.date().greater('now').required().messages({
      'date.greater': 'Expiry date must be in the future'
    }),
    quantity: Joi.number().integer().min(1).required(),
    costPrice: Joi.number().min(0).optional(),
    supplier: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().allow(null, ''),
    rackLocation: Joi.string().trim().max(100).optional().allow(''),
    notes: Joi.string().trim().max(500).optional().allow('')
  })
};

export const adjustBatchSchema = {
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
  }),
  body: Joi.object({
    quantity: Joi.number().integer().required().messages({
      'number.base': 'Quantity adjustment is required (positive to add, negative to remove)'
    }),
    reason: Joi.string().trim().max(500).optional().allow('')
  })
};

export const recallBatchSchema = {
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
  }),
  body: Joi.object({
    reason: Joi.string().trim().max(500).required().messages({
      'any.required': 'Recall reason is required'
    })
  })
};

export const batchIdSchema = {
  params: Joi.object({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid batch ID'
    })
  })
};

export const medicineIdParamSchema = {
  params: Joi.object({
    medicineId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid medicine ID'
    })
  })
};
