import Sale from '../models/Sale.js';
import Medicine from '../models/Medicine.js';
import Return from '../models/Return.js';
import { generateCSV, sendCSVResponse } from '../utils/csvHelper.js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const exportSales = async (req, res, next) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startOfDay(new Date(startDate));
      if (endDate) query.createdAt.$lte = endOfDay(new Date(endDate));
    }
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const sales = await Sale.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('pharmacist', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const columns = [
      { key: 'orderNumber', label: 'Order Number' },
      { key: 'customer', label: 'Customer', transform: (row) => row.customer ? `${row.customer.firstName} ${row.customer.lastName}` : 'Walk-in' },
      { key: 'pharmacist', label: 'Pharmacist', transform: (row) => row.pharmacist ? `${row.pharmacist.firstName} ${row.pharmacist.lastName}` : '' },
      { key: 'items', label: 'Items Count', transform: (row) => row.items?.length || 0 },
      { key: 'totalAmount', label: 'Subtotal', transform: (row) => row.totalAmount?.toFixed(2) || '0.00' },
      { key: 'discountAmount', label: 'Discount', transform: (row) => row.discountAmount?.toFixed(2) || '0.00' },
      { key: 'taxAmount', label: 'Tax', transform: (row) => row.taxAmount?.toFixed(2) || '0.00' },
      { key: 'grandTotal', label: 'Grand Total', transform: (row) => (row.grandTotal || row.totalAmount)?.toFixed(2) || '0.00' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date', transform: (row) => new Date(row.createdAt).toLocaleString() }
    ];

    const csv = generateCSV(sales, columns);
    const filename = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
    sendCSVResponse(res, csv, filename);
  } catch (error) {
    next(error);
  }
};

export const exportMedicines = async (req, res, next) => {
  try {
    const { category, status: medStatus } = req.query;

    const query = {};
    if (category) query.category = category;
    if (medStatus) query.status = medStatus;
    else query.status = 'active';

    const medicines = await Medicine.find(query).sort({ name: 1 }).lean();

    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'genericName', label: 'Generic Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'dosageForm', label: 'Dosage Form' },
      { key: 'strength', label: 'Strength' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'batchNumber', label: 'Batch Number' },
      { key: 'price', label: 'Price', transform: (row) => row.price?.toFixed(2) || '0.00' },
      { key: 'stockQuantity', label: 'Stock Quantity' },
      { key: 'reorderLevel', label: 'Reorder Level' },
      { key: 'stockStatus', label: 'Stock Status', transform: (row) => {
        if (row.stockQuantity === 0) return 'Out of Stock';
        if (row.stockQuantity <= row.reorderLevel) return 'Low Stock';
        return 'In Stock';
      }},
      { key: 'expiryDate', label: 'Expiry Date', transform: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '' },
      { key: 'isPrescriptionRequired', label: 'Prescription Required', transform: (row) => row.isPrescriptionRequired ? 'Yes' : 'No' }
    ];

    const csv = generateCSV(medicines, columns);
    const filename = `medicines_export_${new Date().toISOString().split('T')[0]}.csv`;
    sendCSVResponse(res, csv, filename);
  } catch (error) {
    next(error);
  }
};

export const exportInventoryStatus = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ status: 'active' }).sort({ name: 1 }).lean();

    const columns = [
      { key: 'name', label: 'Medicine' },
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'stockQuantity', label: 'Current Stock' },
      { key: 'reorderLevel', label: 'Reorder Level' },
      { key: 'status', label: 'Stock Status', transform: (row) => {
        if (row.stockQuantity === 0) return 'Out of Stock';
        if (row.stockQuantity <= row.reorderLevel) return 'Low Stock';
        return 'In Stock';
      }},
      { key: 'price', label: 'Unit Price', transform: (row) => row.price?.toFixed(2) || '0.00' },
      { key: 'inventoryValue', label: 'Inventory Value', transform: (row) => (row.price * row.stockQuantity).toFixed(2) },
      { key: 'expiryDate', label: 'Expiry Date', transform: (row) => row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '' },
      { key: 'daysToExpiry', label: 'Days to Expiry', transform: (row) => {
        if (!row.expiryDate) return '';
        const days = Math.ceil((new Date(row.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
      }}
    ];

    const csv = generateCSV(medicines, columns);
    const filename = `inventory_status_${new Date().toISOString().split('T')[0]}.csv`;
    sendCSVResponse(res, csv, filename);
  } catch (error) {
    next(error);
  }
};

export const exportReturns = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startOfDay(new Date(startDate));
      if (endDate) query.createdAt.$lte = endOfDay(new Date(endDate));
    }
    if (status) query.status = status;

    const returns = await Return.find(query)
      .populate('sale', 'orderNumber')
      .populate('requestedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    const columns = [
      { key: 'sale', label: 'Sale Order', transform: (row) => row.sale?.orderNumber || '' },
      { key: 'requestedBy', label: 'Requested By', transform: (row) => row.requestedBy ? `${row.requestedBy.firstName} ${row.requestedBy.lastName}` : '' },
      { key: 'items', label: 'Items Count', transform: (row) => row.items?.length || 0 },
      { key: 'totalRefundAmount', label: 'Refund Amount', transform: (row) => row.totalRefundAmount?.toFixed(2) || '0.00' },
      { key: 'status', label: 'Status' },
      { key: 'approvedBy', label: 'Approved By', transform: (row) => row.approvedBy ? `${row.approvedBy.firstName} ${row.approvedBy.lastName}` : '' },
      { key: 'reason', label: 'Reason' },
      { key: 'createdAt', label: 'Date', transform: (row) => new Date(row.createdAt).toLocaleString() }
    ];

    const csv = generateCSV(returns, columns);
    const filename = `returns_export_${new Date().toISOString().split('T')[0]}.csv`;
    sendCSVResponse(res, csv, filename);
  } catch (error) {
    next(error);
  }
};

export const exportTopSelling = async (req, res, next) => {
  try {
    const { days = 30, limit = 50 } = req.query;
    const startDate = subDays(new Date(), parseInt(days));

    const topSelling = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'returned' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          medicineName: { $first: '$items.medicineName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const populatedTopSelling = await Medicine.populate(topSelling, {
      path: '_id',
      select: 'name category stockQuantity price sku'
    });

    const columns = [
      { key: 'medicineName', label: 'Medicine' },
      { key: 'sku', label: 'SKU', transform: (row) => row._id?.sku || '' },
      { key: 'category', label: 'Category', transform: (row) => row._id?.category || '' },
      { key: 'totalQuantity', label: 'Total Qty Sold' },
      { key: 'salesCount', label: 'Number of Sales' },
      { key: 'totalRevenue', label: 'Total Revenue', transform: (row) => row.totalRevenue?.toFixed(2) || '0.00' },
      { key: 'currentStock', label: 'Current Stock', transform: (row) => row._id?.stockQuantity || 0 },
      { key: 'unitPrice', label: 'Current Price', transform: (row) => row._id?.price?.toFixed(2) || '0.00' }
    ];

    const csv = generateCSV(populatedTopSelling, columns);
    const filename = `top_selling_${days}days_${new Date().toISOString().split('T')[0]}.csv`;
    sendCSVResponse(res, csv, filename);
  } catch (error) {
    next(error);
  }
};
