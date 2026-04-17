import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const ReturnDetail = () => {
  const { id } = useParams();
  const [returnDoc, setReturnDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturn();
  }, [id]);

  const fetchReturn = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/returns/${id}`);
      setReturnDoc(response.data.data.return);
    } catch (error) {
      toast.error('Failed to load return');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!returnDoc) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Return {returnDoc.returnNumber}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returnDoc.items.map((item) => (
                  <tr key={item.medicine}>
                    <td className="px-4 py-2 text-sm">{item.medicineName}</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">{item.reason}</td>
                    <td className="px-4 py-2 text-sm">{item.restockable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">Summary</h2>
          <div>
            <p className="text-sm text-gray-500">Original Sale</p>
            <p className="font-medium">{returnDoc.originalSale?.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium capitalize">{returnDoc.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Refund Amount</p>
            <p className="text-2xl font-bold">₹{returnDoc.refundAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Returned By</p>
            <p className="font-medium">{returnDoc.returnedBy?.firstName} {returnDoc.returnedBy?.lastName}</p>
          </div>
          {returnDoc.approvedBy && (
            <div>
              <p className="text-sm text-gray-500">Approved By</p>
              <p className="font-medium">{returnDoc.approvedBy?.firstName} {returnDoc.approvedBy?.lastName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnDetail;
