import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const paymentTermsOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'net_90', label: 'Net 90' },
];

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstNumber: '',
    licenseNumber: '',
    paymentTerms: 'net_30',
    notes: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });

  useEffect(() => {
    if (isEdit) fetchSupplier();
  }, [isEdit]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suppliers/${id}`);
      const s = response.data.data.supplier;
      setFormData({
        name: s.name || '',
        contactPerson: s.contactPerson || '',
        email: s.email || '',
        phone: s.phone || '',
        gstNumber: s.gstNumber || '',
        licenseNumber: s.licenseNumber || '',
        paymentTerms: s.paymentTerms || 'net_30',
        notes: s.notes || '',
        address: {
          street: s.address?.street || '',
          city: s.address?.city || '',
          state: s.address?.state || '',
          zipCode: s.address?.zipCode || '',
          country: s.address?.country || 'India'
        }
      });
    } catch {
      toast.error('Failed to load supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/suppliers/${id}`, formData);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created');
      }
      navigate('/suppliers');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit && !formData.name) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Supplier' : 'Add Supplier'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="input">
              {paymentTermsOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="input" />
          </div>
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-sm font-medium text-gray-700 px-2">Address</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Street</label>
              <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
              <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">State</label>
              <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ZIP Code</label>
              <input type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
              <input type="text" name="address.country" value={formData.address.country} onChange={handleChange} className="input" />
            </div>
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} className="input" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/suppliers')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
