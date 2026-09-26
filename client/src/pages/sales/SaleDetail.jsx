import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, Clock3, PackageCheck } from 'lucide-react';

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

  const medicineId = (medicine) => String(medicine?._id || medicine);

  const returnedByMedicine = (status) => (sale.returnHistory || [])
    .filter((returnDoc) => returnDoc.status === status)
    .reduce((totals, returnDoc) => {
      returnDoc.items.forEach((item) => {
        const id = medicineId(item.medicine);
        totals[id] = (totals[id] || 0) + item.quantity;
      });
      return totals;
    }, {});

  const approvedReturns = returnedByMedicine('approved');
  const pendingReturns = returnedByMedicine('pending');
  const soldUnits = sale.items.reduce((total, item) => total + item.quantity, 0);
  const returnedUnits = Object.values(approvedReturns).reduce((total, quantity) => total + quantity, 0);
  const pendingUnits = Object.values(pendingReturns).reduce((total, quantity) => total + quantity, 0);

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
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Items sold and returned</h2>
              <p className="mt-1 text-sm text-gray-500">Approved returns are removed from the sale. Pending returns are awaiting review.</p>
            </div>
            <PackageCheck className="h-5 w-5 text-primary-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sold</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Returned</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sale.items.map((item) => (
                  <tr key={item._id || item.medicine}>
                    <td className="px-4 py-2 text-sm">{item.medicineName}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-sm text-red-700">{approvedReturns[medicineId(item.medicine)] || 0}</td>
                    <td className="px-4 py-2 text-right text-sm text-amber-700">{pendingReturns[medicineId(item.medicine)] || 0}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium">{Math.max(0, item.quantity - (approvedReturns[medicineId(item.medicine)] || 0) - (pendingReturns[medicineId(item.medicine)] || 0))}</td>
                    <td className="px-4 py-2 text-sm">₹{item.priceAtSale.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs uppercase text-gray-500">Units sold</p>
              <p className="mt-1 text-lg font-semibold">{soldUnits}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="flex items-center gap-1 text-xs uppercase text-red-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approved returned</p>
              <p className="mt-1 text-lg font-semibold text-red-800">{returnedUnits}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="flex items-center gap-1 text-xs uppercase text-amber-700"><Clock3 className="h-3.5 w-3.5" /> Awaiting approval</p>
              <p className="mt-1 text-lg font-semibold text-amber-800">{pendingUnits}</p>
            </div>
          </div>
          {sale.returnHistory?.length > 0 && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              <p className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4" /> Return history</p>
              <div className="mt-2 space-y-1">
                {sale.returnHistory.map((returnDoc) => (
                  <p key={returnDoc._id}>
                    {returnDoc.returnNumber}: <span className="capitalize">{returnDoc.status}</span> · {returnDoc.items.reduce((sum, item) => sum + item.quantity, 0)} unit{returnDoc.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}
                  </p>
                ))}
              </div>
            </div>
          )}
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
