import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'expiry', 'damage'],
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  referenceModel: {
    type: String,
    enum: ['Sale', 'Return', 'Purchase', null],
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

stockTransactionSchema.index({ medicine: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1, createdAt: -1 });
stockTransactionSchema.index({ performedBy: 1, createdAt: -1 });

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

export default StockTransaction;
