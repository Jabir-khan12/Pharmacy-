import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Package } from 'lucide-react';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  partially_received: 'bg-yellow-100 text-yellow-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [receiveItems, setReceiveItems] = useState([]);

  useEffect(() => {
    fetchPO();
  }, [id]);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchase-orders/${id}`);
      const data = response.data.data.purchaseOrder;
      setPo(data);
      // Initialize receive items with remaining qty
      setReceiveItems(
        data.items.map(item => ({
          itemId: item._id,
          medicineName: item.medicineName,
          ordered: item.quantity,
          alreadyReceived: item.receivedQuantity || 0,
          quantity: 0,
          batchNumber: item.batchNumber || '',
          expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : ''
        }))
      );
    } catch {
      toast.error('Failed to load purchase order');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status });
      toast.success(`PO status updated to ${status}`);
      fetchPO();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleReceive = async () => {
    const toReceive = receiveItems.filter(i => i.quantity > 0);
    if (toReceive.length === 0) {
      toast.error('Enter quantities to receive');
      return;
    }

    try {
      setReceiving(true);
      await api.post(`/purchase-orders/${id}/receive`, {
        receivedItems: toReceive.map(i => ({
          itemId: i.itemId,
          quantity: parseInt(i.quantity),
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate || null
        }))
      });
      toast.success('Items received and stock updated');
      fetchPO();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to receive items');
    } finally {
      setReceiving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!po) return null;

  const canReceive = ['ordered', 'partially_received'].includes(po.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchase-orders')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{po.poNumber}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[po.status]}`}>
              {po.status?.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {po.status === 'draft' && (
            <>
              <button onClick={() => updateStatus('ordered')} className="btn btn-primary flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Mark Ordered
              </button>
              <button onClick={() => updateStatus('cancelled')} className="btn btn-danger flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            </>
          )}
          {po.status === 'ordered' && (
            <button onClick={() => updateStatus('cancelled')} className="btn btn-danger flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* PO Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Supplier</h2>
          <p className="font-medium">{po.supplier?.name}</p>
          <p className="text-sm text-gray-500">{po.supplier?.phone}</p>
          {po.supplier?.email && <p className="text-sm text-gray-500">{po.supplier.email}</p>}
        </div>
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Order Details</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-gray-500">Order Date:</p>
            <p>{new Date(po.orderDate || po.createdAt).toLocaleDateString()}</p>
            <p className="text-gray-500">Expected:</p>
            <p>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : '—'}</p>
            <p className="text-gray-500">Created By:</p>
            <p>{po.createdBy?.firstName} {po.createdBy?.lastName}</p>
          </div>
        </div>
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Total</h2>
          <p className="text-3xl font-bold text-primary-600">₹{po.totalAmount?.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{po.items?.length} items</p>
        </div>
      </div>

      {/* Items table */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" /> Order Items
        </h2>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Cost</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Batch</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {po.items?.map(item => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium">{item.medicineName}</td>
                <td className="px-4 py-2 text-sm">{item.quantity}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={item.receivedQuantity >= item.quantity ? 'text-green-600 font-medium' : ''}>
                    {item.receivedQuantity || 0}
                  </span>
                  /{item.quantity}
                </td>
                <td className="px-4 py-2 text-sm">₹{item.unitCost?.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">₹{item.subtotal?.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{item.batchNumber || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receive Section */}
      {canReceive && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Receive Items</h2>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Remaining</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Receive Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Batch #</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receiveItems.map((item, index) => {
                const remaining = item.ordered - item.alreadyReceived;
                if (remaining <= 0) return null;
                return (
                  <tr key={item.itemId}>
                    <td className="px-3 py-2 text-sm">{item.medicineName}</td>
                    <td className="px-3 py-2 text-sm">{remaining}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        className="input w-20"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value) || 0, remaining);
                          setReceiveItems(prev => prev.map((r, i) =>
                            i === index ? { ...r, quantity: val } : r
                          ));
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="input w-28"
                        value={item.batchNumber}
                        onChange={(e) => setReceiveItems(prev => prev.map((r, i) =>
                          i === index ? { ...r, batchNumber: e.target.value } : r
                        ))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="input w-36"
                        value={item.expiryDate}
                        onChange={(e) => setReceiveItems(prev => prev.map((r, i) =>
                          i === index ? { ...r, expiryDate: e.target.value } : r
                        ))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end">
            <button
              onClick={handleReceive}
              disabled={receiving}
              className="btn btn-primary"
            >
              {receiving ? 'Processing...' : 'Receive Items & Update Stock'}
            </button>
          </div>
        </div>
      )}

      {po.notes && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-2">Notes</h2>
          <p className="text-sm text-gray-600">{po.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetail;
