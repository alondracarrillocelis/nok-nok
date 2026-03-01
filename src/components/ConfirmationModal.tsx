import { X, AlertCircle, Trash2, Edit3, Plus } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'delete' | 'edit' | 'add' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <Trash2 size={32} className="text-red-600" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          headerColor: 'text-red-900',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          accentColor: 'text-red-600',
        };
      case 'edit':
        return {
          icon: <Edit3 size={32} className="text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          headerColor: 'text-blue-900',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          accentColor: 'text-blue-600',
        };
      case 'add':
        return {
          icon: <Plus size={32} className="text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          headerColor: 'text-green-900',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          accentColor: 'text-green-600',
        };
      default:
        return {
          icon: <AlertCircle size={32} className="text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          headerColor: 'text-blue-900',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          accentColor: 'text-blue-600',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${styles.bgColor} border ${styles.borderColor} rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {styles.icon}
            <h2 className={`text-xl font-bold ${styles.headerColor}`}>{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 ${styles.buttonColor} text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isLoading ? 'Procesando...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
