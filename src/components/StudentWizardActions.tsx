interface StudentWizardActionsProps {
  accent: 'green' | 'blue';
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
  showNext: boolean;
  cancelDisabled?: boolean;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
}

export default function StudentWizardActions({
  accent,
  onCancel,
  onNext,
  onSubmit,
  showNext,
  cancelDisabled = false,
  nextDisabled = false,
  submitDisabled = false,
  submitLabel,
}: StudentWizardActionsProps) {
  const actionClass =
    accent === 'green'
      ? 'bg-green-500 hover:bg-green-600'
      : 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
      <button
        onClick={onCancel}
        disabled={cancelDisabled}
        className="px-8 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancelar
      </button>

      {showNext ? (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={`px-8 py-2 text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionClass}`}
        >
          Siguiente
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={submitDisabled}
          className={`px-8 py-2 text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionClass}`}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
