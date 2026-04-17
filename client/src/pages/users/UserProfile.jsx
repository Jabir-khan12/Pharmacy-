import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.put(`/users/${user._id}`, formData);
      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    try {
      setPasswordLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="firstName" className="input" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          <input name="lastName" className="input" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
          <input name="email" className="input" placeholder="Email" value={formData.email} onChange={handleChange} />
          <input name="phone" className="input" placeholder="Phone" value={formData.phone} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="address.street" className="input" placeholder="Street" value={formData.address.street} onChange={handleChange} />
          <input name="address.city" className="input" placeholder="City" value={formData.address.city} onChange={handleChange} />
          <input name="address.state" className="input" placeholder="State" value={formData.address.state} onChange={handleChange} />
          <input name="address.zipCode" className="input" placeholder="Zip Code" value={formData.address.zipCode} onChange={handleChange} />
          <input name="address.country" className="input" placeholder="Country" value={formData.address.country} onChange={handleChange} />
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="card space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              className="input"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="input"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength={6}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfile;
