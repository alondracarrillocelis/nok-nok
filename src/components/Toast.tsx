import { useState, useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

let toastId = 0;
const toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) => {
  const id = `toast-${toastId++}`;
  const newToast: Toast = { id, message, type, duration };
  
  toasts = [...toasts, newToast];
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
};

const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
};

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]));
};

export const Toast = () => {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToastList);
    return () => {
      toastListeners.splice(toastListeners.indexOf(setToastList), 1);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 space-y-3 z-50">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-sm border animate-in fade-in slide-in-from-left-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toast.type === 'success' && <Check size={20} className="text-green-500 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-red-500 flex-shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-500 flex-shrink-0" />}
          
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
