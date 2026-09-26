import Sale from '../models/Sale.js';
import Return from '../models/Return.js';
import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';
import AppError from '../utils/AppError.js';
import { createSaleTransaction } from '../services/salesService.js';
import PDFDocument from 'pdfkit';

export const createSale = async (req, res, next) => {
  try {
    const { customer: requestedCustomer, items, paymentMethod, prescription, notes, discount, taxRate } = req.body;
    const customer = {
      ...requestedCustomer,
      name: requestedCustomer?.name?.trim() || 'Walk-in customer',
      phone: requestedCustomer?.phone?.trim() || ''
    };

    if (!items || items.length === 0) {
      return next(new AppError('Sale must contain at least one item', 400));
    }

    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);

      if (!medicine) {
        return next(new AppError(`Medicine not found: ${item.medicine}`, 404));
      }

      const subtotal = medicine.price * item.quantity;
      totalAmount += subtotal;

      processedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        quantity: item.quantity,
        priceAtSale: medicine.price,
        costAtSale: (await Batch.findOne({ medicine: medicine._id }).sort({ createdAt: 1 }))?.costPrice ?? null,
        subtotal
      });
    }

    // Calculate discount
    let discountAmount = 0;
    const discountType = discount?.type || 'percentage';
    const discountValue = parseFloat(discount?.value) || 0;

    if (discountType === 'percentage') {
      discountAmount = (totalAmount * discountValue) / 100;
    } else {
      discountAmount = Math.min(discountValue, totalAmount);
    }

    // Calculate tax
    const appliedTaxRate = parseFloat(taxRate) || 0;
    const afterDiscount = totalAmount - discountAmount;
    const taxAmount = (afterDiscount * appliedTaxRate) / 100;
    const grandTotal = afterDiscount + taxAmount;

    const saleData = {
      customer,
      items: processedItems,
      totalAmount,
      discount: { type: discountType, value: discountValue },
      discountAmount,
      taxRate: appliedTaxRate,
      taxAmount,
      grandTotal,
      paymentMethod,
      prescription: prescription || null,
      notes
    };

    const sale = await createSaleTransaction(saleData, req.user._id);

    const populatedSale = await Sale.findById(sale._id)
      .populate('pharmacist', 'firstName lastName')
      .populate('customer.userId', 'firstName lastName email')
      .populate('prescription');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { sale: populatedSale }
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesSummary = async (req, res, next) => {
  try {
    const { period = 'day', date } = req.query;
    const anchor = date ? new Date(`${date}T12:00:00`) : new Date();
    let startDate;
    let endDate;

    if (period === 'year') {
      startDate = new Date(anchor.getFullYear(), 0, 1);
      endDate = new Date(anchor.getFullYear() + 1, 0, 1);
    } else if (period === 'month') {
      startDate = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      endDate = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    } else {
      startDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
      endDate = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 1);
    }

    const match = { createdAt: { $gte: startDate, $lt: endDate }, status: { $ne: 'returned' } };
    if (req.user.role === 'customer') match['customer.userId'] = req.user._id;

    const [summary] = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: {
        _id: '$_id',
        revenue: { $first: { $ifNull: ['$grandTotal', '$totalAmount'] } },
        itemsSold: { $sum: '$items.quantity' },
        estimatedCost: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.costAtSale', { $multiply: ['$items.priceAtSale', 0.6] }] }] } }
      } },
      { $group: {
        _id: null,
        transactionCount: { $sum: 1 },
        revenue: { $sum: '$revenue' },
        itemsSold: { $sum: '$itemsSold' },
        estimatedCost: { $sum: '$estimatedCost' }
      } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        transactionCount: summary?.transactionCount || 0,
        revenue: summary?.revenue || 0,
        itemsSold: summary?.itemsSold || 0,
        estimatedCost: summary?.estimatedCost || 0,
        estimatedProfit: (summary?.revenue || 0) - (summary?.estimatedCost || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, pharmacist, paymentMethod, status, orderNumber } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (pharmacist) query.pharmacist = pharmacist;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: 'i' };

    if (req.user.role === 'customer') {
      query['customer.userId'] = req.user._id;
    }

    const skip = (page - 1) * limit;

    const sales = await Sale.find(query)
      .populate('pharmacist', 'firstName lastName')
      .populate('customer.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Sale.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('pharmacist', 'firstName lastName email')
      .populate('customer.userId', 'firstName lastName email')
      .populate('prescription')
      .populate('items.medicine');

    if (!sale) {
      return next(new AppError('Sale not found', 404));
    }

    if (req.user.role === 'customer' && sale.customer.userId?.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to view this sale', 403));
    }

    const returnHistory = await Return.find({ originalSale: sale._id })
      .select('returnNumber status items.quantity items.medicine items.medicineName createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { sale: { ...sale.toObject(), returnHistory } }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (req.user.role === 'customer' && req.user._id.toString() !== req.params.customerId) {
      return next(new AppError('Not authorized to view these sales', 403));
    }

    const sales = await Sale.find({ 'customer.userId': req.params.customerId })
      .populate('pharmacist', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Sale.countDocuments({ 'customer.userId': req.params.customerId });

    res.status(200).json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateReceipt = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('pharmacist', 'firstName lastName')
      .populate('customer.userId', 'firstName lastName');

    if (!sale) {
      return next(new AppError('Sale not found', 404));
    }

    if (req.user.role === 'customer' && sale.customer.userId?.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to generate this receipt', 403));
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${sale.orderNumber}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('Pharmacy Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order Number: ${sale.orderNumber}`);
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
    doc.text(`Pharmacist: ${sale.pharmacist.firstName} ${sale.pharmacist.lastName}`);
    doc.moveDown();

    doc.fontSize(12).text('Items:');
    doc.fontSize(10);
    sale.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.medicineName}`);
      doc.text(`   Qty: ${item.quantity} x ₹${item.priceAtSale.toFixed(2)} = ₹${item.subtotal.toFixed(2)}`);
    });

    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Subtotal: ₹${sale.totalAmount.toFixed(2)}`, { align: 'right' });
    if (sale.discountAmount > 0) {
      doc.text(`Discount (${sale.discount?.type === 'percentage' ? sale.discount.value + '%' : 'Fixed'}): -₹${sale.discountAmount.toFixed(2)}`, { align: 'right' });
    }
    if (sale.taxAmount > 0) {
      doc.text(`Tax (${sale.taxRate}%): +₹${sale.taxAmount.toFixed(2)}`, { align: 'right' });
    }
    doc.moveDown(0.3);
    doc.fontSize(12).text(`Payment Method: ${sale.paymentMethod.toUpperCase()}`);
    doc.fontSize(14).text(`Grand Total: ₹${(sale.grandTotal || sale.totalAmount).toFixed(2)}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
