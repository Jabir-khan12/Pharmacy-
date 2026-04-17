import Joi from 'joi';

export const createPurchaseOrderSchema = {
  body: Joi.object({
    supplier: Joi.string().required().messages({
      'any.required': 'Supplier is required'
    }),
    items: Joi.array().items(
      Joi.object({
        medicine: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitCost: Joi.number().min(0).required(),
        batchNumber: Joi.string().trim().max(100).allow(''),
        expiryDate: Joi.date().iso().allow(null, '')
      })
    ).min(1).required().messages({
      'array.min': 'At least one item is required'
    }),
    expectedDeliveryDate: Joi.date().iso().allow(null, ''),
    notes: Joi.string().trim().max(2000).allow('')
  })
};

export const updatePurchaseOrderStatusSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('ordered', 'cancelled').required().messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be ordered or cancelled'
    })
  })
};

export const receivePurchaseOrderSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    receivedItems: Joi.array().items(
      Joi.object({
        itemId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        batchNumber: Joi.string().trim().max(100).allow(''),
        expiryDate: Joi.date().iso().allow(null, '')
      })
    ).min(1).required()
  })
};

export const purchaseOrderIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
