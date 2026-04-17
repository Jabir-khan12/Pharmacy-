import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PrescriptionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/prescriptions/${id}`);
      setPrescription(response.data.data.prescription);
    } catch (error) {
      toast.error('Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const verifyPrescription = async (status) => {
    try {
      await api.patch(`/prescriptions/${id}/verify`, {
        status,
        verificationNotes
      });
      toast.success(`Prescription ${status}`);
      fetchPrescription();
    } catch (error) {
      toast.error('Failed to update prescription');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!prescription) {
    return null;
  }

  const canVerify = user?.role === 'admin' || user?.role === 'pharmacist';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Prescription {prescription.prescriptionNumber}</h1>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Doctor</p>
            <p className="font-medium">{prescription.doctorName}</p>
            <p className="text-sm text-gray-600">{prescription.doctorContact}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium">{prescription.customer?.firstName} {prescription.customer?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Uploaded File</p>
            {prescription.uploadedFile ? (
              <button
                className="text-primary-600 hover:underline"
                onClick={async () => {
                  try {
                    const response = await api.get(`/prescriptions/${id}/file`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(response.data);
                    window.open(url, '_blank');
                  } catch {
                    toast.error('Failed to load prescription file');
                  }
                }}
              >
                View File
              </button>
            ) : (
              <p className="text-gray-400">No file uploaded</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Prescribed Medicines</h2>
            {prescription.prescribedMedicines?.length ? (
              <ul className="list-disc list-inside">
                {prescription.prescribedMedicines.map((med, index) => (
                  <li key={index}>
                    {med.medicineName} — {med.dosage}, {med.duration}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No medicines listed.</p>
            )}
          </div>
        </div>

        <div className="card space-y-3">
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium capitalize">{prescription.status}</p>
          <p className="text-sm text-gray-500">Expiry</p>
          <p className="font-medium">{new Date(prescription.expiryDate).toLocaleDateString()}</p>

          {canVerify && prescription.status === 'pending' && (
            <>
              <textarea
                className="input"
                rows="3"
                placeholder="Verification notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => verifyPrescription('verified')}>Verify</button>
                <button className="btn btn-danger" onClick={() => verifyPrescription('rejected')}>Reject</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetail;
