import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import { Download } from 'lucide-react';
import { downloadCSV } from '../../utils/downloadCSV';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    orderNumber: '',
    paymentMethod: '',
    status: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const debouncedOrderNumber = useDebounce(filters.orderNumber, 300);

  useEffect(() => {
    fetchSales();
  }, [debouncedOrderNumber, filters.paymentMethod, filters.status, pagination.page]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(debouncedOrderNumber && { orderNumber: debouncedOrderNumber }),
          ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
          ...(filters.status && { status: filters.status })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('/export/sales', {
              ...(filters.status && { status: filters.status }),
              ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod })
            }, 'sales_export.csv')}
            className="btn btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </button>
          <Link to="/sales/new" className="btn btn-primary">New Sale</Link>
        </div>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          className="input"
          placeholder="Order number"
          value={filters.orderNumber}
          onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
        />
        <select
          className="input"
          value={filters.paymentMethod}
          onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
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
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="returned">Returned</option>
          <option value="partially_returned">Partially Returned</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : sales.length === 0 ? (
        <div className="card text-center py-12">No sales found</div>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{sale.orderNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{sale.customer?.name}</td>
                  <td className="px-4 py-2 text-sm">₹{(sale.grandTotal || sale.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm capitalize">{sale.paymentMethod}</td>
                  <td className="px-4 py-2 text-sm capitalize">{sale.status.replace('_', ' ')}</td>
                  <td className="px-4 py-2 text-sm">{new Date(sale.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link to={`/sales/${sale._id}`} className="text-primary-600 hover:text-primary-800">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesList;
