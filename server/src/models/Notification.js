import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['expiry_alert', 'low_stock', 'out_of_stock', 'expiry_30_days', 'expiry_7_days', 'system'],
    index: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  targetRoles: [{
    type: String,
    enum: ['admin', 'pharmacist', 'customer']
  }]
}, { timestamps: true });

notificationSchema.index({ type: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ medicine: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
