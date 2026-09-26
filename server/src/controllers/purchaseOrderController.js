import PurchaseOrder from '../models/PurchaseOrder.js';
import Medicine from '../models/Medicine.js';
import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { supportsTransactions, updateStock } from '../services/inventoryService.js';
import SupplierTransaction from '../models/SupplierTransaction.js';

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, items, expectedDeliveryDate, notes } = req.body;

    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        return next(new AppError(`Medicine not found: ${item.medicine}`, 404));
      }

      const subtotal = item.unitCost * item.quantity;
      totalAmount += subtotal;

      processedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal,
        batchNumber: item.batchNumber || '',
        expiryDate: item.expiryDate || null
      });
    }

    const po = await PurchaseOrder.create({
      supplier,
      items: processedItems,
      totalAmount,
      expectedDeliveryDate: expectedDeliveryDate || null,
      notes,
      createdBy: req.user._id
    });

    const populated = await PurchaseOrder.findById(po._id)
      .populate('supplier', 'name phone')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Purchase order created',
      data: { purchaseOrder: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, supplier, poNumber } = req.query;

    const query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (poNumber) query.poNumber = { $regex: poNumber, $options: 'i' };

    const skip = (page - 1) * limit;

    const orders = await PurchaseOrder.find(query)
      .populate('supplier', 'name phone')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await PurchaseOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        purchaseOrders: orders,
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

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('createdBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName')
      .populate('items.medicine', 'name price stockQuantity');

    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { purchaseOrder: po }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);

    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    // Validate status transitions
    const validTransitions = {
      draft: ['ordered', 'cancelled'],
      ordered: ['partially_received', 'received', 'cancelled'],
      partially_received: ['received', 'cancelled']
    };

    if (!validTransitions[po.status]?.includes(status)) {
      return next(new AppError(`Cannot change status from ${po.status} to ${status}`, 400));
    }

    po.status = status;
    if (status === 'cancelled') {
      // No stock updates needed for cancellation
    }
    
    await po.save();

    res.status(200).json({
      success: true,
      message: `Purchase order status updated to ${status}`,
      data: { purchaseOrder: po }
    });
  } catch (error) {
    next(error);
  }
};

export const receivePurchaseOrder = async (req, res, next) => {
  const session = supportsTransactions() ? await mongoose.startSession() : null;

  try {
    if (session) await session.startTransaction();

    const { receivedItems } = req.body;
    const poQuery = PurchaseOrder.findById(req.params.id);
    const po = session ? await poQuery.session(session) : await poQuery;

    if (!po) {
      throw new AppError('Purchase order not found', 404);
    }

    if (!['ordered', 'partially_received'].includes(po.status)) {
      throw new AppError('Purchase order cannot be received in current status', 400);
    }

    let receivedValue = 0;
    for (const received of receivedItems) {
      const poItem = po.items.id(received.itemId);
      if (!poItem) {
        throw new AppError(`PO item not found: ${received.itemId}`, 400);
      }

      const maxReceivable = poItem.quantity - poItem.receivedQuantity;
      if (received.quantity > maxReceivable) {
        throw new AppError(
          `Cannot receive ${received.quantity} of ${poItem.medicineName}. Max receivable: ${maxReceivable}`,
          400
        );
      }

      poItem.receivedQuantity += received.quantity;
      receivedValue += received.quantity * poItem.unitCost;
      if (received.batchNumber) poItem.batchNumber = received.batchNumber;
      if (received.expiryDate) poItem.expiryDate = received.expiryDate;

      // Update medicine stock
      await updateStock(
        poItem.medicine,
        received.quantity,
        'purchase',
        req.user._id,
        po._id,
        'PurchaseOrder',
        `PO received: ${po.poNumber}`,
        session
      );
    }

    // Determine new status
    const allReceived = po.items.every(item => item.receivedQuantity >= item.quantity);
    const someReceived = po.items.some(item => item.receivedQuantity > 0);

    if (allReceived) {
      po.status = 'received';
      po.receivedDate = new Date();
    } else if (someReceived) {
      po.status = 'partially_received';
    }

    po.receivedBy = req.user._id;
    await po.save(session ? { session } : undefined);

    const transactionData = [{
      supplier: po.supplier,
      type: 'purchase',
      amount: receivedValue,
      purchaseOrder: po._id,
      notes: `Received against ${po.poNumber}`,
      createdBy: req.user._id
    }];
    await SupplierTransaction.create(transactionData, session ? { session } : undefined);

    if (session) await session.commitTransaction();

    const populated = await PurchaseOrder.findById(po._id)
      .populate('supplier', 'name')
      .populate('createdBy', 'firstName lastName')
      .populate('receivedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Purchase order items received and stock updated',
      data: { purchaseOrder: populated }
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};
