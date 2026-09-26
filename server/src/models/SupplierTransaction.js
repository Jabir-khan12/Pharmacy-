import mongoose from 'mongoose';

const supplierTransactionSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['purchase', 'payment', 'adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'card', 'online', 'other'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

supplierTransactionSchema.index({ supplier: 1, createdAt: -1 });

const SupplierTransaction = mongoose.model('SupplierTransaction', supplierTransactionSchema);

export default SupplierTransaction;
