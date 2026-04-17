import AppError from '../utils/AppError.js';

/**
 * Validation middleware factory.
 * Accepts a Joi schema and validates req.body, req.params, and req.query.
 *
 * Usage:
 *   import { validate } from '../middleware/validate.js';
 *   import { createMedicineSchema } from '../validations/medicineValidation.js';
 *   router.post('/', validate(createMedicineSchema), createMedicine);
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const targets = {};

    if (schema.body) targets.body = req.body;
    if (schema.params) targets.params = req.params;
    if (schema.query) targets.query = req.query;

    for (const [key, value] of Object.entries(targets)) {
      const { error, value: validated } = schema[key].validate(value, {
        abortEarly: false,
        stripUnknown: true,
        errors: { wrap: { label: false } }
      });

      if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(new AppError(messages, 400));
      }

      // Replace request data with validated (and stripped) values
      req[key] = validated;
    }

    next();
  };
};
