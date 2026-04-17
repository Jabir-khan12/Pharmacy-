import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  }
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    unique: true,
    index: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required'],
    index: true
  },
  items: [purchaseOrderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'],
    default: 'draft',
    index: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  receivedDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.poNumber) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const count = await mongoose.model('PurchaseOrder').countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    this.poNumber = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
