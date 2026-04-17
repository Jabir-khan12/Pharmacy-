import Joi from 'joi';

const paymentMethods = ['cash', 'card', 'insurance', 'online'];

export const createSaleSchema = {
  body: Joi.object({
    customer: Joi.object({
      userId: Joi.string().allow(null, ''),
      name: Joi.string().trim().min(1).max(200).required().messages({
        'any.required': 'Customer name is required'
      }),
      phone: Joi.string().trim().min(7).max(20).required().messages({
        'any.required': 'Customer phone is required'
      }),
      email: Joi.string().email().allow('', null)
    }).required(),
    items: Joi.array().items(
      Joi.object({
        medicine: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required()
      })
    ).min(1).required().messages({
      'array.min': 'Sale must contain at least one item',
      'any.required': 'Items are required'
    }),
    paymentMethod: Joi.string().valid(...paymentMethods).required().messages({
      'any.required': 'Payment method is required',
      'any.only': `Payment method must be one of: ${paymentMethods.join(', ')}`
    }),
    discount: Joi.object({
      type: Joi.string().valid('percentage', 'fixed').default('fixed'),
      value: Joi.number().min(0).default(0)
    }).default({ type: 'fixed', value: 0 }),
    taxRate: Joi.number().min(0).max(100).default(0),
    prescription: Joi.string().allow(null, ''),
    notes: Joi.string().trim().max(1000).allow('')
  })
};

export const saleIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
