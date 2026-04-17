import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const PrescriptionsList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    fetchPrescriptions();
  }, [status, pagination.page]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(status && { status })
        }
      });
      setPrescriptions(response.data.data.prescriptions);
      setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <Link to="/prescriptions/upload" className="btn btn-primary">Upload Prescription</Link>
      </div>

      <div className="card">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div className="card text-center py-12">No prescriptions found</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prescription</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prescriptions.map((rx) => (
                <tr key={rx._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">{rx.prescriptionNumber}</td>
                  <td className="px-4 py-2 text-sm">{rx.customer?.firstName} {rx.customer?.lastName}</td>
                  <td className="px-4 py-2 text-sm">{rx.doctorName}</td>
                  <td className="px-4 py-2 text-sm capitalize">{rx.status}</td>
                  <td className="px-4 py-2 text-sm">{new Date(rx.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">
                    <Link to={`/prescriptions/${rx._id}`} className="text-primary-600">View</Link>
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

export default PrescriptionsList;
