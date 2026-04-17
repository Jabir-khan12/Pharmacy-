import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true,
    enum: [
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
    ]
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Other']
  },
  strength: {
    type: String,
    required: [true, 'Strength is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  rackLocation: {
    type: String,
    trim: true
  },
  isPrescriptionRequired: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'discontinued', 'expired'],
    default: 'active'
  },
  imageUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

medicineSchema.index({ name: 'text', genericName: 'text' });
medicineSchema.index({ category: 1, status: 1 });
medicineSchema.index({ expiryDate: 1, status: 1 });

medicineSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'out_of_stock';
  if (this.stockQuantity <= this.reorderLevel) return 'low_stock';
  return 'in_stock';
});

medicineSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
