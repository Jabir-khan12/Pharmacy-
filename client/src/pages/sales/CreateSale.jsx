import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';

const CreateSale = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    userId: user?.role === 'customer' ? user._id : '',
    name: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    if (debouncedSearch) {
      fetchMedicines();
    }
  }, [debouncedSearch]);

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

  const addToCart = (medicine) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    if (!customer.name || !customer.phone) {
      toast.error('Customer name and phone are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: {
          userId: customer.userId || null,
          name: customer.name,
          phone: customer.phone,
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

      await api.post('/sales', payload);
      toast.success('Sale created successfully');
      // Navigate to the sales list after successful creation
      navigate('/sales');
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to create sale';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Create Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Search Medicines</h2>
          <input
            type="text"
            placeholder="Search by name, generic, SKU..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {medicines.map((med) => (
              <div key={med._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-gray-500">₹{med.price.toFixed(2)} • Stock: {med.stockQuantity}</p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled={med.stockQuantity === 0}
                  onClick={() => addToCart(med)}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">No items added yet.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.medicine._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.medicine.name}</p>
                    <p className="text-sm text-gray-500">₹{item.medicine.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      className="input w-20"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.medicine._id, parseInt(e.target.value || 0, 10))}
                    />
                    <button
                      className="btn btn-danger"
                      onClick={() => updateQuantity(item.medicine._id, 0)}
                    >
                      Remove
                    </button>
                  </div>
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
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage">%</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input w-20"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
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
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
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
        <h2 className="text-xl font-semibold">Customer & Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="input"
            placeholder="Customer Name"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Phone"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Email (optional)"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="Customer User ID (optional)"
            value={customer.userId}
            onChange={(e) => setCustomer({ ...customer, userId: e.target.value })}
            disabled={user?.role === 'customer'}
          />
          <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="insurance">Insurance</option>
            <option value="online">Online</option>
          </select>
          <input
            className="input"
            placeholder="Prescription ID (optional)"
            value={prescriptionId}
            onChange={(e) => setPrescriptionId(e.target.value)}
          />
        </div>
        <textarea
          className="input"
          placeholder="Notes (optional)"
          rows="2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Create Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;
