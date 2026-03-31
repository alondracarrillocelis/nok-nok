interface StepItem {
  id: string;
  label: string;
}

interface StudentWizardStepsProps {
  steps: StepItem[];
  currentStep: string;
  accent: 'green' | 'blue';
  onStepChange: (stepId: string) => void;
}

export default function StudentWizardSteps({
  steps,
  currentStep,
  accent,
  onStepChange,
}: StudentWizardStepsProps) {
  const activeClass = accent === 'green' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white';

  return (
    <div className="w-48 bg-gray-50 p-6 space-y-2">
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => onStepChange(step.id)}
          className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
            currentStep === step.id ? activeClass : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {step.label}
        </button>
      ))}
    </div>
  );
}
