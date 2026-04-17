import Joi from 'joi';

const paymentTerms = ['immediate', 'net_15', 'net_30', 'net_60', 'net_90'];
const statuses = ['active', 'inactive', 'blacklisted'];

export const createSupplierSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(200).required().messages({
      'any.required': 'Supplier name is required'
    }),
    contactPerson: Joi.string().trim().max(200).allow(''),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().trim().min(7).max(20).required().messages({
      'any.required': 'Phone number is required'
    }),
    address: Joi.object({
      street: Joi.string().trim().max(200).allow(''),
      city: Joi.string().trim().max(100).allow(''),
      state: Joi.string().trim().max(100).allow(''),
      zipCode: Joi.string().trim().max(20).allow(''),
      country: Joi.string().trim().max(100).allow('')
    }).default({}),
    gstNumber: Joi.string().trim().max(50).allow(''),
    licenseNumber: Joi.string().trim().max(50).allow(''),
    paymentTerms: Joi.string().valid(...paymentTerms).default('net_30'),
    status: Joi.string().valid(...statuses).default('active'),
    notes: Joi.string().trim().max(2000).allow('')
  })
};

export const updateSupplierSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(200),
    contactPerson: Joi.string().trim().max(200).allow(''),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().trim().min(7).max(20),
    address: Joi.object({
      street: Joi.string().trim().max(200).allow(''),
      city: Joi.string().trim().max(100).allow(''),
      state: Joi.string().trim().max(100).allow(''),
      zipCode: Joi.string().trim().max(20).allow(''),
      country: Joi.string().trim().max(100).allow('')
    }),
    gstNumber: Joi.string().trim().max(50).allow(''),
    licenseNumber: Joi.string().trim().max(50).allow(''),
    paymentTerms: Joi.string().valid(...paymentTerms),
    status: Joi.string().valid(...statuses),
    notes: Joi.string().trim().max(2000).allow('')
  }).min(1)
};

export const supplierIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
