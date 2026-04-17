import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const CreateReturn = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  const searchSale = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      const response = await api.get('/sales', { params: { orderNumber } });
      const saleFound = response.data.data.sales[0];
      if (!saleFound) {
        toast.error('Sale not found');
        setSale(null);
        return;
      }
      setSale(saleFound);
      setSelectedItems({});
    } catch (error) {
      toast.error('Failed to search sale');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item, checked) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[item.medicine] = {
          medicine: item.medicine,
          quantity: 1,
          reason: '',
          restockable: true
        };
      } else {
        delete updated[item.medicine];
      }
      return updated;
    });
  };

  const updateItem = (medicineId, field, value) => {
    setSelectedItems((prev) => ({
      ...prev,
      [medicineId]: {
        ...prev[medicineId],
        [field]: value
      }
    }));
  };

  const submitReturn = async () => {
    if (!sale) return;
    const items = Object.values(selectedItems);
    if (items.length === 0) {
      toast.error('Select at least one item');
      return;
    }

    try {
      const response = await api.post('/returns', {
        originalSale: sale._id,
        items
      });
      toast.success('Return created');
      const returnId = response.data.data?.return?._id;
      navigate(returnId ? `/returns/${returnId}` : '/returns');
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create return';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Create Return</h1>

      <div className="card space-y-4">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter order number (e.g., SALE-20240225-0001)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <button className="btn btn-primary" onClick={searchSale} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {sale && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Sale {sale.orderNumber}</h2>
            <p className="text-gray-600">Customer: {sale.customer?.name}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sale.items.map((item) => (
                  <tr key={item.medicine}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedItems[item.medicine])}
                        onChange={(e) => toggleItem(item, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2">{item.medicineName}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        className="input w-24"
                        disabled={!selectedItems[item.medicine]}
                        value={selectedItems[item.medicine]?.quantity || 1}
                        onChange={(e) => updateItem(item.medicine, 'quantity', parseInt(e.target.value || 1, 10))}
                      />
                      <p className="text-xs text-gray-500">Max: {item.quantity}</p>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="input"
                        placeholder="Reason"
                        disabled={!selectedItems[item.medicine]}
                        value={selectedItems[item.medicine]?.reason || ''}
                        onChange={(e) => updateItem(item.medicine, 'reason', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        disabled={!selectedItems[item.medicine]}
                        checked={selectedItems[item.medicine]?.restockable || false}
                        onChange={(e) => updateItem(item.medicine, 'restockable', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={submitReturn}>Submit Return</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReturn;
