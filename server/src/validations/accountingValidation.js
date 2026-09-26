import Joi from 'joi';

export const accountingTransactionSchema = {
  body: Joi.object({
    type: Joi.string().valid('expense', 'salary', 'income', 'cash_deposit', 'cash_withdrawal', 'owner_withdrawal').required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().trim().min(1).max(100).required(),
    paymentMethod: Joi.string().valid('cash', 'bank', 'card', 'online', 'other').default('cash'),
    description: Joi.string().trim().max(1000).allow(''),
    transactionDate: Joi.date().iso().required()
  })
};

export const accountingQuerySchema = {
  params: Joi.object({ id: Joi.string().required() })
};
