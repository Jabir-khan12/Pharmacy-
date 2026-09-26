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
  const [returnFeeRate, setReturnFeeRate] = useState(0);
  const medicineId = (medicine) => String(medicine?._id || medicine);

  const searchSale = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      const response = await api.get('/sales', { params: { orderNumber } });
      const saleMatch = response.data.data.sales[0];
      if (!saleMatch) {
        toast.error('Sale not found');
        setSale(null);
        return;
      }
      const detailResponse = await api.get(`/sales/${saleMatch._id}`);
      setSale(detailResponse.data.data.sale);
      setSelectedItems({});
    } catch (error) {
      toast.error('Failed to search sale');
    } finally {
      setLoading(false);
    }
  };

  const returnedQuantity = (medicine, status) => (sale?.returnHistory || [])
    .filter((returnDoc) => returnDoc.status === status)
    .reduce((total, returnDoc) => total + returnDoc.items
      .filter((item) => medicineId(item.medicine) === medicineId(medicine))
      .reduce((sum, item) => sum + item.quantity, 0), 0);

  const remainingQuantity = (item) => Math.max(
    0,
    item.quantity - returnedQuantity(item.medicine, 'approved') - returnedQuantity(item.medicine, 'pending')
  );

  const toggleItem = (item, checked) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[medicineId(item.medicine)] = {
          medicine: medicineId(item.medicine),
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

    if (items.some((item) => !item.reason.trim())) {
      toast.error('Add a reason for every returned item');
      return;
    }

    try {
      const response = await api.post('/returns', {
        originalSale: sale._id,
        items,
        returnFeeRate: Number(returnFeeRate) || 0
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchSale();
              }
            }}
          />
          <button className="btn btn-primary" onClick={searchSale} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {sale && (
        <div className="card space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold">Sale {sale.orderNumber}</h2>
              <span className={`badge ${sale.status === 'completed' ? 'badge-success' : sale.status === 'partially_returned' ? 'badge-warning' : 'badge-danger'}`}>
                {sale.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600">Customer: {sale.customer?.name}</p>
            <p className="mt-1 text-sm text-gray-500">Only remaining quantities can be returned. Pending returns are also reserved.</p>
          </div>

          {(sale.returnHistory || []).length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Previous return activity</p>
              <div className="mt-1 space-y-1">
                {sale.returnHistory.map((returnDoc) => (
                  <p key={returnDoc._id}>
                    {returnDoc.returnNumber} · <span className="capitalize">{returnDoc.status}</span> · {returnDoc.items.reduce((sum, item) => sum + item.quantity, 0)} unit{returnDoc.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Already returned</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available to return</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Return qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sale.items.map((item) => {
                  const approved = returnedQuantity(item.medicine, 'approved');
                  const pending = returnedQuantity(item.medicine, 'pending');
                  const available = remainingQuantity(item);
                  return (
                  <tr key={medicineId(item.medicine)} className={available === 0 ? 'bg-gray-50 text-gray-400' : ''}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        disabled={available === 0}
                        checked={Boolean(selectedItems[medicineId(item.medicine)])}
                        onChange={(e) => toggleItem(item, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-2">{item.medicineName}</td>
                    <td className="px-4 py-2">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className="text-red-700">{approved} approved</span>
                      {pending > 0 && <span className="ml-2 text-amber-700">{pending} pending</span>}
                    </td>
                    <td className="px-4 py-2 font-medium">{available}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        max={available}
                        className="input w-24"
                        disabled={!selectedItems[item.medicine] || available === 0}
                        value={selectedItems[medicineId(item.medicine)]?.quantity || 1}
                        onChange={(e) => updateItem(medicineId(item.medicine), 'quantity', Math.min(available, Math.max(1, parseInt(e.target.value || 1, 10))))}
                      />
                      <p className="text-xs text-gray-500">Max: {available}</p>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="input"
                        placeholder="Reason"
                        disabled={!selectedItems[item.medicine]}
                        value={selectedItems[medicineId(item.medicine)]?.reason || ''}
                        onChange={(e) => updateItem(medicineId(item.medicine), 'reason', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        disabled={!selectedItems[item.medicine]}
                        checked={selectedItems[medicineId(item.medicine)]?.restockable || false}
                        onChange={(e) => updateItem(medicineId(item.medicine), 'restockable', e.target.checked)}
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">Return charge
              <div className="mt-1 flex items-center gap-2">
                <input type="number" min="0" max="100" step="0.01" className="input" value={returnFeeRate} onChange={(e) => setReturnFeeRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <span className="mt-1 block text-xs font-normal text-gray-500">Applied to the selected items' value.</span>
            </label>
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="text-gray-500">Items value</p>
              <p className="mt-1 text-lg font-semibold">₹{Object.values(selectedItems).reduce((sum, selected) => {
                const saleItem = sale.items.find((item) => medicineId(item.medicine) === medicineId(selected.medicine));
                return sum + (saleItem?.priceAtSale || 0) * selected.quantity;
              }, 0).toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="text-blue-700">Customer refund after charge</p>
              <p className="mt-1 text-lg font-semibold text-blue-900">₹{(() => {
                const value = Object.values(selectedItems).reduce((sum, selected) => {
                  const saleItem = sale.items.find((item) => medicineId(item.medicine) === medicineId(selected.medicine));
                  return sum + (saleItem?.priceAtSale || 0) * selected.quantity;
                }, 0);
                return (value - (value * returnFeeRate) / 100).toFixed(2);
              })()}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={submitReturn}>Submit return for approval</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReturn;
