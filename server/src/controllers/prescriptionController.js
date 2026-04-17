import Prescription from '../models/Prescription.js';
import AppError from '../utils/AppError.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new AppError('Only PDF and image files are allowed', 400));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

export const uploadPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a prescription file', 400));
    }

    const { doctorName, doctorContact, prescribedMedicines, expiryDays = 30 } = req.body;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

    const prescription = await Prescription.create({
      customer: req.user._id,
      doctorName,
      doctorContact,
      uploadedFile: `/uploads/prescriptions/${req.file.filename}`,
      prescribedMedicines: JSON.parse(prescribedMedicines || '[]'),
      expiryDate
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: { prescription }
    });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(process.cwd(), 'uploads', 'prescriptions', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

export const getAllPrescriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, customerId } = req.query;

    const query = {};
    if (status) query.status = status;

    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (customerId) {
      query.customer = customerId;
    }

    const skip = (page - 1) * limit;

    const prescriptions = await Prescription.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('verifiedBy', 'firstName lastName')
      .populate('fulfilledSales', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
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

export const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('verifiedBy', 'firstName lastName')
      .populate('fulfilledSales', 'orderNumber totalAmount createdAt');

    if (!prescription) {
      return next(new AppError('Prescription not found', 404));
    }

    if (req.user.role === 'customer' && prescription.customer._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to view this prescription', 403));
    }

    res.status(200).json({
      success: true,
      data: { prescription }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPrescription = async (req, res, next) => {
  try {
    const { prescribedMedicines, verificationNotes, status = 'verified' } = req.body;

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return next(new AppError('Prescription not found', 404));
    }

    if (prescription.status !== 'pending') {
      return next(new AppError('Prescription has already been processed', 400));
    }

    if (prescribedMedicines) {
      prescription.prescribedMedicines = prescribedMedicines;
    }

    prescription.status = status;
    prescription.verifiedBy = req.user._id;
    prescription.verifiedAt = new Date();
    prescription.verificationNotes = verificationNotes || '';

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('customer', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `Prescription ${status}`,
      data: { prescription: populatedPrescription }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Securely serve prescription file.
 * Only accessible to the prescription owner, pharmacists, and admins.
 */
export const getPrescriptionFile = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return next(new AppError('Prescription not found', 404));
    }

    // Only owner, pharmacist, or admin can view the file
    if (
      req.user.role === 'customer' &&
      prescription.customer.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to view this file', 403));
    }

    // Extract filename and resolve path
    const filename = path.basename(prescription.uploadedFile);
    const filePath = path.join(process.cwd(), 'uploads', 'prescriptions', filename);

    if (!fs.existsSync(filePath)) {
      return next(new AppError('Prescription file not found on server', 404));
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};
