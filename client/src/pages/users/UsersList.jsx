import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, filters.role, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(filters.role && { role: filters.role }),
          ...(debouncedSearch && { search: debouncedSearch })
        }
      });
      setUsers(response.data.data.users);
      setPagination((prev) => ({ ...prev, ...response.data.data.pagination }));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(`/users/${id}/activate`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <Link to="/users/new" className="btn btn-primary">+ Create User</Link>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="input"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="input"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">No users found</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-2 text-sm">{user.email}</td>
                  <td className="px-4 py-2 text-sm capitalize">{user.role}</td>
                  <td className="px-4 py-2 text-sm">{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-2 text-sm space-x-2">
                    <Link to={`/users/${user._id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                    <button className="text-primary-600" onClick={() => toggleStatus(user._id)}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="text-red-600" onClick={() => deleteUser(user._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
