import { AlertTriangle, Info, Trash2, CheckCircle } from 'lucide-react';

const iconMap = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle
};

const colorMap = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-yellow-600 hover:bg-yellow-700',
  info: 'bg-blue-600 hover:bg-blue-700',
  success: 'bg-green-600 hover:bg-green-700'
};

/**
 * Confirmation dialog component.
 *
 * Props:
 * - isOpen: boolean
 * - title: string
 * - message: string
 * - confirmLabel: string (default: 'Confirm')
 * - cancelLabel: string (default: 'Cancel')
 * - variant: 'danger' | 'warning' | 'info' | 'success' (default: 'danger')
 * - onConfirm: () => void
 * - onCancel: () => void
 * - loading: boolean
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false
}) => {
  if (!isOpen) return null;

  const Icon = iconMap[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-100' : variant === 'warning' ? 'bg-yellow-100' : variant === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
            <Icon className={`w-5 h-5 ${variant === 'danger' ? 'text-red-600' : variant === 'warning' ? 'text-yellow-600' : variant === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${colorMap[variant]} disabled:opacity-50`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
