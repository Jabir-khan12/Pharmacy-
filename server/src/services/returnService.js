import Return from '../models/Return.js';
import Sale from '../models/Sale.js';
import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { supportsTransactions, updateStock } from './inventoryService.js';

export const createReturnTransaction = async (returnData, returnedBy) => {
  const session = supportsTransactions() ? await mongoose.startSession() : null;

  try {
    if (session) await session.startTransaction();

    const saleQuery = Sale.findById(returnData.originalSale);
    const originalSale = session ? await saleQuery.session(session) : await saleQuery;

    if (!originalSale) {
      throw new AppError('Original sale not found', 404);
    }

    // Get all existing approved/pending returns for this sale to check cumulative quantities
    const existingReturnsQuery = Return.find({
      originalSale: returnData.originalSale,
      status: { $in: ['approved', 'pending'] }
    });
    const existingReturnDocs = session
      ? await existingReturnsQuery.session(session)
      : await existingReturnsQuery;

    // Build map of already-returned quantities per medicine
    const returnedQuantities = {};
    for (const ret of existingReturnDocs) {
      for (const item of ret.items) {
        const medId = item.medicine.toString();
        returnedQuantities[medId] = (returnedQuantities[medId] || 0) + item.quantity;
      }
    }

    for (const returnItem of returnData.items) {
      const saleItem = originalSale.items.find(
        (item) => item.medicine.toString() === returnItem.medicine.toString()
      );

      if (!saleItem) {
        throw new AppError('Return item not found in original sale', 400);
      }

      const alreadyReturned = returnedQuantities[returnItem.medicine.toString()] || 0;
      const remainingReturnable = saleItem.quantity - alreadyReturned;

      if (returnItem.quantity > remainingReturnable) {
        throw new AppError(
          `Return quantity (${returnItem.quantity}) exceeds remaining returnable quantity (${remainingReturnable}) for ${returnItem.medicineName}`,
          400
        );
      }
    }

    const returnDoc = new Return({
      ...returnData,
      returnedBy
    });

    await returnDoc.save(session ? { session } : undefined);

    if (session) await session.commitTransaction();
    return returnDoc;
  } catch (error) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) session.endSession();
  }
};

export const approveReturnTransaction = async (returnId, approvedBy, approvalNotes) => {
  const session = supportsTransactions() ? await mongoose.startSession() : null;

  try {
    if (session) await session.startTransaction();

    const returnQuery = Return.findById(returnId);
    const returnDoc = session ? await returnQuery.session(session) : await returnQuery;

    if (!returnDoc) {
      throw new AppError('Return not found', 404);
    }

    if (returnDoc.status !== 'pending') {
      throw new AppError('Return has already been processed', 400);
    }

    for (const item of returnDoc.items) {
      if (item.restockable) {
        await updateStock(
          item.medicine,
          item.quantity,
          'return',
          approvedBy,
          returnDoc._id,
          'Return',
          `Return approved: ${returnDoc.returnNumber}`,
          session
        );
      }
    }

    returnDoc.status = 'approved';
    returnDoc.approvedBy = approvedBy;
    returnDoc.approvedAt = new Date();
    returnDoc.approvalNotes = approvalNotes || '';
    await returnDoc.save(session ? { session } : undefined);

    const originalSaleQuery = Sale.findById(returnDoc.originalSale);
    const originalSale = session ? await originalSaleQuery.session(session) : await originalSaleQuery;
    if (originalSale) {
      // Get ALL approved returns for this sale (including current one)
      const allApprovedReturnsQuery = Return.find({
        originalSale: returnDoc.originalSale,
        status: 'approved'
      });
      const approvedReturnDocs = session
        ? await allApprovedReturnsQuery.session(session)
        : await allApprovedReturnsQuery;

      // Build total returned quantities per medicine
      const totalReturned = {};
      for (const ret of approvedReturnDocs) {
        for (const item of ret.items) {
          const medId = item.medicine.toString();
          totalReturned[medId] = (totalReturned[medId] || 0) + item.quantity;
        }
      }

      // Check if all items are fully returned (quantity-level)
      const allFullyReturned = originalSale.items.every(saleItem => {
        const returned = totalReturned[saleItem.medicine.toString()] || 0;
        return returned >= saleItem.quantity;
      });

      const anyReturned = Object.keys(totalReturned).length > 0;

      if (allFullyReturned) {
        originalSale.status = 'returned';
      } else if (anyReturned) {
        originalSale.status = 'partially_returned';
      }
      await originalSale.save(session ? { session } : undefined);
    }

    if (session) await session.commitTransaction();
    return returnDoc;
  } catch (error) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) session.endSession();
  }
};
