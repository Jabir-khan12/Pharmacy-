import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const SaleDetail = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/${id}`);
      setSale(response.data.data.sale);
    } catch (error) {
      toast.error('Failed to load sale');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await api.get(`/sales/${id}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${sale.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!sale) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sale {sale.orderNumber}</h1>
          <p className="text-gray-600">{new Date(sale.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={downloadReceipt}>Download Receipt</button>
          <Link to="/returns/new" className="btn btn-primary">Create Return</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sale.items.map((item) => (
                  <tr key={item._id || item.medicine}>
                    <td className="px-4 py-2 text-sm">{item.medicineName}</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">₹{item.priceAtSale.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">Summary</h2>
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{sale.customer?.name}</p>
            <p className="text-sm text-gray-600">{sale.customer?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment</p>
            <p className="font-medium capitalize">{sale.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium capitalize">{sale.status.replace('_', ' ')}</p>
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{sale.totalAmount.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount{sale.discount?.type === 'percentage' ? ` (${sale.discount.value}%)` : ''}</span>
                <span>-₹{sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Tax ({sale.taxRate}%)</span>
                <span>+₹{sale.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-500 font-medium">Grand Total</span>
              <span className="text-2xl font-bold">₹{(sale.grandTotal || sale.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;
