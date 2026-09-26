import Joi from 'joi';

export const supplierPaymentSchema = {
  params: Joi.object({ id: Joi.string().required() }),
  body: Joi.object({
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('cash', 'bank', 'card', 'online', 'other').default('cash'),
    notes: Joi.string().trim().max(1000).allow('')
  })
};
