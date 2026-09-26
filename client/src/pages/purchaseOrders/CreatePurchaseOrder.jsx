import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import { Plus, Trash2, Search } from 'lucide-react';

const CreatePurchaseOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Medicine search
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // PO items
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchMedicines(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers?status=active&limit=100');
      setSuppliers(response.data.data.suppliers);
    } catch {
      toast.error('Failed to load suppliers');
    }
  };

  const searchMedicines = async (term) => {
    try {
      const response = await api.get(`/medicines?search=${term}&limit=10`);
      setSearchResults(response.data.data.medicines);
      setShowSearch(true);
    } catch {
      setSearchResults([]);
    }
  };

  const addItem = (medicine) => {
    if (items.find(i => i.medicine === medicine._id)) {
      toast.error('Medicine already added');
      return;
    }
    setItems(prev => [...prev, {
      medicine: medicine._id,
      medicineName: medicine.name,
      quantity: 1,
      unitCost: medicine.price,
      batchNumber: '',
      expiryDate: ''
    }]);
    setSearchTerm('');
    setShowSearch(false);
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplier: selectedSupplier,
        items: items.map(i => ({
          medicine: i.medicine,
          quantity: parseInt(i.quantity),
          unitCost: parseFloat(i.unitCost),
          batchNumber: i.batchNumber || '',
          expiryDate: i.expiryDate || null
        })),
        expectedDeliveryDate: expectedDeliveryDate || null,
        notes
      };

      const response = await api.post('/purchase-orders', payload);
      toast.success('Medicine order created');
      navigate(`/purchase-orders/${response.data.data.purchaseOrder._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Order Medicines</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Details */}
        <div className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              <select
                className="input"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                className="input"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows="2" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Add medicine */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add Medicines</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Search medicines to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(med => (
                  <button
                    key={med._id}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                    onClick={() => addItem(med)}
                  >
                    <div>
                      <p className="text-sm font-medium">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.genericName} | Stock: {med.stockQuantity}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit Cost</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Batch #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Expiry</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm font-medium">{item.medicineName}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        className="input w-20"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input w-24"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="input w-28"
                        placeholder="Batch"
                        value={item.batchNumber}
                        onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="input w-36"
                        value={item.expiryDate}
                        onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-sm font-medium">
                      ₹{(item.quantity * item.unitCost).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan="5" className="px-3 py-3 text-right font-semibold">Total:</td>
                  <td className="px-3 py-3 font-bold text-lg">₹{totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/purchase-orders')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Place Medicine Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchaseOrder;
