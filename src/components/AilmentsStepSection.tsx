import type { AilmentSeverity } from '../lib/api';

interface Ailment {
  id: string;
  name: string;
  description: string;
  medication: string;
  severity: string;
}

interface NewAilmentForm {
  name: string;
  description: string;
  medication: string;
  medicalDescription: string;
  severity: AilmentSeverity;
  notes: string;
  diagnosisDate: string;
  assignmentNotes: string;
}

interface AilmentsStepSectionProps {
  theme: 'green' | 'blue';
  headerHint: string;
  medicationHint: string;
  selectedAilments: string[];
  availableAilments: Ailment[];
  ailmentDetails: Record<string, { diagnosisDate: string; notes: string }>;
  newAilmentForm: NewAilmentForm;
  creatingAilment: boolean;
  onCreateAilment: () => void;
  onResetNewAilmentForm: () => void;
  onChangeNewAilmentForm: (next: NewAilmentForm) => void;
  onRemoveAilment: (ailmentId: string) => void;
  onUpdateAilmentDetails: (ailmentId: string, diagnosisDate: string, notes: string) => void;
}

export default function AilmentsStepSection({
  theme,
  headerHint,
  medicationHint,
  selectedAilments,
  availableAilments,
  ailmentDetails,
  newAilmentForm,
  creatingAilment,
  onCreateAilment,
  onResetNewAilmentForm,
  onChangeNewAilmentForm,
  onRemoveAilment,
}: AilmentsStepSectionProps) {
  const isGreen = theme === 'green';
  const focusClass = isGreen ? 'focus:ring-green-500' : 'focus:ring-blue-500';
  const createButtonClass = isGreen
    ? 'bg-green-500 hover:bg-green-600'
    : 'bg-blue-500 hover:bg-blue-600';
  const selected = availableAilments.filter((a) => selectedAilments.includes(a.id));
  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case 'mild':
      case 'leve':
        return 'Leve';
      case 'moderate':
      case 'moderado':
        return 'Moderado';
      case 'severe':
      case 'severo':
        return 'Severo';
      default:
        return severity || 'Sin severidad';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-6 space-y-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
          <div>
            <p className="text-sm font-bold text-gray-900">Nuevo padecimiento</p>
            <p className="text-xs text-gray-500">{headerHint}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Nombre del padecimiento *</label>
              <input
                type="text"
                placeholder="Ej: Asma, Alergia..."
                value={newAilmentForm.name}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, name: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Severidad</label>
              <select
                value={newAilmentForm.severity}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, severity: e.target.value as AilmentSeverity })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              >
                <option value="mild">Leve</option>
                <option value="moderate">Moderado</option>
                <option value="severe">Severo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Descripción general</label>
              <input
                type="text"
                placeholder="Descripción general"
                value={newAilmentForm.description}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, description: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Medicamento</label>
              <input
                type="text"
                placeholder="Ej: Loratadina, Paracetamol, Salbutamol"
                value={newAilmentForm.medication}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, medication: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
              <p className="mt-1 text-xs text-gray-500">{medicationHint}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Descripción médica</label>
              <input
                type="text"
                placeholder="Detalle médico"
                value={newAilmentForm.medicalDescription}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, medicalDescription: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Notas generales</label>
              <input
                type="text"
                placeholder="Notas adicionales"
                value={newAilmentForm.notes}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, notes: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Fecha de diagnóstico</label>
              <input
                type="date"
                value={newAilmentForm.diagnosisDate}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, diagnosisDate: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Notas del padecimiento</label>
              <input
                type="text"
                placeholder="Ej: Control mensual, observaciones..."
                value={newAilmentForm.assignmentNotes}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, assignmentNotes: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCreateAilment}
              disabled={creatingAilment}
              className={`rounded-full px-6 py-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${createButtonClass}`}
            >
              {creatingAilment ? 'Creando...' : 'Crear y asignar al alumno'}
            </button>
            <button
              type="button"
              onClick={onResetNewAilmentForm}
              className="rounded-full border border-gray-300 px-6 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-100"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Padecimientos de este alumno</p>
          {selected.length === 0 ? (
            <p className="text-sm text-gray-500">Los padecimientos que agregues aparecerán aquí.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              {selected.map((ailment) => (
                <div key={ailment.id} className="border-b border-gray-100 px-4 py-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{ailment.name}</p>
                      <p className="text-xs text-gray-500">
                        {getSeverityLabel(ailment.severity)}
                        {ailment.medication ? ` · Medicamento: ${ailment.medication}` : ''}
                      </p>
                      {ailment.description && (
                        <p className="text-xs text-gray-500">{ailment.description}</p>
                      )}
                      {ailmentDetails[ailment.id]?.diagnosisDate && (
                        <p className="text-xs text-gray-500">Diagnóstico: {ailmentDetails[ailment.id].diagnosisDate}</p>
                      )}
                      {ailmentDetails[ailment.id]?.notes && (
                        <p className="text-xs text-gray-500">Notas: {ailmentDetails[ailment.id].notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAilment(ailment.id)}
                      className="text-xs font-semibold text-red-600 transition-colors hover:text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
