import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, Plus } from 'lucide-react';

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [newBatch, setNewBatch] = useState({ batchNumber: '', expiryDate: '', quantity: '', costPrice: '', rackLocation: '', notes: '' });
  const [savingBatch, setSavingBatch] = useState(false);
  const [adjustment, setAdjustment] = useState({ quantity: '', type: 'adjustment', notes: '' });
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchMedicine();
    fetchBatches();
  }, [id]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medicines/${id}`);
      setMedicine(response.data.data.medicine);
      setTransactions(response.data.data.recentTransactions || []);
    } catch (error) {
      toast.error('Failed to load medicine');
      navigate('/medicines');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await api.get(`/batches/medicine/${id}`);
      setBatches(response.data.data.batches || []);
      setBatchSummary(response.data.data.summary || null);
    } catch (error) {
      // Batches may not exist yet — that's fine
      setBatches([]);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to discontinue this medicine?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success('Medicine discontinued');
      navigate('/medicines');
    } catch (error) {
      toast.error('Failed to discontinue medicine');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjusting(true);
    try {
      await api.patch(`/medicines/${id}/stock`, {
        quantity: parseInt(adjustment.quantity, 10),
        type: adjustment.type,
        notes: adjustment.notes
      });
      toast.success('Stock adjusted');
      setAdjustment({ quantity: '', type: 'adjustment', notes: '' });
      fetchMedicine();
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to adjust stock';
      toast.error(message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSavingBatch(true);
    try {
      await api.post('/batches', {
        medicine: id,
        batchNumber: newBatch.batchNumber,
        expiryDate: newBatch.expiryDate,
        quantity: parseInt(newBatch.quantity, 10),
        costPrice: newBatch.costPrice ? parseFloat(newBatch.costPrice) : undefined,
        rackLocation: newBatch.rackLocation,
        notes: newBatch.notes
      });
      toast.success('Batch created successfully');
      setNewBatch({ batchNumber: '', expiryDate: '', quantity: '', costPrice: '', rackLocation: '', notes: '' });
      setShowBatchForm(false);
      fetchBatches();
      fetchMedicine(); // refresh stock count
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create batch');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleRecallBatch = async (batchId) => {
    const reason = prompt('Enter recall reason:');
    if (!reason) return;
    try {
      await api.patch(`/batches/${batchId}/recall`, { reason });
      toast.success('Batch recalled');
      fetchBatches();
      fetchMedicine();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to recall batch');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!medicine) {
    return null;
  }

  const stockStatus = medicine.stockQuantity === 0
    ? 'badge badge-danger'
    : medicine.stockQuantity <= medicine.reorderLevel
      ? 'badge badge-warning'
      : 'badge badge-success';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{medicine.name}</h1>
          <p className="text-gray-600">{medicine.genericName}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/medicines/${id}/edit`} className="btn btn-secondary">Edit</Link>
          <button onClick={handleDelete} className="btn btn-danger">Discontinue</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{medicine.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Manufacturer</p>
              <p className="font-medium">{medicine.manufacturer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dosage Form</p>
              <p className="font-medium">{medicine.dosageForm}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Strength</p>
              <p className="font-medium">{medicine.strength}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium">₹{medicine.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiry Date</p>
              <p className="font-medium">{new Date(medicine.expiryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batch Number</p>
              <p className="font-medium">{medicine.batchNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SKU</p>
              <p className="font-medium">{medicine.sku}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-700">{medicine.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <p className="text-sm text-gray-500">Stock</p>
            <p className="text-2xl font-bold">{medicine.stockQuantity}</p>
            <span className={stockStatus}>{medicine.stockQuantity === 0 ? 'Out of Stock' : medicine.stockQuantity <= medicine.reorderLevel ? 'Low Stock' : 'In Stock'}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reorder Level</p>
            <p className="font-medium">{medicine.reorderLevel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prescription Required</p>
            <p className="font-medium">{medicine.isPrescriptionRequired ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium capitalize">{medicine.status}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Stock Adjustment</h2>
        <form onSubmit={handleAdjust} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="number"
            name="quantity"
            placeholder="Quantity (+/-)"
            className="input"
            value={adjustment.quantity}
            onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })}
            required
          />
          <select
            className="input"
            value={adjustment.type}
            onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
          >
            <option value="purchase">Purchase</option>
            <option value="adjustment">Adjustment</option>
            <option value="damage">Damage</option>
            <option value="expiry">Expiry</option>
          </select>
          <input
            type="text"
            className="input"
            placeholder="Notes"
            value={adjustment.notes}
            onChange={(e) => setAdjustment({ ...adjustment, notes: e.target.value })}
          />
          <button className="btn btn-primary" disabled={adjusting}>
            {adjusting ? 'Adjusting...' : 'Adjust Stock'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Batch Inventory</h2>
          <button
            onClick={() => setShowBatchForm(!showBatchForm)}
            className="btn btn-primary flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Batch
          </button>
        </div>

        {batchSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">Total Batches</p>
              <p className="text-lg font-bold text-blue-800">{batchSummary.totalBatches}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Active</p>
              <p className="text-lg font-bold text-green-800">{batchSummary.activeBatches}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600">Batch Stock</p>
              <p className="text-lg font-bold text-purple-800">{batchSummary.totalStock}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600">Nearest Expiry</p>
              <p className="text-lg font-bold text-orange-800">
                {batchSummary.nearestExpiry ? new Date(batchSummary.nearestExpiry).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {showBatchForm && (
          <form onSubmit={handleCreateBatch} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                className="input"
                placeholder="Batch Number *"
                value={newBatch.batchNumber}
                onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                required
              />
              <input
                type="date"
                className="input"
                placeholder="Expiry Date *"
                value={newBatch.expiryDate}
                onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                required
              />
              <input
                type="number"
                className="input"
                placeholder="Quantity *"
                min="1"
                value={newBatch.quantity}
                onChange={(e) => setNewBatch({ ...newBatch, quantity: e.target.value })}
                required
              />
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="Cost Price"
                value={newBatch.costPrice}
                onChange={(e) => setNewBatch({ ...newBatch, costPrice: e.target.value })}
              />
              <input
                type="text"
                className="input"
                placeholder="Rack Location"
                value={newBatch.rackLocation}
                onChange={(e) => setNewBatch({ ...newBatch, rackLocation: e.target.value })}
              />
              <input
                type="text"
                className="input"
                placeholder="Notes"
                value={newBatch.notes}
                onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={savingBatch}>
                {savingBatch ? 'Saving...' : 'Save Batch'}
              </button>
              <button type="button" onClick={() => setShowBatchForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        )}

        {batches.length === 0 ? (
          <p className="text-gray-500 text-sm">No batches recorded. Add a batch to enable per-batch tracking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.map((batch) => {
                  const daysToExpiry = batch.expiryDate
                    ? Math.ceil((new Date(batch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpiringSoon = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 0;

                  return (
                    <tr key={batch._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">{batch.batchNumber}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={batch.quantity === 0 ? 'text-red-600' : ''}>{batch.quantity}</span>
                        <span className="text-gray-400 text-xs ml-1">/ {batch.initialQuantity}</span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={isExpiringSoon ? 'text-red-600 font-medium' : daysToExpiry <= 0 ? 'text-red-700 font-bold' : ''}>
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </span>
                        {isExpiringSoon && <span className="text-xs text-red-500 block">{daysToExpiry}d left</span>}
                        {daysToExpiry <= 0 && <span className="text-xs text-red-700 block">Expired</span>}
                      </td>
                      <td className="px-4 py-2 text-sm">₹{batch.costPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{batch.rackLocation || '—'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`badge ${
                          batch.status === 'active' ? 'badge-success' :
                          batch.status === 'depleted' ? 'badge-warning' :
                          batch.status === 'recalled' ? 'badge-danger' :
                          'badge-danger'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {batch.status === 'active' && (
                          <button
                            onClick={() => handleRecallBatch(batch._id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Recall
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Stock Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="px-4 py-2 text-sm">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm capitalize">{tx.type}</td>
                    <td className="px-4 py-2 text-sm">{tx.quantity}</td>
                    <td className="px-4 py-2 text-sm">{tx.balanceAfter}</td>
                    <td className="px-4 py-2 text-sm">
                      {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineDetail;
