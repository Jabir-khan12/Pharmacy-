import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { Package, DollarSign, AlertTriangle, FileText, TrendingUp, ShoppingCart, ClipboardList, Truck, Layers } from 'lucide-react';

const Dashboard = () => {
  const { user, isCustomer } = useAuth();
  const [stats, setStats] = useState({
    lowStock: 0,
    todaySales: { totalSales: 0, totalRevenue: 0 },
    expiringMedicines: 0,
    pendingOrders: 0,
    expiringBatches: 0
  });
  const [customerStats, setCustomerStats] = useState({
    prescriptions: [],
    recentSales: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCustomer) {
      fetchCustomerDashboard();
    } else {
      fetchStaffDashboard();
    }
  }, [isCustomer]);

  const fetchStaffDashboard = async () => {
    try {
      const [lowStockRes, salesRes, expiringRes, recentSalesRes, pendingPORes, expiringBatchRes] = await Promise.all([
        api.get('/medicines/low-stock'),
        api.get('/reports/sales/daily'),
        api.get('/medicines/expiring?days=30'),
        api.get('/sales?limit=5'),
        api.get('/purchase-orders?status=ordered&limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/batches?expiringSoon=true&limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } }))
      ]);

      setStats({
        lowStock: lowStockRes.data.data.count,
        todaySales: salesRes.data.data,
        expiringMedicines: expiringRes.data.data.count,
        pendingOrders: pendingPORes.data.data?.pagination?.total || 0,
        expiringBatches: expiringBatchRes.data.data?.pagination?.total || 0
      });

      // Build recent activity from latest sales
      const sales = recentSalesRes.data.data?.sales || [];
      setRecentActivity(
        sales.map((sale) => ({
          id: sale._id,
          type: 'sale',
          text: `Sale ${sale.orderNumber} — ₹${sale.totalAmount.toFixed(2)} (${sale.items.length} items)`,
          time: new Date(sale.createdAt).toLocaleString(),
          link: `/sales/${sale._id}`
        }))
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDashboard = async () => {
    try {
      const [prescriptionsRes, salesRes] = await Promise.all([
        api.get('/prescriptions?limit=5'),
        api.get(`/sales/customer/${user._id}?limit=5`)
      ]);

      setCustomerStats({
        prescriptions: prescriptionsRes.data.data?.prescriptions || [],
        recentSales: salesRes.data.data?.sales || []
      });
    } catch (error) {
      console.error('Error fetching customer dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // --- Customer Dashboard ---
  if (isCustomer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
          <p className="text-gray-600 mt-1">Here's your activity overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 p-2 rounded-lg">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold">My Prescriptions</h2>
            </div>
            {customerStats.prescriptions.length > 0 ? (
              <ul className="space-y-2">
                {customerStats.prescriptions.map((rx) => (
                  <li key={rx._id}>
                    <Link to={`/prescriptions/${rx._id}`} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                      <span className="font-medium text-sm">{rx.prescriptionNumber}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rx.status === 'verified' ? 'bg-green-100 text-green-700' :
                        rx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{rx.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No prescriptions yet.</p>
            )}
            <Link to="/prescriptions" className="text-blue-600 text-sm mt-3 inline-block hover:underline">View all →</Link>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold">My Purchases</h2>
            </div>
            {customerStats.recentSales.length > 0 ? (
              <ul className="space-y-2">
                {customerStats.recentSales.map((sale) => (
                  <li key={sale._id}>
                    <Link to={`/sales/${sale._id}`} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                      <span className="font-medium text-sm">{sale.orderNumber}</span>
                      <span className="text-sm text-gray-600">₹{sale.totalAmount.toFixed(2)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No purchases yet.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/prescriptions/upload" className="btn btn-primary text-center">
              Upload Prescription
            </Link>
            <Link to="/medicines" className="btn btn-secondary text-center">
              Browse Medicines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Staff/Admin Dashboard ---
  const statCards = [
    {
      title: "Today's Sales",
      value: stats.todaySales.totalSales || 0,
      subValue: `₹${stats.todaySales.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/sales'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock,
      subValue: 'Needs attention',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      link: '/medicines?filter=low-stock'
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringMedicines,
      subValue: 'Next 30 days',
      icon: Package,
      color: 'bg-red-500',
      link: '/medicines?filter=expiring'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      subValue: 'Awaiting delivery',
      icon: Truck,
      color: 'bg-blue-500',
      link: '/purchase-orders'
    },
    {
      title: 'Expiring Batches',
      value: stats.expiringBatches,
      subValue: 'Next 30 days',
      icon: Layers,
      color: 'bg-orange-500',
      link: '/medicines'
    }
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subValue}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/sales/new" className="btn btn-primary text-center">
            New Sale
          </Link>
          <Link to="/medicines/new" className="btn btn-secondary text-center">
            Add Medicine
          </Link>
          <Link to="/purchase-orders/new" className="btn btn-secondary text-center">
            Create Purchase Order
          </Link>
          <Link to="/reports" className="btn btn-secondary text-center">
            View Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="py-3">
                <Link to={activity.link} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-800">{activity.text}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{activity.time}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity to display</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
