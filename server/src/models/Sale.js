import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
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
    required: true,
    min: [0, 'Price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String
  },
  pharmacist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [saleItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Sale must contain at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  discount: {
    type: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    value: { type: Number, default: 0, min: 0 }
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: [0, 'Grand total cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'insurance', 'online']
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  },
  status: {
    type: String,
    enum: ['completed', 'returned', 'partially_returned'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

saleSchema.index({ 'customer.userId': 1, createdAt: -1 });
saleSchema.index({ pharmacist: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1 });

saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const count = await mongoose.model('Sale').countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    this.orderNumber = `SALE-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
