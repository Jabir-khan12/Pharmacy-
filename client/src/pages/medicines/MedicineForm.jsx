import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const categories = [
  'Analgesics',
  'Antibiotics',
  'Antivirals',
  'Antifungals',
  'Antihistamines',
  'Cardiovascular',
  'Diabetes',
  'Gastrointestinal',
  'Respiratory',
  'Vitamins & Supplements',
  'Skin Care',
  'Other'
];

const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Other'];

const MedicineForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: categories[0],
    manufacturer: '',
    description: '',
    dosageForm: dosageForms[0],
    strength: '',
    price: '',
    stockQuantity: '',
    reorderLevel: 10,
    expiryDate: '',
    batchNumber: '',
    sku: '',
    rackLocation: '',
    isPrescriptionRequired: false,
    status: 'active'
  });

  useEffect(() => {
    if (isEdit) {
      fetchMedicine();
    }
  }, [isEdit]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/medicines/${id}`);
      const { medicine } = response.data.data;
      setFormData({
        name: medicine.name,
        genericName: medicine.genericName,
        category: medicine.category,
        manufacturer: medicine.manufacturer,
        description: medicine.description || '',
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        price: medicine.price,
        stockQuantity: medicine.stockQuantity,
        reorderLevel: medicine.reorderLevel,
        expiryDate: medicine.expiryDate.split('T')[0],
        batchNumber: medicine.batchNumber,
        sku: medicine.sku,
        rackLocation: medicine.rackLocation || '',
        isPrescriptionRequired: medicine.isPrescriptionRequired,
        status: medicine.status
      });
    } catch (error) {
      toast.error('Failed to load medicine');
      navigate('/medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity || 0, 10),
        reorderLevel: parseInt(formData.reorderLevel || 0, 10)
      };

      if (isEdit) {
        await api.put(`/medicines/${id}`, payload);
        toast.success('Medicine updated successfully');
      } else {
        await api.post('/medicines', payload);
        toast.success('Medicine created successfully');
      }

      navigate('/medicines');
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to save medicine';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Medicine' : 'Add Medicine'}</h1>
        <button onClick={() => navigate('/medicines')} className="btn btn-secondary">Back</button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
            <input name="genericName" value={formData.genericName} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="input">
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
            <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Form</label>
            <select name="dosageForm" value={formData.dosageForm} onChange={handleChange} className="input">
              {dosageForms.map((form) => (
                <option key={form} value={form}>{form}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <input name="strength" value={formData.strength} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="input" required={!isEdit} disabled={isEdit} />
            {isEdit && <p className="text-xs text-gray-500 mt-1">Use stock adjustment on detail page</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input name="batchNumber" value={formData.batchNumber} onChange={handleChange} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input name="sku" value={formData.sku} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rack Location</label>
            <input name="rackLocation" value={formData.rackLocation} onChange={handleChange} className="input" />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" name="isPrescriptionRequired" checked={formData.isPrescriptionRequired} onChange={handleChange} />
            <span className="text-sm text-gray-700">Prescription Required</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="input" rows="3" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/medicines')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Medicine' : 'Create Medicine')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicineForm;
