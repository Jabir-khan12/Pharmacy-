import Return from '../models/Return.js';
import Sale from '../models/Sale.js';
import AppError from '../utils/AppError.js';
import { createReturnTransaction, approveReturnTransaction } from '../services/returnService.js';

export const createReturn = async (req, res, next) => {
  try {
    const { originalSale, items, returnFeeRate = 0 } = req.body;

    if (!items || items.length === 0) {
      return next(new AppError('Return must contain at least one item', 400));
    }

    const sale = await Sale.findById(originalSale);
    if (!sale) {
      return next(new AppError('Original sale not found', 404));
    }

    const processedItems = [];
    let refundAmount = 0;

    for (const item of items) {
      const saleItem = sale.items.find((si) => si.medicine.toString() === item.medicine);

      if (!saleItem) {
        return next(new AppError('Item not found in original sale', 400));
      }

      const itemRefund = saleItem.priceAtSale * item.quantity;
      refundAmount += itemRefund;

      processedItems.push({
        medicine: item.medicine,
        medicineName: saleItem.medicineName,
        quantity: item.quantity,
        priceAtSale: saleItem.priceAtSale,
        reason: item.reason,
        restockable: item.restockable !== undefined ? item.restockable : true
      });
    }

    const feeRate = Number(returnFeeRate) || 0;
    const returnFeeAmount = Math.round(refundAmount * feeRate) / 100;
    const returnData = {
      originalSale,
      items: processedItems,
      refundAmount: Math.round((refundAmount - returnFeeAmount) * 100) / 100,
      returnFeeRate: feeRate,
      returnFeeAmount
    };

    const returnDoc = await createReturnTransaction(returnData, req.user._id);

    const populatedReturn = await Return.findById(returnDoc._id)
      .populate('originalSale')
      .populate('returnedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Return created successfully',
      data: { return: populatedReturn }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const returns = await Return.find(query)
      .populate('originalSale', 'orderNumber totalAmount')
      .populate('returnedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Return.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        returns,
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

export const getReturnById = async (req, res, next) => {
  try {
    const returnDoc = await Return.findById(req.params.id)
      .populate('originalSale')
      .populate('returnedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .populate('items.medicine');

    if (!returnDoc) {
      return next(new AppError('Return not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { return: returnDoc }
    });
  } catch (error) {
    next(error);
  }
};

export const approveReturn = async (req, res, next) => {
  try {
    const { approvalNotes } = req.body;

    const returnDoc = await approveReturnTransaction(req.params.id, req.user._id, approvalNotes);

    const populatedReturn = await Return.findById(returnDoc._id)
      .populate('originalSale')
      .populate('returnedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Return approved successfully',
      data: { return: populatedReturn }
    });
  } catch (error) {
    next(error);
  }
};

export const rejectReturn = async (req, res, next) => {
  try {
    const { approvalNotes } = req.body;

    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return next(new AppError('Return not found', 404));
    }

    if (returnDoc.status !== 'pending') {
      return next(new AppError('Return has already been processed', 400));
    }

    returnDoc.status = 'rejected';
    returnDoc.approvedBy = req.user._id;
    returnDoc.approvedAt = new Date();
    returnDoc.approvalNotes = approvalNotes || '';
    await returnDoc.save();

    const populatedReturn = await Return.findById(returnDoc._id)
      .populate('originalSale')
      .populate('returnedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Return rejected',
      data: { return: populatedReturn }
    });
  } catch (error) {
    next(error);
  }
};
