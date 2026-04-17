import Joi from 'joi';

export const verifyPrescriptionSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    status: Joi.string().valid('verified', 'rejected').required().messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either verified or rejected'
    }),
    verificationNotes: Joi.string().trim().max(1000).allow('')
  })
};

export const prescriptionIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
