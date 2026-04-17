import Sale from '../models/Sale.js';
import Medicine from '../models/Medicine.js';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns';

export const getDailySales = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'returned' }
    }).populate('pharmacist', 'firstName lastName');

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    const paymentMethodBreakdown = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        totalSales,
        totalRevenue,
        paymentMethodBreakdown,
        sales: sales.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlySales = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const targetDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);

    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    const sales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'returned' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalSales = sales.reduce((sum, day) => sum + day.totalSales, 0);
    const totalRevenue = sales.reduce((sum, day) => sum + day.totalRevenue, 0);

    res.status(200).json({
      success: true,
      data: {
        month: targetDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalSales,
        totalRevenue,
        dailyBreakdown: sales
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    let dateFormat;
    switch (period) {
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const matchQuery = { status: { $ne: 'returned' } };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = endOfDay(new Date(endDate));
    }

    const revenueData = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalSales = revenueData.reduce((sum, item) => sum + item.salesCount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalSales,
        averageOrderValue,
        breakdown: revenueData
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryStatus = async (req, res, next) => {
  try {
    const totalMedicines = await Medicine.countDocuments({ status: 'active' });
    const outOfStock = await Medicine.countDocuments({ status: 'active', stockQuantity: 0 });
    const lowStock = await Medicine.countDocuments({
      status: 'active',
      stockQuantity: { $gt: 0 },
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }
    });
    const inStock = totalMedicines - outOfStock - lowStock;

    const categoryBreakdown = await Medicine.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalInventoryValue = await Medicine.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalMedicines,
          inStock,
          lowStock,
          outOfStock,
          totalInventoryValue: totalInventoryValue[0]?.totalValue || 0
        },
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiringMedicines = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = await Medicine.find({
      status: 'active',
      expiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    }).sort({ expiryDate: 1 });

    const expired = await Medicine.find({ expiryDate: { $lt: today } }).sort({ expiryDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        expiringSoon: {
          count: expiringSoon.length,
          medicines: expiringSoon
        },
        expired: {
          count: expired.length,
          medicines: expired.slice(0, 20)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTopSelling = async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const startDate = subDays(new Date(), parseInt(days));

    const topSelling = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'returned' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          medicineName: { $first: '$items.medicineName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const populatedTopSelling = await Medicine.populate(topSelling, {
      path: '_id',
      select: 'name category stockQuantity price'
    });

    res.status(200).json({
      success: true,
      data: {
        period: `Last ${days} days`,
        topSelling: populatedTopSelling
      }
    });
  } catch (error) {
    next(error);
  }
};
