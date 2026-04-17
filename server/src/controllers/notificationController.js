import Notification from '../models/Notification.js';
import Medicine from '../models/Medicine.js';
import AppError from '../utils/AppError.js';

export const createNotification = async (type, medicine, title, message, priority = 'medium', targetRoles = ['admin', 'pharmacist']) => {
  const notification = await Notification.create({
    type,
    medicine,
    title,
    message,
    priority,
    targetRoles
  });
  return notification;
};

export const getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const userId = req.user._id;

    const query = { targetRoles: { $in: [req.user.role] } };

    if (isRead === 'true') {
      query['readBy.user'] = userId;
    } else if (isRead === 'false') {
      query['readBy.user'] = { $ne: userId };
    }
    if (type) query.type = type;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('medicine', 'name stockQuantity expiryDate')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Add per-user isRead flag
    const enriched = notifications.map(n => ({
      ...n,
      isRead: n.readBy?.some(r => r.user.toString() === userId.toString()) || false
    }));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      targetRoles: { $in: [req.user.role] },
      'readBy.user': { $ne: userId }
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: enriched,
        unreadCount,
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

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    // Authorization: user's role must be in targetRoles
    if (!notification.targetRoles.includes(req.user.role)) {
      return next(new AppError('Not authorized to access this notification', 403));
    }

    // Only push if not already read by this user
    const alreadyRead = notification.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );
    if (!alreadyRead) {
      notification.readBy.push({ user: req.user._id, readAt: new Date() });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    // Only admins can delete notifications
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can delete notifications', 403));
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        targetRoles: { $in: [req.user.role] },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const checkLowStock = async () => {
  try {
    const lowStockMedicines = await Medicine.find({
      status: 'active',
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }
    });

    for (const medicine of lowStockMedicines) {
      const existingNotification = await Notification.findOne({
        medicine: medicine._id,
        type: medicine.stockQuantity === 0 ? 'out_of_stock' : 'low_stock',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existingNotification) {
        const type = medicine.stockQuantity === 0 ? 'out_of_stock' : 'low_stock';
        const title = medicine.stockQuantity === 0 ? 'Out of Stock Alert' : 'Low Stock Alert';
        const message = medicine.stockQuantity === 0
          ? `${medicine.name} is out of stock`
          : `${medicine.name} is running low. Current stock: ${medicine.stockQuantity}, Reorder level: ${medicine.reorderLevel}`;

        await createNotification(type, medicine._id, title, message, 'high');
      }
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
};

export const checkExpiringMedicines = async () => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringIn30Days = await Medicine.find({
      status: 'active',
      expiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    });

    for (const medicine of expiringIn30Days) {
      const daysUntilExpiry = Math.ceil((new Date(medicine.expiryDate) - today) / (1000 * 60 * 60 * 24));

      const notificationType = daysUntilExpiry <= 7 ? 'expiry_7_days' : 'expiry_30_days';
      const priority = daysUntilExpiry <= 7 ? 'urgent' : 'high';

      const existingNotification = await Notification.findOne({
        medicine: medicine._id,
        type: notificationType,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existingNotification) {
        const title = `Expiry Alert - ${daysUntilExpiry} days`;
        const message = `${medicine.name} will expire in ${daysUntilExpiry} days (${new Date(medicine.expiryDate).toLocaleDateString()})`;

        await createNotification(notificationType, medicine._id, title, message, priority);
      }
    }

    await Medicine.updateMany(
      { expiryDate: { $lt: today }, status: { $ne: 'expired' } },
      { $set: { status: 'expired' } }
    );
  } catch (error) {
    console.error('Error checking expiring medicines:', error);
  }
};
