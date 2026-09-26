import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Truck, CreditCard, PlusCircle } from 'lucide-react';

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  blacklisted: 'bg-red-100 text-red-700',
};

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [payment, setPayment] = useState({ amount: '', paymentMethod: 'cash', notes: '' });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.data.supplier);
      const accountResponse = await api.get(`/suppliers/${id}/account`);
      setAccount(accountResponse.data.data);
    } catch {
      toast.error('Failed to load supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    if (!payment.amount || Number(payment.amount) <= 0) return;
    try {
      setSavingPayment(true);
      await api.post(`/suppliers/${id}/payments`, { ...payment, amount: Number(payment.amount) });
      toast.success('Supplier payment recorded');
      setPayment({ amount: '', paymentMethod: 'cash', notes: '' });
      fetchSupplier();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!supplier) return null;

  const addr = supplier.address;
  const addressStr = [addr?.street, addr?.city, addr?.state, addr?.zipCode, addr?.country]
    .filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/suppliers')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[supplier.status]}`}>
              {supplier.status}
            </span>
          </div>
        </div>
        <Link to={`/suppliers/${id}/edit`} className="btn btn-primary flex items-center gap-2">
          <Edit className="w-4 h-4" /> Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-600" /> Contact Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="font-medium">{supplier.contactPerson || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{supplier.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{supplier.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{addressStr || '—'}</p>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Business Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Terms</p>
              <p className="font-medium capitalize">{supplier.paymentTerms?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">GST Number</p>
              <p className="font-medium">{supplier.gstNumber || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">License Number</p>
              <p className="font-medium">{supplier.licenseNumber || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(supplier.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {supplier.notes && (
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-sm mt-1">{supplier.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CreditCard className="h-5 w-5 text-primary-600" /> Supplier money record</h2>
            <p className="text-sm text-gray-500">Purchases increase the payable balance. Payments reduce it.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Outstanding supplier loan</p>
            <p className="text-2xl font-bold text-red-700">₹{(account?.summary?.balance || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-red-50 p-3"><p className="text-xs text-red-700">Purchases on account</p><p className="text-lg font-semibold">₹{(account?.summary?.purchases || 0).toFixed(2)}</p></div>
          <div className="rounded-lg bg-green-50 p-3"><p className="text-xs text-green-700">Payments made</p><p className="text-lg font-semibold">₹{(account?.summary?.payments || 0).toFixed(2)}</p></div>
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">Payment terms</p><p className="text-lg font-semibold capitalize">{supplier.paymentTerms?.replace('_', ' ')}</p></div>
        </div>

        {account?.summary?.balance > 0 && (
          <form onSubmit={recordPayment} className="grid grid-cols-1 items-end gap-3 border-t pt-4 md:grid-cols-4">
            <label className="text-sm font-medium text-gray-700">Payment amount<input type="number" min="0.01" max={account.summary.balance} step="0.01" className="input mt-1" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required /></label>
            <label className="text-sm font-medium text-gray-700">Method<select className="input mt-1" value={payment.paymentMethod} onChange={(e) => setPayment({ ...payment, paymentMethod: e.target.value })}><option value="cash">Cash</option><option value="bank">Bank</option><option value="card">Card</option><option value="online">Online</option><option value="other">Other</option></select></label>
            <label className="text-sm font-medium text-gray-700 md:col-span-1">Note<input className="input mt-1" placeholder="e.g. Weekly payment" value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} /></label>
            <button type="submit" disabled={savingPayment} className="btn btn-primary flex items-center justify-center gap-2"><PlusCircle className="h-4 w-4" /> {savingPayment ? 'Saving...' : 'Record payment'}</button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="border-b text-left text-xs uppercase text-gray-500"><tr><th className="py-2">Date</th><th>Type</th><th>Reference</th><th className="text-right">Amount</th></tr></thead><tbody className="divide-y">{account?.transactions?.map((transaction) => <tr key={transaction._id}><td className="py-2">{new Date(transaction.createdAt).toLocaleDateString()}</td><td className="capitalize">{transaction.type}</td><td>{transaction.purchaseOrder?.poNumber || transaction.notes || '—'}</td><td className={`text-right font-medium ${transaction.type === 'purchase' ? 'text-red-700' : 'text-green-700'}`}>{transaction.type === 'purchase' ? '+' : '-'}₹{transaction.amount.toFixed(2)}</td></tr>)}</tbody></table>
          {!account?.transactions?.length && <p className="py-6 text-center text-sm text-gray-500">No money records yet. Receive a medicine order to record the amount owed.</p>}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
