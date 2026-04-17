import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Package, ShoppingCart, RotateCcw, FileText, 
  BarChart3, Users, User, Bell, LogOut, Menu, X, Truck, ClipboardList 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../../config/api';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  // Click-outside handler for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch notification count periodically
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        if (user?.role === 'admin' || user?.role === 'pharmacist') {
          const response = await api.get('/notifications?limit=5');
          const data = response.data.data;
          setNotifications(data?.notifications?.slice(0, 5) || []);
          setNotificationCount(data?.unreadCount || 0);
        }
      } catch {
        // silently fail
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setNotificationCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const isActive = (href) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'pharmacist', 'customer'] },
    { name: 'Medicines', href: '/medicines', icon: Package, roles: ['admin', 'pharmacist', 'customer'] },
    { name: 'Sales', href: '/sales', icon: ShoppingCart, roles: ['admin', 'pharmacist', 'customer'] },
    { name: 'Returns', href: '/returns', icon: RotateCcw, roles: ['admin', 'pharmacist'] },
    { name: 'Prescriptions', href: '/prescriptions', icon: FileText, roles: ['admin', 'pharmacist', 'customer'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'pharmacist'] },
    { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'pharmacist'] },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ClipboardList, roles: ['admin', 'pharmacist'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-lg
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary-600">PharmaCare</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            {(user?.role === 'admin' || user?.role === 'pharmacist') && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-primary-600"
                >
                  <Bell className="w-6 h-6" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border z-50">
                    <div className="p-3 border-b flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <Link
                        to="/notifications"
                        className="text-xs text-primary-600 hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        View All
                      </Link>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                              !n.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markAsRead(n._id)}
                          >
                            <p className="text-sm text-gray-800 font-medium">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message?.slice(0, 80)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Link to="/profile" className="p-2 text-gray-600 hover:text-primary-600">
                <User className="w-6 h-6" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
