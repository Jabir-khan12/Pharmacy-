import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  priceAtSale: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Return reason is required'],
    trim: true
  },
  restockable: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const returnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  originalSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [returnItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Return must contain at least one item'
    }
  },
  refundAmount: {
    type: Number,
    required: true,
    min: [0, 'Refund amount cannot be negative']
  },
  returnFeeRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  returnFeeAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalNotes: {
    type: String,
    trim: true
  },
  approvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

returnSchema.index({ originalSale: 1 });
returnSchema.index({ status: 1, createdAt: -1 });

returnSchema.pre('validate', async function(next) {
  if (this.isNew && !this.returnNumber) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const count = await mongoose.model('Return').countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    this.returnNumber = `RET-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Return = mongoose.model('Return', returnSchema);

export default Return;
