import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
}

export default function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div className="mt-2 flex items-start gap-2 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-2 text-rose-700 shadow-sm">
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
      <span className="text-xs font-semibold leading-5">{message}</span>
    </div>
  );
}
