import { useEffect, useState, useCallback } from 'react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Trash2, AlertTriangle, Package, Clock } from 'lucide-react';

const typeIcons = {
  low_stock: <Package className="w-5 h-5 text-yellow-500" />,
  out_of_stock: <AlertTriangle className="w-5 h-5 text-red-500" />,
  expiry_7_days: <Clock className="w-5 h-5 text-red-500" />,
  expiry_30_days: <Clock className="w-5 h-5 text-orange-500" />,
  expiry_alert: <Clock className="w-5 h-5 text-orange-500" />,
  system: <Bell className="w-5 h-5 text-blue-500" />,
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter === 'unread') params.append('isRead', 'false');
      if (filter === 'read') params.append('isRead', 'true');
      if (typeFilter) params.append('type', typeFilter);

      const response = await api.get(`/notifications?${params}`);
      const { notifications: data, pagination: pag, unreadCount: uc } = response.data.data;
      setNotifications(data);
      setPagination(pag);
      setUnreadCount(uc);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Types</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="expiry_7_days">Expiry (7 days)</option>
          <option value="expiry_30_days">Expiry (30 days)</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 card">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`card flex items-start gap-4 transition-colors ${
                !notification.isRead ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {typeIcons[notification.type] || <Bell className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notification.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[notification.priority]}`}>
                    {notification.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchNotifications(page)}
              className={`px-3 py-1 rounded text-sm ${
                pagination.page === page
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList;
