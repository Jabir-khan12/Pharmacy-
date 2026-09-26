import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Eye, Filter, Plus, RotateCcw, TrendingUp, PackageCheck, BadgeDollarSign } from 'lucide-react';
import { downloadCSV } from '../../utils/downloadCSV';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    orderNumber: '',
    paymentMethod: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [summaryPeriod, setSummaryPeriod] = useState('day');
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const debouncedOrderNumber = useDebounce(filters.orderNumber, 300);

  useEffect(() => {
    fetchSales();
  }, [debouncedOrderNumber, filters.paymentMethod, filters.status, filters.startDate, filters.endDate, pagination.page]);

  useEffect(() => {
    fetchSummary();
  }, [summaryPeriod, summaryDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(debouncedOrderNumber && { orderNumber: debouncedOrderNumber }),
          ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
          ...(filters.status && { status: filters.status }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate })
        }
      });
      setSales(response.data.data.sales);
      setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/sales/summary', { params: { period: summaryPeriod, date: summaryDate } });
      setSummary(response.data.data);
    } catch (error) {
      toast.error('Failed to load sales summary');
    }
  };

  const updateFilter = (name, value) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ orderNumber: '', paymentMethod: '', status: '', startDate: '', endDate: '' });
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const statusClass = {
    completed: 'badge-success',
    returned: 'badge-danger',
    partially_returned: 'badge-warning'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">Transactions</p>
          <h1 className="text-3xl font-bold text-gray-900">Sales register</h1>
          <p className="mt-1 text-sm text-gray-500">Search completed sales, verify payment status, and issue receipts.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('/export/sales', {
              ...(filters.status && { status: filters.status }),
              ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
              ...(filters.startDate && { startDate: filters.startDate }),
              ...(filters.endDate && { endDate: filters.endDate })
            }, 'sales_export.csv')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <Link to="/sales/new" className="btn btn-primary flex items-center gap-2"><Plus className="h-4 w-4" /> New sale</Link>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Sales overview</h2>
            <p className="text-sm text-gray-500">See money received and items sold by day, month, or year.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border p-1" role="group" aria-label="Summary period">
              {['day', 'month', 'year'].map((period) => (
                <button key={period} type="button" onClick={() => setSummaryPeriod(period)} className={`rounded px-3 py-1.5 text-sm capitalize ${summaryPeriod === period ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {period}
                </button>
              ))}
            </div>
            <input type="date" className="input w-auto" value={summaryDate} onChange={(e) => setSummaryDate(e.target.value)} aria-label="Summary date" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
            <div className="flex items-center gap-2 text-sm text-sky-700"><TrendingUp className="h-4 w-4" /> Money received</div>
            <p className="mt-2 text-2xl font-bold text-gray-900">₹{(summary?.revenue || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700"><CalendarDays className="h-4 w-4" /> Transactions</div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{summary?.transactionCount || 0}</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm text-amber-700"><PackageCheck className="h-4 w-4" /> Items sold</div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{summary?.itemsSold || 0}</p>
          </div>
          <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
            <div className="flex items-center gap-2 text-sm text-violet-700"><BadgeDollarSign className="h-4 w-4" /> Est. cost</div>
            <p className="mt-2 text-2xl font-bold text-gray-900">₹{(summary?.estimatedCost || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-100 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-800"><TrendingUp className="h-4 w-4" /> Est. profit</div>
            <p className="mt-2 text-2xl font-bold text-gray-900">₹{(summary?.estimatedProfit || 0).toFixed(2)}</p>
            <p className="mt-1 text-xs text-emerald-800">Uses stored cost or 60% estimate</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-900"><Filter className="h-4 w-4 text-primary-600" /> Filters</div>
          <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"><RotateCcw className="h-4 w-4" /> Clear</button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <input
          className="input"
          placeholder="Search order number"
          value={filters.orderNumber}
          onChange={(e) => updateFilter('orderNumber', e.target.value)}
        />
        <select
          className="input"
          value={filters.paymentMethod}
          onChange={(e) => updateFilter('paymentMethod', e.target.value)}
        >
          <option value="">All payment methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="insurance">Insurance</option>
          <option value="online">Online</option>
        </select>
        <select
          className="input"
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="returned">Returned</option>
          <option value="partially_returned">Partially Returned</option>
        </select>
        <label className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="date" className="input pl-9" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} aria-label="Sales from date" />
        </label>
        <label className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="date" className="input pl-9" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} aria-label="Sales to date" />
        </label>
        </div>
      </div>

      {loading ? (
        <div className="card py-12 text-center text-gray-500">Loading sales...</div>
      ) : sales.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="font-medium text-gray-900">No sales match these filters</p>
          <p className="mt-1 text-sm text-gray-500">Clear the filters or create a new sale to see it here.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{sale.orderNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{sale.customer?.name}</td>
                  <td className="px-4 py-2 text-sm">₹{(sale.grandTotal || sale.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm capitalize">{sale.paymentMethod}</td>
                  <td className="px-4 py-2 text-sm"><span className={`badge ${statusClass[sale.status] || 'badge-info'}`}>{sale.status.replace('_', ' ')}</span></td>
                  <td className="px-4 py-2 text-sm">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-sm">
                    <Link to={`/sales/${sale._id}`} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800"><Eye className="h-4 w-4" /> View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              {pagination.total === 0 ? 'No results' : `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary flex items-center gap-1 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary flex items-center gap-1 disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;
