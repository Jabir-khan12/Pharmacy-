import Joi from 'joi';

const categories = [
  'Analgesics',
  'Antibiotics',
  'Antivirals',
  'Antifungals',
  'Antihistamines',
  'Cardiovascular',
  'Diabetes',
  'Gastrointestinal',
  'Respiratory',
  'Vitamins & Supplements',
  'Skin Care',
  'Other'
];

const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Other'];

export const createMedicineSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(200).required().messages({
      'any.required': 'Medicine name is required'
    }),
    genericName: Joi.string().trim().min(1).max(200).required().messages({
      'any.required': 'Generic name is required'
    }),
    sku: Joi.string().trim().max(50).required().messages({
      'any.required': 'SKU is required'
    }),
    category: Joi.string().valid(...categories).required().messages({
      'any.required': 'Category is required',
      'any.only': `Category must be one of: ${categories.join(', ')}`
    }),
    manufacturer: Joi.string().trim().max(200).required().messages({
      'any.required': 'Manufacturer is required'
    }),
    description: Joi.string().trim().max(2000).allow(''),
    dosageForm: Joi.string().valid(...dosageForms).required().messages({
      'any.required': 'Dosage form is required',
      'any.only': `Dosage form must be one of: ${dosageForms.join(', ')}`
    }),
    strength: Joi.string().trim().min(1).max(100).required().messages({
      'any.required': 'Strength is required'
    }),
    price: Joi.number().min(0).required().messages({
      'any.required': 'Price is required',
      'number.min': 'Price cannot be negative'
    }),
    stockQuantity: Joi.number().integer().min(0).default(0),
    reorderLevel: Joi.number().integer().min(0).default(10),
    batchNumber: Joi.string().trim().max(100).required().messages({
      'any.required': 'Batch number is required'
    }),
    expiryDate: Joi.date().iso().required().messages({
      'any.required': 'Expiry date is required'
    }),
    isPrescriptionRequired: Joi.boolean().default(false),
    rackLocation: Joi.string().trim().max(100).allow(''),
    status: Joi.string().valid('active', 'discontinued', 'expired').default('active'),
    imageUrl: Joi.string().uri().allow('')
  })
};

export const updateMedicineSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(200),
    genericName: Joi.string().trim().min(1).max(200),
    sku: Joi.string().trim().max(50),
    category: Joi.string().valid(...categories),
    manufacturer: Joi.string().trim().max(200),
    description: Joi.string().trim().max(2000).allow(''),
    dosageForm: Joi.string().valid(...dosageForms),
    strength: Joi.string().trim().min(1).max(100),
    price: Joi.number().min(0),
    reorderLevel: Joi.number().integer().min(0),
    batchNumber: Joi.string().trim().max(100),
    expiryDate: Joi.date().iso(),
    isPrescriptionRequired: Joi.boolean(),
    rackLocation: Joi.string().trim().max(100).allow(''),
    status: Joi.string().valid('active', 'discontinued', 'expired'),
    imageUrl: Joi.string().uri().allow('')
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

export const adjustStockSchema = {
  params: Joi.object({
    id: Joi.string().required()
  }),
  body: Joi.object({
    quantity: Joi.number().integer().required().messages({
      'any.required': 'Quantity is required',
      'number.integer': 'Quantity must be a whole number'
    }),
    type: Joi.string().valid('purchase', 'adjustment', 'damage', 'expiry', 'return').required().messages({
      'any.required': 'Transaction type is required'
    }),
    reason: Joi.string().trim().max(500).allow(''),
    batchNumber: Joi.string().trim().max(100).allow('')
  })
};

export const medicineIdSchema = {
  params: Joi.object({
    id: Joi.string().required()
  })
};
