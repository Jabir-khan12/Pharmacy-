import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';
import AppError from '../utils/AppError.js';

export const createBatch = async (req, res, next) => {
  try {
    const { medicine, batchNumber, expiryDate, quantity, costPrice, supplier, rackLocation, notes } = req.body;

    const med = await Medicine.findById(medicine);
    if (!med) {
      throw new AppError('Medicine not found', 404);
    }

    const existingBatch = await Batch.findOne({ medicine, batchNumber });
    if (existingBatch) {
      throw new AppError('A batch with this number already exists for this medicine', 400);
    }

    const batch = await Batch.create({
      medicine,
      batchNumber,
      expiryDate,
      quantity,
      initialQuantity: quantity,
      costPrice: costPrice || 0,
      supplier: supplier || null,
      rackLocation: rackLocation || med.rackLocation || '',
      receivedBy: req.user._id,
      notes
    });

    // Update medicine total stock
    med.stockQuantity += quantity;
    await med.save();

    await batch.populate('medicine', 'name sku');

    res.status(201).json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBatches = async (req, res, next) => {
  try {
    const { medicine, status, expiringSoon, page = 1, limit = 20 } = req.query;

    const query = {};
    if (medicine) query.medicine = medicine;
    if (status) query.status = status;

    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query.expiryDate = { $lte: thirtyDaysFromNow, $gt: new Date() };
      query.status = 'active';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Batch.countDocuments(query);

    const batches = await Batch.find(query)
      .populate('medicine', 'name sku category')
      .populate('supplier', 'name')
      .sort({ expiryDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: {
        batches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchesByMedicine = async (req, res, next) => {
  try {
    const { medicineId } = req.params;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    const batches = await Batch.find({ medicine: medicineId })
      .populate('supplier', 'name')
      .populate('receivedBy', 'firstName lastName')
      .sort({ expiryDate: 1 })
      .lean();

    const summary = {
      totalBatches: batches.length,
      activeBatches: batches.filter(b => b.status === 'active').length,
      totalStock: batches.filter(b => b.status === 'active').reduce((sum, b) => sum + b.quantity, 0),
      nearestExpiry: batches.find(b => b.status === 'active')?.expiryDate || null
    };

    res.status(200).json({
      success: true,
      data: { medicine: { _id: medicine._id, name: medicine.name, sku: medicine.sku }, batches, summary }
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchById = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('medicine', 'name sku category price')
      .populate('supplier', 'name contactPerson')
      .populate('receivedBy', 'firstName lastName')
      .populate('purchaseOrder', 'poNumber');

    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

export const adjustBatchQuantity = async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    if (batch.status !== 'active') {
      throw new AppError('Cannot adjust non-active batch', 400);
    }

    const newQuantity = batch.quantity + quantity;
    if (newQuantity < 0) {
      throw new AppError(`Cannot reduce below 0. Current batch quantity: ${batch.quantity}`, 400);
    }

    // Update medicine total stock
    const medicine = await Medicine.findById(batch.medicine);
    if (!medicine) {
      throw new AppError('Associated medicine not found', 404);
    }

    medicine.stockQuantity += quantity;
    if (medicine.stockQuantity < 0) {
      throw new AppError('Adjustment would cause negative total stock', 400);
    }
    await medicine.save();

    batch.quantity = newQuantity;
    if (newQuantity === 0) {
      batch.status = 'depleted';
    }
    batch.notes = `${batch.notes ? batch.notes + ' | ' : ''}Adjusted by ${quantity}: ${reason || 'Manual adjustment'}`;
    await batch.save();

    res.status(200).json({
      success: true,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

export const recallBatch = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    if (batch.status === 'recalled') {
      throw new AppError('Batch is already recalled', 400);
    }

    // Remove from medicine total stock
    const medicine = await Medicine.findById(batch.medicine);
    if (medicine) {
      medicine.stockQuantity = Math.max(0, medicine.stockQuantity - batch.quantity);
      await medicine.save();
    }

    batch.status = 'recalled';
    batch.notes = `${batch.notes ? batch.notes + ' | ' : ''}RECALLED: ${reason || 'No reason provided'}`;
    const previousQty = batch.quantity;
    batch.quantity = 0;
    await batch.save();

    res.status(200).json({
      success: true,
      message: `Batch recalled. ${previousQty} units removed from stock.`,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get FIFO-ordered active batches for a medicine (for dispensing).
 * Sorted by expiry date (earliest first).
 */
export const getFIFOBatches = async (req, res, next) => {
  try {
    const { medicineId } = req.params;

    const batches = await Batch.find({
      medicine: medicineId,
      status: 'active',
      quantity: { $gt: 0 }
    }).sort({ expiryDate: 1 }).lean();

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);

    res.status(200).json({
      success: true,
      data: { batches, totalAvailable }
    });
  } catch (error) {
    next(error);
  }
};
