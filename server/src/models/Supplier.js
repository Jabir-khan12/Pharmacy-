import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    index: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  gstNumber: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net_15', 'net_30', 'net_60', 'net_90'],
    default: 'net_30'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

supplierSchema.index({ name: 'text', contactPerson: 'text' });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
