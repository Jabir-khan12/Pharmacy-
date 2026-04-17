import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/layout/DashboardLayout';
import MedicineList from './pages/medicines/MedicineList';
import MedicineForm from './pages/medicines/MedicineForm';
import MedicineDetail from './pages/medicines/MedicineDetail';
import CreateSale from './pages/sales/CreateSale';
import SalesList from './pages/sales/SalesList';
import SaleDetail from './pages/sales/SaleDetail';
import ReturnsList from './pages/returns/ReturnsList';
import CreateReturn from './pages/returns/CreateReturn';
import ReturnDetail from './pages/returns/ReturnDetail';
import PrescriptionsList from './pages/prescriptions/PrescriptionsList';
import UploadPrescription from './pages/prescriptions/UploadPrescription';
import PrescriptionDetail from './pages/prescriptions/PrescriptionDetail';
import Reports from './pages/Reports';
import UsersList from './pages/users/UsersList';
import UserProfile from './pages/users/UserProfile';
import UserForm from './pages/users/UserForm';
import NotificationList from './pages/notifications/NotificationList';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierForm from './pages/suppliers/SupplierForm';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import PurchaseOrderList from './pages/purchaseOrders/PurchaseOrderList';
import CreatePurchaseOrder from './pages/purchaseOrders/CreatePurchaseOrder';
import PurchaseOrderDetail from './pages/purchaseOrders/PurchaseOrderDetail';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Medicine Routes */}
        <Route path="medicines" element={<MedicineList />} />
        <Route path="medicines/new" element={<ProtectedRoute roles={['admin', 'pharmacist']}><MedicineForm /></ProtectedRoute>} />
        <Route path="medicines/:id" element={<MedicineDetail />} />
        <Route path="medicines/:id/edit" element={<ProtectedRoute roles={['admin', 'pharmacist']}><MedicineForm /></ProtectedRoute>} />
        
        {/* Sales Routes */}
        <Route path="sales" element={<SalesList />} />
        <Route path="sales/new" element={<ProtectedRoute roles={['admin', 'pharmacist']}><CreateSale /></ProtectedRoute>} />
        <Route path="sales/:id" element={<SaleDetail />} />
        
        {/* Returns Routes */}
        <Route path="returns" element={<ProtectedRoute roles={['admin', 'pharmacist']}><ReturnsList /></ProtectedRoute>} />
        <Route path="returns/new" element={<CreateReturn />} />
        <Route path="returns/:id" element={<ReturnDetail />} />
        
        {/* Prescription Routes */}
        <Route path="prescriptions" element={<PrescriptionsList />} />
        <Route path="prescriptions/upload" element={<UploadPrescription />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
        
        {/* Reports */}
        <Route path="reports" element={<ProtectedRoute roles={['admin', 'pharmacist']}><Reports /></ProtectedRoute>} />
        
        {/* User Management */}
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersList /></ProtectedRoute>} />
        <Route path="users/new" element={<ProtectedRoute roles={['admin']}><UserForm /></ProtectedRoute>} />
        <Route path="users/:id/edit" element={<ProtectedRoute roles={['admin']}><UserForm /></ProtectedRoute>} />
        <Route path="profile" element={<UserProfile />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<ProtectedRoute roles={['admin', 'pharmacist']}><NotificationList /></ProtectedRoute>} />
        
        {/* Supplier Routes */}
        <Route path="suppliers" element={<ProtectedRoute roles={['admin', 'pharmacist']}><SupplierList /></ProtectedRoute>} />
        <Route path="suppliers/new" element={<ProtectedRoute roles={['admin']}><SupplierForm /></ProtectedRoute>} />
        <Route path="suppliers/:id" element={<ProtectedRoute roles={['admin', 'pharmacist']}><SupplierDetail /></ProtectedRoute>} />
        <Route path="suppliers/:id/edit" element={<ProtectedRoute roles={['admin']}><SupplierForm /></ProtectedRoute>} />
        
        {/* Purchase Order Routes */}
        <Route path="purchase-orders" element={<ProtectedRoute roles={['admin', 'pharmacist']}><PurchaseOrderList /></ProtectedRoute>} />
        <Route path="purchase-orders/new" element={<ProtectedRoute roles={['admin']}><CreatePurchaseOrder /></ProtectedRoute>} />
        <Route path="purchase-orders/:id" element={<ProtectedRoute roles={['admin', 'pharmacist']}><PurchaseOrderDetail /></ProtectedRoute>} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={user ? <NotFound /> : <Navigate to="/login" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
