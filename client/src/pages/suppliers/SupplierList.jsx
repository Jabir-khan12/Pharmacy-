import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import { Plus, Search, Truck } from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  blacklisted: 'bg-red-100 text-red-700',
};

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [outstandingBalances, setOutstandingBalances] = useState([]);
  const [searchParams] = useSearchParams();
  const debouncedSearch = useDebounce(search, 300);
  const outstandingView = searchParams.get('view') === 'outstanding';

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      if (outstandingView) {
        const response = await api.get('/reports/financial-overview');
        const balances = (response.data.data.supplierBreakdown || []).filter((supplier) => supplier.balance > 0);
        setOutstandingBalances(balances);
        setSuppliers([]);
        setPagination((previous) => ({ ...previous, page: 1, total: balances.length, pages: 1 }));
      } else {
        const response = await api.get('/suppliers', { params });
        setSuppliers(response.data.data.suppliers);
        setOutstandingBalances([]);
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
      }
    } catch {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, outstandingView, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{outstandingView ? 'Outstanding Supplier Balances' : 'Suppliers'}</h1>
          {outstandingView && <p className="mt-1 text-sm text-gray-500">Suppliers with unpaid medicine purchases.</p>}
        </div>
        <Link to="/suppliers/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Supplier
        </Link>
      </div>

      {!outstandingView && <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>}

      {outstandingView && (
        <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          <span>Outstanding balances are calculated from recorded supplier purchases and payments.</span>
          <Link to="/suppliers" className="font-medium text-red-700 hover:underline">View all suppliers</Link>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : outstandingView ? outstandingBalances.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No outstanding supplier balances.</p>
          <p className="text-sm mt-1 text-gray-400">All supplier accounts are settled.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding balance</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oldest unpaid PO</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due date</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y">{outstandingBalances.map((supplier) => { const poDate = supplier.oldestPurchaseOrder?.createdAt || supplier.oldestPurchaseDate; const poNumber = supplier.oldestPurchaseOrder?.poNumber || '—'; return <tr key={supplier.supplierId} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.supplierName}</td><td className="px-4 py-3 text-right text-sm font-semibold text-red-700">₹{supplier.balance.toFixed(2)}</td><td className="px-4 py-3 text-sm">{poNumber}</td><td className="px-4 py-3 text-sm text-gray-600">{poDate ? new Date(poDate).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-right"><Link to={`/suppliers/${supplier.supplierId}`} className="text-sm font-medium text-primary-600 hover:underline">Pay / View</Link></td></tr>; })}</tbody>
          </table>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card text-center py-12">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No suppliers found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Terms</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map(supplier => (
                <tr key={supplier._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/suppliers/${supplier._id}`} className="text-primary-600 hover:underline font-medium">
                      {supplier.name}
                    </Link>
                    {supplier.email && <p className="text-xs text-gray-500">{supplier.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm">{supplier.contactPerson || '—'}</td>
                  <td className="px-4 py-3 text-sm">{supplier.phone}</td>
                  <td className="px-4 py-3 text-sm capitalize">{supplier.paymentTerms?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[supplier.status]}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/suppliers/${supplier._id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierList;
