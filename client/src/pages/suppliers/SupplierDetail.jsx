import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Truck } from 'lucide-react';

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

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suppliers/${id}`);
      setSupplier(response.data.data.supplier);
    } catch {
      toast.error('Failed to load supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
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
    </div>
  );
};

export default SupplierDetail;
