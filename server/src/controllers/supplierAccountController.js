import Supplier from '../models/Supplier.js';
import SupplierTransaction from '../models/SupplierTransaction.js';
import Batch from '../models/Batch.js';
import AppError from '../utils/AppError.js';
import AccountingTransaction from '../models/AccountingTransaction.js';

const getBalance = (transactions) => transactions.reduce((balance, transaction) => (
  balance + (transaction.type === 'purchase' ? transaction.amount : -transaction.amount)
), 0);

export const getSupplierAccount = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return next(new AppError('Supplier not found', 404));

    const transactions = await SupplierTransaction.find({ supplier: supplier._id })
      .populate('purchaseOrder', 'poNumber')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const purchases = transactions.filter((item) => item.type === 'purchase')
      .reduce((sum, item) => sum + item.amount, 0);
    const payments = transactions.filter((item) => item.type === 'payment')
      .reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        supplier,
        transactions,
        summary: { purchases, payments, balance: getBalance(transactions) }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const recordSupplierPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'cash', notes } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return next(new AppError('Supplier not found', 404));

    const transactions = await SupplierTransaction.find({ supplier: supplier._id });
    const balance = getBalance(transactions);
    if (amount > balance) {
      return next(new AppError(`Payment exceeds outstanding balance of ${balance.toFixed(2)}`, 400));
    }

    const payment = await SupplierTransaction.create({
      supplier: supplier._id,
      type: 'payment',
      amount,
      paymentMethod,
      notes,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Supplier payment recorded', data: { transaction: payment } });
  } catch (error) {
    next(error);
  }
};

export const getFinancialOverview = async (req, res, next) => {
  try {
    const [transactions, inventory, accounting] = await Promise.all([
      SupplierTransaction.find({}).select('supplier type amount purchaseOrder createdAt').populate('supplier', 'name').populate('purchaseOrder', 'poNumber createdAt'),
      Batch.aggregate([
        { $match: { status: 'active', quantity: { $gt: 0 } } },
        { $group: { _id: null, inventoryCost: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } }
      ]),
      AccountingTransaction.find({}).select('type amount')
    ]);

    const supplierLoans = getBalance(transactions);
    const inventoryCost = inventory[0]?.inventoryCost || 0;

    // Build per-supplier breakdown with oldest unpaid purchase order info
    const supplierBreakdown = Object.values(transactions.reduce((groups, transaction) => {
      const supplierId = transaction.supplier?._id?.toString() || 'unknown';
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplierId,
          supplierName: transaction.supplier?.name || 'Unknown supplier',
          balance: 0,
          oldestPurchaseOrder: null,
          oldestPurchaseDate: null
        };
      }
      groups[supplierId].balance += transaction.type === 'purchase' ? transaction.amount : -transaction.amount;

      // Track oldest (earliest) purchase order
      if (transaction.type === 'purchase' && transaction.purchaseOrder) {
        const poDate = transaction.purchaseOrder.createdAt;
        if (!groups[supplierId].oldestPurchaseDate || new Date(poDate) < new Date(groups[supplierId].oldestPurchaseDate)) {
          groups[supplierId].oldestPurchaseOrder = transaction.purchaseOrder;
          groups[supplierId].oldestPurchaseDate = poDate;
        }
      }
      return groups;
    }, {})).filter((item) => item.balance !== 0);

    const expenses = accounting.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const salaries = accounting.filter((item) => item.type === 'salary').reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        inventoryCost,
        supplierLoans,
        estimatedNetPosition: inventoryCost - supplierLoans,
        supplierBreakdown,
        expenses,
        salaries,
        operatingCosts: expenses + salaries,
        note: 'This is an operating snapshot of recorded inventory cost minus supplier loans. Cash, customer receivables, rent, and other assets are not included.'
      }
    });
  } catch (error) {
    next(error);
  }
};
