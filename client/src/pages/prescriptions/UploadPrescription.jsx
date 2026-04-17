import { useState } from 'react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const UploadPrescription = () => {
  const [doctorName, setDoctorName] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [file, setFile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [medForm, setMedForm] = useState({ medicineName: '', dosage: '', duration: '', instructions: '' });
  const [loading, setLoading] = useState(false);

  const addMedicine = () => {
    if (!medForm.medicineName || !medForm.dosage || !medForm.duration) {
      toast.error('Please fill medicine name, dosage, and duration');
      return;
    }
    setMedicines((prev) => [...prev, medForm]);
    setMedForm({ medicineName: '', dosage: '', duration: '', instructions: '' });
  };

  const removeMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a prescription file');
      return;
    }

    const formData = new FormData();
    formData.append('prescriptionFile', file);
    formData.append('doctorName', doctorName);
    formData.append('doctorContact', doctorContact);
    formData.append('expiryDays', expiryDays);
    formData.append('prescribedMedicines', JSON.stringify(medicines));

    try {
      setLoading(true);
      await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Prescription uploaded successfully');
      setDoctorName('');
      setDoctorContact('');
      setExpiryDays(30);
      setFile(null);
      setMedicines([]);
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to upload prescription';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Upload Prescription</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Doctor Name" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
          <input className="input" placeholder="Doctor Contact" value={doctorContact} onChange={(e) => setDoctorContact(e.target.value)} />
          <input type="number" className="input" placeholder="Expiry Days" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
          <input type="file" className="input" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0])} required />
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Prescribed Medicines</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="input" placeholder="Medicine Name" value={medForm.medicineName} onChange={(e) => setMedForm({ ...medForm, medicineName: e.target.value })} />
            <input className="input" placeholder="Dosage" value={medForm.dosage} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} />
            <input className="input" placeholder="Duration" value={medForm.duration} onChange={(e) => setMedForm({ ...medForm, duration: e.target.value })} />
            <input className="input" placeholder="Instructions" value={medForm.instructions} onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })} />
          </div>
          <button type="button" className="btn btn-secondary mt-3" onClick={addMedicine}>Add Medicine</button>

          {medicines.length > 0 && (
            <div className="mt-4 space-y-2">
              {medicines.map((med, index) => (
                <div key={index} className="flex justify-between items-center border rounded-lg p-2">
                  <div className="text-sm">
                    <p className="font-medium">{med.medicineName}</p>
                    <p className="text-gray-500">{med.dosage} • {med.duration}</p>
                  </div>
                  <button type="button" className="text-red-600" onClick={() => removeMedicine(index)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPrescription;
