import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Plus, ClipboardList } from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  partially_received: 'bg-yellow-100 text-yellow-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PurchaseOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/purchase-orders', { params });
      setOrders(response.data.data.purchaseOrders);
      setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
    } catch {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
        <Link to="/purchase-orders/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New PO
        </Link>
      </div>

      <div className="card">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="ordered">Ordered</option>
          <option value="partially_received">Partially Received</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No purchase orders found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(po => (
                <tr key={po._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/purchase-orders/${po._id}`} className="text-primary-600 hover:underline font-medium">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{po.supplier?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{po.items?.length || 0} items</td>
                  <td className="px-4 py-3 text-sm font-medium">₹{po.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[po.status]}`}>
                      {po.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t">
              <p className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >Previous</button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="btn btn-secondary disabled:opacity-50"
                >Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;
