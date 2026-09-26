import Joi from 'joi';

const paymentMethods = ['cash', 'card', 'insurance', 'online'];

export const createSaleSchema = {
  body: Joi.object({
    customer: Joi.object({
      userId: Joi.string().allow(null, ''),
      name: Joi.string().trim().max(200).allow(''),
      phone: Joi.string().trim().max(20).allow(''),
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
      type: Joi.string().valid('percentage', 'fixed').default('percentage'),
      value: Joi.number().min(0).when('type', {
        is: 'percentage',
        then: Joi.number().max(100),
        otherwise: Joi.number()
      }).default(0)
    }).default({ type: 'percentage', value: 0 }),
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
