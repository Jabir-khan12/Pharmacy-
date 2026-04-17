import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { downloadCSV } from '../../utils/downloadCSV';

const ReturnsList = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    fetchReturns();
  }, [status, pagination.page]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/returns', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(status && { status })
        }
      });
      setReturns(response.data.data.returns);
      setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/returns/${id}/approve`, { approvalNotes: 'Approved' });
      toast.success('Return approved');
      fetchReturns();
    } catch (error) {
      toast.error('Failed to approve return');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/returns/${id}/reject`, { approvalNotes: 'Rejected' });
      toast.success('Return rejected');
      fetchReturns();
    } catch (error) {
      toast.error('Failed to reject return');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('/export/returns', {
              ...(status && { status })
            }, 'returns_export.csv')}
            className="btn btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </button>
          <Link to="/returns/new" className="btn btn-primary">New Return</Link>
        </div>
      </div>

      <div className="card">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : returns.length === 0 ? (
        <div className="card text-center py-12">No returns found</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Return</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sale</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Refund</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {returns.map((ret) => (
                <tr key={ret._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">{ret.returnNumber}</td>
                  <td className="px-4 py-2 text-sm">{ret.originalSale?.orderNumber}</td>
                  <td className="px-4 py-2 text-sm">₹{ret.refundAmount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm capitalize">{ret.status}</td>
                  <td className="px-4 py-2 text-sm">{new Date(ret.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <Link to={`/returns/${ret._id}`} className="text-primary-600">View</Link>
                    {ret.status === 'pending' && (
                      <>
                        <button className="text-green-600" onClick={() => handleApprove(ret._id)}>Approve</button>
                        <button className="text-red-600" onClick={() => handleReject(ret._id)}>Reject</button>
                      </>
                    )}
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

export default ReturnsList;
