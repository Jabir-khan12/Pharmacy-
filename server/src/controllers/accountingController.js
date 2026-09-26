import AccountingTransaction from '../models/AccountingTransaction.js';
import AppError from '../utils/AppError.js';

const money = (value) => Math.round(value * 100) / 100;

export const getAccountingTransactions = async (req, res, next) => {
  try {
    const { type, startDate, endDate, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    const transactions = await AccountingTransaction.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 200));

    res.status(200).json({ success: true, data: { transactions } });
  } catch (error) {
    next(error);
  }
};

export const createAccountingTransaction = async (req, res, next) => {
  try {
    const transaction = await AccountingTransaction.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Accounting entry recorded', data: { transaction } });
  } catch (error) {
    next(error);
  }
};

export const getAccountingSummary = async (req, res, next) => {
  try {
    const transactions = await AccountingTransaction.find({}).select('type amount');
    const summary = transactions.reduce((result, transaction) => {
      if (transaction.type === 'expense') result.expenses += transaction.amount;
      if (transaction.type === 'salary') result.salaries += transaction.amount;
      if (transaction.type === 'income') result.otherIncome += transaction.amount;
      if (transaction.type === 'cash_deposit') result.cashDeposits += transaction.amount;
      if (transaction.type === 'cash_withdrawal') result.cashWithdrawals += transaction.amount;
      if (transaction.type === 'owner_withdrawal') result.ownerWithdrawals += transaction.amount;
      return result;
    }, { expenses: 0, salaries: 0, otherIncome: 0, cashDeposits: 0, cashWithdrawals: 0, ownerWithdrawals: 0 });

    Object.keys(summary).forEach((key) => { summary[key] = money(summary[key]); });
    summary.operatingCosts = money(summary.expenses + summary.salaries);

    res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    next(error);
  }
};

export const deleteAccountingTransaction = async (req, res, next) => {
  try {
    const transaction = await AccountingTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) return next(new AppError('Accounting entry not found', 404));
    res.status(200).json({ success: true, message: 'Accounting entry deleted' });
  } catch (error) {
    next(error);
  }
};
