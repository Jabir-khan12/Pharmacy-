import Supplier from '../models/Supplier.js';
import AppError from '../utils/AppError.js';

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        suppliers,
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

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!supplier) {
      return next(new AppError('Supplier not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return next(new AppError('Supplier not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return next(new AppError('Supplier not found', 404));
    }

    // Soft-delete: mark as inactive instead of hard delete
    supplier.status = 'inactive';
    await supplier.save();

    res.status(200).json({
      success: true,
      message: 'Supplier deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};
