import Sale from '../models/Sale.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import { supportsTransactions, updateStock } from './inventoryService.js';

export const createSaleTransaction = async (saleData, pharmacistId) => {
  const session = supportsTransactions() ? await mongoose.startSession() : null;

  try {
    if (session) await session.startTransaction();

    for (const item of saleData.items) {
      const medicineQuery = Medicine.findById(item.medicine);
      const medicine = session ? await medicineQuery.session(session) : await medicineQuery;

      if (!medicine) {
        throw new AppError(`Medicine with ID ${item.medicine} not found`, 404);
      }

      if (medicine.status !== 'active') {
        throw new AppError(`${medicine.name} is not available for sale`, 400);
      }

      if (medicine.stockQuantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${medicine.name}. Available: ${medicine.stockQuantity}`, 400);
      }
    }

    if (saleData.prescription) {
      const prescriptionQuery = Prescription.findById(saleData.prescription);
      const prescription = session ? await prescriptionQuery.session(session) : await prescriptionQuery;

      if (!prescription) {
        throw new AppError('Prescription not found', 404);
      }

      if (prescription.status !== 'verified') {
        throw new AppError('Prescription must be verified before fulfilling', 400);
      }

      if (new Date(prescription.expiryDate) < new Date()) {
        throw new AppError('Prescription has expired', 400);
      }
    }

    const sale = new Sale({
      ...saleData,
      pharmacist: pharmacistId
    });
    await sale.validate();

    for (const item of saleData.items) {
      await updateStock(
        item.medicine,
        -item.quantity,
        'sale',
        pharmacistId,
        sale._id,
        'Sale',
        `Sale: ${sale.orderNumber}`,
        session
      );
    }

    await sale.save(session ? { session } : undefined);

    if (saleData.prescription) {
        await Prescription.findByIdAndUpdate(
        saleData.prescription,
        { $set: { status: 'fulfilled' }, $push: { fulfilledSales: sale._id } },
          session ? { session } : undefined
      );
    }

      if (session) await session.commitTransaction();
    return sale;
  } catch (error) {
      if (session) await session.abortTransaction();
    throw error;
  } finally {
      if (session) session.endSession();
  }
};
