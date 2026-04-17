import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine reference is required'],
    index: true
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    index: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  initialQuantity: {
    type: Number,
    required: true,
    min: [1, 'Initial quantity must be at least 1']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
    default: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    default: null
  },
  rackLocation: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'depleted', 'expired', 'recalled'],
    default: 'active',
    index: true
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

// Compound index for efficient FIFO queries
batchSchema.index({ medicine: 1, status: 1, expiryDate: 1 });
batchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });
batchSchema.index({ expiryDate: 1, status: 1 });

batchSchema.virtual('isExpired').get(function () {
  return new Date() > this.expiryDate;
});

batchSchema.virtual('daysUntilExpiry').get(function () {
  const today = new Date();
  const diffTime = this.expiryDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
