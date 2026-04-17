import Medicine from '../models/Medicine.js';
import StockTransaction from '../models/StockTransaction.js';
import Batch from '../models/Batch.js';
import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';

export const updateStock = async (medicineId, quantity, type, performedBy, referenceId = null, referenceModel = null, notes = '', session = null) => {
  const sessionToUse = session || await mongoose.startSession();
  const shouldCommit = !session;

  try {
    if (shouldCommit) {
      await sessionToUse.startTransaction();
    }

    const medicine = await Medicine.findById(medicineId).session(sessionToUse);

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    const newStockQuantity = medicine.stockQuantity + quantity;

    if (newStockQuantity < 0) {
      throw new AppError(`Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`, 400);
    }

    medicine.stockQuantity = newStockQuantity;
    await medicine.save({ session: sessionToUse });

    await StockTransaction.create([{
      medicine: medicineId,
      type,
      quantity,
      balanceAfter: newStockQuantity,
      performedBy,
      referenceId,
      referenceModel,
      notes
    }], { session: sessionToUse });

    if (shouldCommit) {
      await sessionToUse.commitTransaction();
    }

    return medicine;
  } catch (error) {
    if (shouldCommit) {
      await sessionToUse.abortTransaction();
    }
    throw error;
  } finally {
    if (shouldCommit) {
      sessionToUse.endSession();
    }
  }
};

export const checkAndUpdateExpiredMedicines = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredMedicines = await Medicine.updateMany(
    { expiryDate: { $lt: today }, status: { $ne: 'expired' } },
    { $set: { status: 'expired' } }
  );

  // Also mark expired batches
  await Batch.updateMany(
    { expiryDate: { $lt: today }, status: 'active' },
    { $set: { status: 'expired' } }
  );

  return expiredMedicines;
};

/**
 * FIFO dispensing: deduct quantity from oldest-expiry batches first.
 * Returns an array of { batchId, batchNumber, quantityDeducted } for traceability.
 * Does NOT update the Medicine.stockQuantity — caller is responsible for that.
 *
 * @param {string} medicineId
 * @param {number} quantity - positive number to dispense
 * @param {Object} session - mongoose session (optional)
 * @returns {Array<{batchId, batchNumber, quantityDeducted}>}
 */
export const dispenseFIFO = async (medicineId, quantity, session = null) => {
  const batches = await Batch.find({
    medicine: medicineId,
    status: 'active',
    quantity: { $gt: 0 }
  }).sort({ expiryDate: 1 }).session(session);

  let remaining = quantity;
  const deductions = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const deduct = Math.min(batch.quantity, remaining);
    batch.quantity -= deduct;
    if (batch.quantity === 0) {
      batch.status = 'depleted';
    }
    await batch.save({ session });

    deductions.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      quantityDeducted: deduct
    });

    remaining -= deduct;
  }

  if (remaining > 0) {
    throw new AppError(`Insufficient batch stock. Short by ${remaining} units.`, 400);
  }

  return deductions;
};

/**
 * Restore stock to batches (e.g., for returns). Adds back to the original batch if found,
 * otherwise creates a restoration entry on the most recent active batch.
 *
 * @param {string} medicineId
 * @param {number} quantity - positive number to restore
 * @param {string} batchNumber - optional specific batch to restore to
 * @param {Object} session - mongoose session (optional)
 */
export const restoreToBatch = async (medicineId, quantity, batchNumber = null, session = null) => {
  let batch;

  if (batchNumber) {
    batch = await Batch.findOne({ medicine: medicineId, batchNumber }).session(session);
  }

  if (!batch) {
    // Find the most recent active batch for this medicine
    batch = await Batch.findOne({ medicine: medicineId, status: { $in: ['active', 'depleted'] } })
      .sort({ createdAt: -1 })
      .session(session);
  }

  if (batch) {
    batch.quantity += quantity;
    if (batch.status === 'depleted') {
      batch.status = 'active';
    }
    await batch.save({ session });
  }
  // If no batch exists, the stock is tracked only at the Medicine level (backward compat)
};
