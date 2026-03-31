import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
}

export default function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div className="mt-1 flex items-center space-x-1 text-red-500">
      <AlertCircle size={16} />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}
