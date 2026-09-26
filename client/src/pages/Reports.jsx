import { useEffect, useState } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { CalendarDays, Download, WalletCards } from 'lucide-react';
import { downloadCSV } from '../utils/downloadCSV';

const Reports = () => {
  const [dailySales, setDailySales] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [period, startDate, endDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportDate = startDate || new Date().toISOString().slice(0, 10);
      const [dailyRes, revenueRes, inventoryRes, topRes, financialRes, summaryRes] = await Promise.all([
        api.get('/reports/sales/daily', { params: startDate ? { date: startDate } : {} }),
        api.get('/reports/revenue', { params: { period, ...(startDate && { startDate }), ...(endDate && { endDate }) } }),
        api.get('/reports/inventory-status'),
        api.get('/reports/top-selling'),
        api.get('/reports/financial-overview'),
        api.get('/reports/financial-summary', { params: { period: period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : period === 'monthly' ? 'monthly' : 'yearly', date: reportDate, ...(startDate && { startDate }), ...(endDate && { endDate }) } })
      ]);

      setDailySales(dailyRes.data.data);
      setRevenue(revenueRes.data.data.breakdown || []);
      setInventory(inventoryRes.data.data);
      setTopSelling(topRes.data.data.topSelling || []);
      setFinancial(financialRes.data.data);
      setSummary(summaryRes.data.data);
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
  const reportLabel = period === 'yearly' ? 'Yearly' : period === 'monthly' ? 'Monthly' : period === 'weekly' ? 'Weekly' : 'Daily';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
          <p className="mt-1 text-sm text-gray-500">See sales, stock value, and money owed to suppliers.</p>
        </div>
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
            <Download className="w-4 h-4 mr-1" /> Best-Selling Medicines
          </button>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium text-gray-700">Show results by
          <select className="input mt-1" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">From
          <span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="date" className="input pl-9" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></span>
        </label>
        <label className="text-sm font-medium text-gray-700">To
          <span className="relative mt-1 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="date" className="input pl-9" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></span>
        </label>
        <button type="button" className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear dates</button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">{reportLabel} business results</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card">
          <p className="text-sm text-gray-500">Sales</p>
          <p className="text-2xl font-bold">{summary?.salesCount || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Money received</p>
          <p className="text-2xl font-bold">₹{(summary?.moneyReceived || 0).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Medicine cost sold</p>
          <p className="text-2xl font-bold">₹{(summary?.medicineCostSold || 0).toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">Cost of medicines sold in this period</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Shop costs</p>
          <p className="text-2xl font-bold">₹{(summary?.shopCosts || 0).toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">Expenses and staff pay</p>
        </div>
        <div className="card border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Net profit</p>
          <p className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>₹{(summary?.netProfit || 0).toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">Money received minus medicine cost and shop costs</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">Current stock and money owed</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card"><p className="text-sm text-gray-500">Stock selling value</p><p className="text-2xl font-bold">₹{(summary?.stockSellingValue || 0).toFixed(2)}</p><p className="mt-1 text-xs text-gray-500">What current stock could sell for</p></div>
        <div className="card"><p className="text-sm text-gray-500">Current stock cost</p><p className="text-2xl font-bold">₹{(summary?.currentStockCost || 0).toFixed(2)}</p><p className="mt-1 text-xs text-gray-500">Cost of stock still on shelves</p></div>
        <div className="card"><p className="flex items-center gap-2 text-sm text-gray-500"><WalletCards className="h-4 w-4" /> Money owed to suppliers</p><p className="text-2xl font-bold text-red-700">₹{(summary?.supplierDebt || 0).toFixed(2)}</p><p className="mt-1 text-xs text-gray-500">Unpaid medicine orders</p></div>
      </div>

      <div className="card border border-sky-100 bg-sky-50 text-sm text-sky-950">
        <p className="font-semibold">How to read these numbers</p>
        <p className="mt-1">Selling value = what the stock <em>could</em> sell for at full retail price. Actual revenue will be lower after discounts, returns, and items that expire unsold. Purchase cost = what it cost us. Money owed to suppliers = unpaid orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Money Received Over Time</h2>
          <div className="h-72 min-h-72">
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
          <h2 className="text-lg font-semibold mb-4">Stock Status</h2>
          <div className="h-72 min-h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventoryData} dataKey="value" nameKey="name" cx="45%" cy="45%" innerRadius={45} outerRadius={95} paddingAngle={3} labelLine={false} label={({ name, value }) => `${name}: ${value}`}>
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={30} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Best-Selling Medicines</h2>
        <div className="h-72 min-h-72">
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
