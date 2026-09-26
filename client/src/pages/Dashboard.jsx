import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { Package, DollarSign, AlertTriangle, FileText, TrendingUp, ShoppingCart, ClipboardList, Truck, Layers, CreditCard, WalletCards, Search, SlidersHorizontal, X } from 'lucide-react';

const Dashboard = () => {
  const { user, isCustomer } = useAuth();
  const [stats, setStats] = useState({
    lowStock: 0,
    todaySales: { totalSales: 0, totalRevenue: 0 },
    expiringMedicines: 0,
    pendingOrders: 0,
    expiringBatches: 0,
    financialOverview: { inventoryCost: 0, supplierLoans: 0, operatingCosts: 0 },
    todayProfit: 0
  });
  const [customerStats, setCustomerStats] = useState({
    prescriptions: [],
    recentSales: []
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const today = new Date().toISOString().slice(0, 10);
  const [dateFilter, setDateFilter] = useState({
    startDate: today,
    endDate: today
  });

  useEffect(() => {
    if (isCustomer) {
      fetchCustomerDashboard();
    } else {
      fetchStaffDashboard();
    }
  }, [isCustomer, dateFilter.startDate, dateFilter.endDate]);

  const fetchStaffDashboard = async () => {
    try {
      const selectedStartDate = dateFilter.startDate || today;
      const selectedEndDate = dateFilter.endDate || selectedStartDate;

      const [lowStockRes, salesRes, expiringRes, recentSalesRes, pendingPORes, expiringBatchRes, financialRes, summaryRes] = await Promise.all([
        api.get('/medicines/low-stock'),
        api.get('/sales', {
          params: {
            startDate: selectedStartDate,
            endDate: selectedEndDate,
            limit: 5
          }
        }),
        api.get('/medicines/expiring?days=30'),
        api.get('/sales', {
          params: {
            startDate: selectedStartDate,
            endDate: selectedEndDate,
            limit: 5
          }
        }),
        api.get('/purchase-orders?status=ordered&limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/batches?expiringSoon=true&limit=1').catch(() => ({ data: { data: { pagination: { total: 0 } } } })),
        api.get('/reports/financial-overview').catch(() => ({ data: { data: { inventoryCost: 0, supplierLoans: 0, operatingCosts: 0 } } })),
        api.get('/reports/financial-summary', {
          params: {
            startDate: selectedStartDate,
            endDate: selectedEndDate
          }
        }).catch(() => ({ data: { data: { netProfit: 0, moneyReceived: 0 } } }))
      ]);

      const salesData = salesRes.data.data || { sales: [], pagination: { total: 0 } };
      const salesRevenue = summaryRes.data.data?.moneyReceived ?? 0;

      setStats({
        lowStock: lowStockRes.data.data.count,
        todaySales: {
          totalSales: salesData.pagination?.total || salesData.sales?.length || 0,
          totalRevenue: salesRevenue
        },
        expiringMedicines: expiringRes.data.data.count,
        pendingOrders: pendingPORes.data.data?.pagination?.total || 0,
        expiringBatches: expiringBatchRes.data.data?.pagination?.total || 0,
        financialOverview: financialRes.data.data,
        todayProfit: summaryRes.data.data.netProfit || 0
      });

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
      value: `₹${stats.todaySales.totalRevenue?.toFixed(2) || '0.00'}`,
      subValue: `${stats.todaySales.totalSales || 0} sales • Money received`,
      icon: DollarSign,
      color: 'bg-green-500',
      link: `/sales?startDate=${new Date().toISOString().slice(0, 10)}&endDate=${new Date().toISOString().slice(0, 10)}`,
      category: 'sales'
    },
    {
      title: 'Medicines Running Low',
      value: stats.lowStock,
      subValue: 'Needs attention',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      link: '/medicines?filter=low-stock',
      category: 'inventory'
    },
    {
      title: 'Medicines Expiring Soon',
      value: stats.expiringMedicines,
      subValue: 'Next 30 days',
      icon: Package,
      color: 'bg-red-500',
      link: '/medicines?filter=expiring',
      category: 'inventory'
    },
    {
      title: 'Orders Waiting for Delivery',
      value: stats.pendingOrders,
      subValue: 'Awaiting delivery',
      icon: Truck,
      color: 'bg-blue-500',
      link: '/purchase-orders?status=ordered',
      category: 'orders'
    },
    {
      title: 'Batches Expiring Soon',
      value: stats.expiringBatches,
      subValue: 'Next 30 days',
      icon: Layers,
      color: 'bg-orange-500',
      link: '/batches?filter=expiring-soon',
      category: 'inventory'
    },
    {
      title: 'Money Owed to Suppliers',
      value: `₹${stats.financialOverview.supplierLoans.toFixed(2)}`,
      subValue: 'Unpaid medicine purchases',
      icon: CreditCard,
      color: 'bg-red-500',
      link: '/suppliers?view=outstanding',
      category: 'finance'
    },
    {
      title: 'Stock Purchase Cost',
      value: `₹${stats.financialOverview.inventoryCost.toFixed(2)}`,
      subValue: 'What current stock cost us',
      icon: WalletCards,
      color: 'bg-purple-500',
      link: '/reports',
      category: 'finance'
    },
    {
      title: 'Business Costs',
      value: `₹${stats.financialOverview.operatingCosts.toFixed(2)}`,
      subValue: 'Expenses and staff pay',
      icon: WalletCards,
      color: 'bg-orange-500',
      link: '/accounting',
      category: 'finance'
    },
    {
      title: "Today's Profit",
      value: `₹${stats.todayProfit.toFixed(2)}`,
      subValue: 'After medicine cost and shop costs',
      icon: TrendingUp,
      color: 'bg-green-500',
      link: '/reports',
      category: 'finance'
    }
  ];

  const dashboardFilters = [
    { id: 'all', label: 'All' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'sales', label: 'Sales' },
    { id: 'orders', label: 'Orders' },
    { id: 'finance', label: 'Finance' }
  ];

  const filteredStatCards = statCards.filter((stat) => {
    const matchesFilter = activeFilter === 'all' || stat.category === activeFilter;
    const searchValue = searchTerm.trim().toLowerCase();
    const matchesSearch = !searchValue || `${stat.title} ${stat.subValue}`.toLowerCase().includes(searchValue);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Here is what needs attention today.</p>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-gray-700">
              Start date
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                className="input mt-1 min-w-[150px]"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              End date
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                className="input mt-1 min-w-[150px]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setDateFilter({ startDate: today, endDate: today })}
            className="btn btn-secondary"
          >
            Today
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dashboard items, sales, stock, reports..."
              className="input pl-9"
              aria-label="Search dashboard items"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </div>
            {dashboardFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === filter.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
            {(searchTerm || activeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                }}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {filteredStatCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStatCards.map((stat, index) => (
            <Link key={`${stat.title}-${index}`} to={stat.link}>
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
      ) : (
        <div className="card border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
          <p className="text-gray-600">No dashboard items match your search or filter.</p>
        </div>
      )}

      {/* Critical Actions */}
      {(stats.lowStock > 0 || stats.expiringMedicines > 0 || stats.expiringBatches > 0 || stats.pendingOrders > 0) && (
        <div className="card border-l-4 border-red-500 bg-red-50">
          <h2 className="text-lg font-semibold text-red-900 mb-3">Critical Actions</h2>
          <div className="flex flex-wrap gap-3">
            {stats.lowStock > 0 && (
              <Link to="/medicines?filter=low-stock" className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200">
                <AlertTriangle className="h-4 w-4" /> {stats.lowStock} low-stock medicines
              </Link>
            )}
            {stats.expiringMedicines > 0 && (
              <Link to="/medicines?filter=expiring" className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 hover:bg-orange-200">
                <Package className="h-4 w-4" /> {stats.expiringMedicines} expiring medicines
              </Link>
            )}
            {stats.expiringBatches > 0 && (
              <Link to="/batches?filter=expiring-soon" className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 hover:bg-orange-200">
                <Layers className="h-4 w-4" /> {stats.expiringBatches} expiring batches
              </Link>
            )}
            {stats.pendingOrders > 0 && (
              <Link to="/purchase-orders?status=ordered" className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-200">
                <Truck className="h-4 w-4" /> {stats.pendingOrders} awaiting delivery
              </Link>
            )}
          </div>
        </div>
      )}

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
            Order Medicines
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
