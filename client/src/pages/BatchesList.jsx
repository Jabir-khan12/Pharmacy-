import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarClock, Layers } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const BatchesList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const expiringSoon = searchParams.get('filter') === 'expiring-soon';

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await api.get('/batches', { params: { limit: 100, ...(expiringSoon && { expiringSoon: true }) } });
        setBatches(response.data.data.batches || []);
      } catch {
        toast.error('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [expiringSoon]);

  const urgencyColorClass = (days) => {
    if (days <= 7) return 'bg-red-100 text-red-800';
    if (days <= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const urgencyLabel = (days) => {
    if (days <= 7) return 'Critical';
    if (days <= 30) return 'Urgent';
    return 'Watch';
  };

  const daysUntilExpiry = (expiryDate) => Math.ceil((new Date(expiryDate) - new Date()) / 86400000);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{expiringSoon ? 'Batches Expiring Soon' : 'Inventory Batches'}</h1>
          <p className="mt-1 text-sm text-gray-500">{expiringSoon ? 'Active batches that expire within the next 30 days.' : 'Track inventory by batch and expiry date.'}</p>
        </div>
        {expiringSoon && <Link to="/batches" className="btn btn-secondary">View all batches</Link>}
      </div>

      {loading ? <div className="card py-12 text-center text-gray-500">Loading batches...</div> : batches.length === 0 ? (
        <div className="card py-12 text-center"><CalendarClock className="mx-auto mb-3 h-12 w-12 text-gray-300" /><p className="font-medium text-gray-900">No batches match this queue</p><p className="mt-1 text-sm text-gray-500">There are no active batches expiring in the next 30 days.</p></div>
      ) : (
        <div className="card overflow-x-auto"><table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Medicine</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Batch</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Expiry</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Units</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Supplier</th></tr></thead><tbody className="divide-y">{batches.map((batch) => { const days = daysUntilExpiry(batch.expiryDate); const urgencyCls = urgencyColorClass(days); return <tr key={batch._id} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{batch.medicine?.name}</p><p className="text-xs text-gray-500">{batch.medicine?.sku}</p></td><td className="px-4 py-3 text-sm">{batch.batchNumber}</td><td className="px-4 py-3"><p className={urgencyCls}>{urgencyLabel(days)}</p><p className="text-xs text-gray-500">{days} days remaining</p></td><td className="px-4 py-3 text-sm">{batch.quantity}</td><td className="px-4 py-3 text-sm text-gray-600">{batch.supplier?.name || 'Not recorded'}</td></tr>; })}</tbody></table></div>
      )}
    </div>
  );
};

export default BatchesList;