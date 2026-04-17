import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { Search, Plus, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import { downloadCSV } from '../../utils/downloadCSV';

const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const debouncedSearch = useDebounce(searchTerm, 300);

  const categories = [
    'All',
    'Analgesics',
    'Antibiotics',
    'Antivirals',
    'Antifungals',
    'Antihistamines',
    'Cardiovascular',
    'Diabetes',
    'Gastrointestinal',
    'Respiratory',
    'Vitamins & Supplements',
    'Skin Care',
    'Other'
  ];

  useEffect(() => {
    fetchMedicines();
  }, [debouncedSearch, category, pagination.page]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(category && category !== 'All' && { category })
      };

      const response = await api.get('/medicines', { params });
      setMedicines(response.data.data.medicines);
      setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error('Failed to fetch medicines');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (medicine) => {
    if (medicine.stockQuantity === 0) {
      return { text: 'Out of Stock', class: 'badge badge-danger' };
    } else if (medicine.stockQuantity <= medicine.reorderLevel) {
      return { text: 'Low Stock', class: 'badge badge-warning' };
    }
    return { text: 'In Stock', class: 'badge badge-success' };
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
          <p className="text-gray-600 mt-1">Manage your pharmacy inventory</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('/export/medicines', {
              ...(category && category !== 'All' && { category })
            }, 'medicines_export.csv')}
            className="btn btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </button>
          <Link to="/medicines/new" className="btn btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Medicine
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input md:w-64"
          >
            {categories.map(cat => (
              <option key={cat} value={cat === 'All' ? '' : cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicine List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : medicines.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No medicines found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {medicines.map((medicine) => {
                const stockStatus = getStockStatus(medicine);
                const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate);
                
                return (
                  <tr key={medicine._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-sm text-gray-500">{medicine.genericName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{medicine.category}</td>
                    <td className="px-6 py-4">
                      <span className={stockStatus.class}>
                        {medicine.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{medicine.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className={daysUntilExpiry <= 30 ? 'text-red-600' : 'text-gray-600'}>
                          {new Date(medicine.expiryDate).toLocaleDateString()}
                        </p>
                        {daysUntilExpiry <= 30 && (
                          <p className="text-xs text-red-500">{daysUntilExpiry} days left</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={stockStatus.class}>{stockStatus.text}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/medicines/${medicine._id}`} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
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
        </div>
      )}
    </div>
  );
};

export default MedicineList;
