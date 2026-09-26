import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import { Minus, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

const CreateSale = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [medicines, setMedicines] = useState([]);
  const [highlightedMedicine, setHighlightedMedicine] = useState(0);
  const [prescriptions, setPrescriptions] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    userId: user?.role === 'customer' ? user._id : '',
    name: user?.role === 'customer' ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.role === 'customer' ? user.phone || '' : '',
    email: user?.role === 'customer' ? user.email || '' : ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    fetchMedicines();
  }, [debouncedSearch]);

  useEffect(() => {
    setHighlightedMedicine(0);
  }, [medicines]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines', {
        params: { search: debouncedSearch, limit: 10 }
      });
      setMedicines(response.data.data.medicines);
    } catch (error) {
      toast.error('Failed to load medicines');
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/prescriptions', {
        params: { status: 'verified', limit: 100 }
      });
      setPrescriptions(response.data.data.prescriptions || []);
    } catch (error) {
      toast.error('Failed to load verified prescriptions');
    }
  };

  const addToCart = (medicine) => {
    if (medicine.status !== 'active' || medicine.stockQuantity < 1) {
      toast.error('This medicine is not available');
      return;
    }

    const existing = cart.find((item) => item.medicine._id === medicine._id);
    if (existing) {
      if (existing.quantity + 1 > medicine.stockQuantity) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map((item) => item.medicine._id === medicine._id
        ? { ...item, quantity: item.quantity + 1 }
        : item));
    } else {
      setCart([...cart, { medicine, quantity: 1 }]);
    }
  };

  const handleMedicineSearchKeyDown = (event) => {
    if (!medicines.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedMedicine((index) => Math.min(index + 1, medicines.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedMedicine((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      addToCart(medicines[highlightedMedicine]);
    }
  };

  const updateQuantity = (medicineId, quantity) => {
    const item = cart.find((c) => c.medicine._id === medicineId);
    if (!item) return;
    if (quantity <= 0) {
      setCart(cart.filter((c) => c.medicine._id !== medicineId));
      return;
    }
    if (quantity > item.medicine.stockQuantity) {
      toast.error('Insufficient stock');
      return;
    }
    setCart(cart.map((c) => c.medicine._id === medicineId ? { ...c, quantity } : c));
  };

  const changeQuantity = (medicineId, delta) => {
    const item = cart.find((cartItem) => cartItem.medicine._id === medicineId);
    if (item) updateQuantity(medicineId, item.quantity + delta);
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') return (total * discountValue) / 100;
    return Math.min(discountValue, total);
  }, [total, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    return ((total - discountAmount) * taxRate) / 100;
  }, [total, discountAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return total - discountAmount + taxAmount;
  }, [total, discountAmount, taxAmount]);

  const requiresPrescription = cart.some((item) => item.medicine.isPrescriptionRequired);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: {
          userId: customer.userId || null,
          name: customer.name || 'Walk-in customer',
          phone: customer.phone || '',
          email: customer.email || ''
        },
        items: cart.map((item) => ({
          medicine: item.medicine._id,
          quantity: item.quantity
        })),
        paymentMethod,
        discount: { type: discountType, value: parseFloat(discountValue) || 0 },
        taxRate: parseFloat(taxRate) || 0,
        prescription: prescriptionId || null,
        notes
      };

      const response = await api.post('/sales', payload);
      toast.success('Sale created successfully');
      navigate(`/sales/${response.data.data.sale._id}`);
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create sale';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary-600">Point of sale</p>
          <h1 className="text-3xl font-bold text-gray-900">Create Sale</h1>
          <p className="mt-1 text-sm text-gray-500">Add medicines, confirm the customer, and collect payment.</p>
        </div>
        <button type="button" className="btn btn-secondary flex items-center gap-2" onClick={fetchMedicines}>
          <RefreshCw className="h-4 w-4" /> Refresh stock
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Find a medicine</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search name, generic name, or SKU"
              className="input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleMedicineSearchKeyDown}
              aria-label="Search medicines"
            />
          </div>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {medicines.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">No medicines found.</p>
            ) : medicines.map((med, index) => {
              const inCart = cart.find((item) => item.medicine._id === med._id)?.quantity || 0;
              const unavailable = med.status !== 'active' || med.stockQuantity === 0;
              return (
                <div key={med._id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${highlightedMedicine === index ? 'border-primary-500 bg-primary-50' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{med.name}</p>
                    <p className="text-xs text-gray-500">{med.genericName} · {med.sku}</p>
                    <p className={`text-sm ${unavailable ? 'text-red-600' : 'text-gray-600'}`}>
                      ₹{med.price.toFixed(2)} · {unavailable ? 'Unavailable' : `${med.stockQuantity} in stock`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary flex shrink-0 items-center gap-1"
                    disabled={unavailable || inCart >= med.stockQuantity}
                    onClick={() => addToCart(med)}
                    onFocus={() => setHighlightedMedicine(index)}
                  >
                    <Plus className="h-4 w-4" /> {inCart ? `Add (${inCart})` : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Cart</h2>
          {cart.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
              Your cart is empty. Search and add medicines to begin.
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.medicine._id} className="flex items-center justify-between gap-3 border-b pb-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.medicine.name}</p>
                    <p className="text-sm text-gray-500">₹{item.medicine.price.toFixed(2)} each · {item.medicine.stockQuantity} available</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" className="rounded border p-2 hover:bg-gray-50" onClick={() => changeQuantity(item.medicine._id, -1)} aria-label={`Decrease ${item.medicine.name}`}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button type="button" className="rounded border p-2 hover:bg-gray-50" onClick={() => changeQuantity(item.medicine._id, 1)} aria-label={`Increase ${item.medicine.name}`}>
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-2 text-red-600 hover:bg-red-50"
                      onClick={() => updateQuantity(item.medicine._id, 0)}
                      aria-label={`Remove ${item.medicine.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="w-20 text-right font-medium">₹{(item.medicine.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Discount</span>
                  <div className="flex items-center gap-1">
                    <select className="input w-24 text-xs" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                      <option value="percentage">%</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input w-20"
                      value={discountValue}
                      max={discountType === 'percentage' ? 100 : undefined}
                      onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span className="text-red-500">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-600">Tax Rate</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="input w-20"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    />
                    <span>%</span>
                    <span className="text-green-600">+₹{taxAmount.toFixed(2)}</span>
                  </div>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Customer & payment</h2>
          <p className="mt-1 text-sm text-gray-500">Use walk-in details when the customer does not have an account.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-gray-700">Customer name <span className="font-normal text-gray-400">(optional)</span>
            <input className="input mt-1" placeholder="Walk-in customer" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-gray-700">Phone number <span className="font-normal text-gray-400">(optional)</span>
            <input className="input mt-1" placeholder="Not required for walk-in sales" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-gray-700">Email <span className="font-normal text-gray-400">(optional)</span>
            <input type="email" className="input mt-1" placeholder="customer@example.com" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-gray-700">Payment method
            <select className="input mt-1" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="insurance">Insurance</option>
            <option value="online">Online</option>
            </select>
          </label>
          {requiresPrescription && (
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Verified prescription <span className="font-normal text-gray-400">(optional)</span>
              <select className="input mt-1" value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)}>
                <option value="">No prescription provided</option>
                {prescriptions.map((prescription) => (
                  <option key={prescription._id} value={prescription._id}>
                    {prescription.prescriptionNumber} · {prescription.customer?.firstName} {prescription.customer?.lastName} · expires {new Date(prescription.expiryDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-gray-500">
                If the customer shows a prescription, you can attach it here. Otherwise this can be completed without it.
              </span>
              {prescriptions.length === 0 && <span className="mt-1 block text-xs text-amber-600">No verified prescriptions are available right now, but the sale can still continue.</span>}
            </label>
          )}
        </div>
        <label className="text-sm font-medium text-gray-700">Notes <span className="font-normal text-gray-400">(optional)</span>
          <textarea className="input mt-1" placeholder="Add a note for the receipt or handover" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary min-w-40" disabled={loading || cart.length === 0}>
            {loading ? 'Processing...' : `Complete sale · ₹${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;
