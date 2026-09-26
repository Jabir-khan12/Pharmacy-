import { useEffect, useState } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { BookOpen, Trash2 } from 'lucide-react';

const types = [
  ['expense', 'Expense'],
  ['salary', 'Salary'],
  ['income', 'Other income'],
  ['cash_deposit', 'Cash deposit'],
  ['cash_withdrawal', 'Cash withdrawal'],
  ['owner_withdrawal', 'Owner withdrawal']
];

const emptyForm = () => ({
  type: 'expense', amount: '', category: 'Rent', paymentMethod: 'cash',
  description: '', transactionDate: new Date().toISOString().slice(0, 10)
});

const Accounting = () => {
  const [form, setForm] = useState(emptyForm);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, transactionsResponse] = await Promise.all([
        api.get('/accounting/summary'),
        api.get('/accounting?limit=100')
      ]);
      setSummary(summaryResponse.data.data.summary);
      setTransactions(transactionsResponse.data.data.transactions || []);
    } catch (error) {
      toast.error('Failed to load accounting records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateForm = (name, value) => setForm((previous) => ({ ...previous, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.post('/accounting', { ...form, amount: Number(form.amount) });
      toast.success('Accounting entry recorded');
      setForm(emptyForm());
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save accounting entry');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this accounting entry?')) return;
    try {
      await api.delete(`/accounting/${id}`);
      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-600">Business finances</p>
        <h1 className="text-3xl font-bold text-gray-900">Business Money</h1>
        <p className="mt-1 text-sm text-gray-500">Record shop expenses, staff pay, and money added or taken out.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-gray-500">Expenses</p><p className="mt-1 text-2xl font-bold text-red-700">{money(summary?.expenses)}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Salaries</p><p className="mt-1 text-2xl font-bold text-red-700">{money(summary?.salaries)}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Total shop costs</p><p className="mt-1 text-2xl font-bold">{money(summary?.operatingCosts)}</p><p className="mt-1 text-xs text-gray-500">Expenses plus staff pay</p></div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-primary-600" /> Add money record</h2>
          <label className="text-sm font-medium text-gray-700">What is this for?<select className="input mt-1" value={form.type} onChange={(e) => updateForm('type', e.target.value)}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700">Amount<input className="input mt-1" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => updateForm('amount', e.target.value)} placeholder="0.00" required /></label>
          <label className="text-sm font-medium text-gray-700">Category<input className="input mt-1" value={form.category} onChange={(e) => updateForm('category', e.target.value)} placeholder="Rent, electricity, pharmacist salary..." required /></label>
          <label className="text-sm font-medium text-gray-700">Paid by<select className="input mt-1" value={form.paymentMethod} onChange={(e) => updateForm('paymentMethod', e.target.value)}><option value="cash">Cash</option><option value="bank">Bank</option><option value="card">Card</option><option value="online">Online</option><option value="other">Other</option></select></label>
          <label className="text-sm font-medium text-gray-700">Date<input className="input mt-1" type="date" value={form.transactionDate} onChange={(e) => updateForm('transactionDate', e.target.value)} required /></label>
          <label className="text-sm font-medium text-gray-700">Note <span className="font-normal text-gray-400">(optional)</span><textarea className="input mt-1" rows="3" value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Add a useful reference" /></label>
          <button className="btn btn-primary w-full" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save entry'}</button>
        </form>

        <div className="card overflow-hidden">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Money records</h2><p className="text-sm text-gray-500">Shop expenses, staff pay, and other money movements.</p></div><span className="text-sm text-gray-500">{transactions.length} records</span></div>
          {loading ? <p className="py-10 text-center text-gray-500">Loading...</p> : transactions.length === 0 ? <p className="py-10 text-center text-gray-500">No accounting entries yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b text-left text-xs uppercase text-gray-500"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Method</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y">{transactions.map((transaction) => <tr key={transaction._id}><td className="px-3 py-3">{new Date(transaction.transactionDate).toLocaleDateString()}</td><td className="px-3 py-3 capitalize">{transaction.type.replace('_', ' ')}</td><td className="px-3 py-3">{transaction.category}<p className="text-xs text-gray-500">{transaction.description}</p></td><td className="px-3 py-3 capitalize">{transaction.paymentMethod}</td><td className={`px-3 py-3 text-right font-medium ${['income', 'cash_deposit'].includes(transaction.type) ? 'text-green-700' : 'text-red-700'}`}>{['income', 'cash_deposit'].includes(transaction.type) ? '+' : '-'}{money(transaction.amount)}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => remove(transaction._id)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label="Delete accounting entry"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </div>
  );
};

export default Accounting;
