import Medicine from '../models/Medicine.js';
import StockTransaction from '../models/StockTransaction.js';
import AppError from '../utils/AppError.js';
import { updateStock } from '../services/inventoryService.js';

export const getAllMedicines = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'expired' };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const medicines = await Medicine.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sort);

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        medicines,
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

export const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return next(new AppError('Medicine not found', 404));
    }

    const transactions = await StockTransaction.find({ medicine: req.params.id })
      .populate('performedBy', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        medicine,
        recentTransactions: transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createMedicine = async (req, res, next) => {
  try {
    const medicineData = req.body;

    const existingSKU = await Medicine.findOne({ sku: medicineData.sku });
    if (existingSKU) {
      return next(new AppError('SKU already exists', 400));
    }

    const medicine = await Medicine.create(medicineData);

    if (medicine.stockQuantity > 0) {
      await StockTransaction.create({
        medicine: medicine._id,
        type: 'purchase',
        quantity: medicine.stockQuantity,
        balanceAfter: medicine.stockQuantity,
        performedBy: req.user._id,
        notes: 'Initial stock'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return next(new AppError('Medicine not found', 404));
    }

    delete req.body.stockQuantity;

    if (req.body.sku && req.body.sku !== medicine.sku) {
      const existingSKU = await Medicine.findOne({ sku: req.body.sku });
      if (existingSKU) {
        return next(new AppError('SKU already exists', 400));
      }
    }

    Object.assign(medicine, req.body);
    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return next(new AppError('Medicine not found', 404));
    }

    medicine.status = 'discontinued';
    await medicine.save();

    res.status(200).json({
      success: true,
      message: 'Medicine discontinued successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { quantity, type, notes } = req.body;

    if (!quantity || !type) {
      return next(new AppError('Quantity and type are required', 400));
    }

    if (!['purchase', 'adjustment', 'damage', 'expiry'].includes(type)) {
      return next(new AppError('Invalid adjustment type', 400));
    }

    const medicine = await updateStock(
      req.params.id,
      quantity,
      type,
      req.user._id,
      null,
      null,
      notes || ''
    );

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({
      status: 'active',
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }
    }).sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      data: {
        count: medicines.length,
        medicines
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiringMedicines = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const medicines = await Medicine.find({
      status: 'active',
      expiryDate: { $gte: today, $lte: futureDate }
    }).sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      data: {
        count: medicines.length,
        medicines
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStockTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await StockTransaction.find({ medicine: req.params.id })
      .populate('performedBy', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await StockTransaction.countDocuments({ medicine: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        transactions,
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
