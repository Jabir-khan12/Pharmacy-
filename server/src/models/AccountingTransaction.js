import mongoose from 'mongoose';

const accountingTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['expense', 'salary', 'income', 'cash_deposit', 'cash_withdrawal', 'owner_withdrawal'],
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'card', 'online', 'other'],
    default: 'cash'
  },
  description: { type: String, trim: true, maxlength: 1000 },
  transactionDate: { type: Date, default: Date.now, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

accountingTransactionSchema.index({ transactionDate: -1, type: 1 });

const AccountingTransaction = mongoose.model('AccountingTransaction', accountingTransactionSchema);

export default AccountingTransaction;
