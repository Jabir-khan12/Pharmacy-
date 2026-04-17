import { useEffect, useState } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Download } from 'lucide-react';
import { downloadCSV } from '../utils/downloadCSV';

const Reports = () => {
  const [dailySales, setDailySales] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dailyRes, revenueRes, inventoryRes, topRes] = await Promise.all([
        api.get('/reports/sales/daily'),
        api.get('/reports/revenue', { params: { period: 'daily' } }),
        api.get('/reports/inventory-status'),
        api.get('/reports/top-selling')
      ]);

      setDailySales(dailyRes.data.data);
      setRevenue(revenueRes.data.data.breakdown || []);
      setInventory(inventoryRes.data.data);
      setTopSelling(topRes.data.data.topSelling || []);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const inventoryData = inventory ? [
    { name: 'In Stock', value: inventory.summary.inStock },
    { name: 'Low Stock', value: inventory.summary.lowStock },
    { name: 'Out of Stock', value: inventory.summary.outOfStock }
  ] : [];

  const colors = ['#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('/export/sales', {}, 'sales_report.csv')}
            className="btn btn-secondary flex items-center text-sm"
          >
            <Download className="w-4 h-4 mr-1" /> Sales
          </button>
          <button
            onClick={() => downloadCSV('/export/inventory', {}, 'inventory_report.csv')}
            className="btn btn-secondary flex items-center text-sm"
          >
            <Download className="w-4 h-4 mr-1" /> Inventory
          </button>
          <button
            onClick={() => downloadCSV('/export/top-selling', {}, 'top_selling.csv')}
            className="btn btn-secondary flex items-center text-sm"
          >
            <Download className="w-4 h-4 mr-1" /> Top Selling
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-500">Today's Sales</p>
          <p className="text-2xl font-bold">{dailySales?.totalSales || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Today's Revenue</p>
          <p className="text-2xl font-bold">₹{dailySales?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold">₹{inventory?.summary.totalInventoryValue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Inventory Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventoryData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Top Selling Medicines</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSelling}>
              <XAxis dataKey="medicineName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalQuantity" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
