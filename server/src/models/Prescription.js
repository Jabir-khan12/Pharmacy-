import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true
  },
  doctorContact: {
    type: String,
    trim: true
  },
  uploadedFile: {
    type: String,
    required: [true, 'Prescription file is required']
  },
  prescribedMedicines: [{
    medicineName: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: String
  }],
  status: {
    type: String,
    enum: ['pending', 'verified', 'fulfilled', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verificationNotes: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  fulfilledSales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }]
}, { timestamps: true });

prescriptionSchema.index({ customer: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ expiryDate: 1 });

prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const count = await mongoose.model('Prescription').countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });
    this.prescriptionNumber = `RX-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

prescriptionSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.expiryDate);
});

prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
