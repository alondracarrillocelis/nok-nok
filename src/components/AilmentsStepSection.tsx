import { CalendarDays, Pill, ClipboardList, FileText, NotebookPen, PlusCircle, ShieldAlert, X } from 'lucide-react';

type AilmentSeverity = 'leve' | 'moderado' | 'severo';

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
  onUpdateAilmentDetails,
}: AilmentsStepSectionProps) {
  const isGreen = theme === 'green';
  const focusClass = isGreen ? 'focus:ring-green-500' : 'focus:ring-blue-500';
  const plusBoxClass = isGreen ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
  const titleIconClass = isGreen ? 'text-green-600' : 'text-blue-600';
  const createButtonClass = isGreen
    ? 'bg-green-500 hover:bg-green-600'
    : 'bg-blue-500 hover:bg-blue-600';
  const pillColorClass = isGreen ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
  const selected = availableAilments.filter((a) => selectedAilments.includes(a.id));

  return (
    <div className="space-y-4">
      <div>
        {/* <label className="mb-3 block text-sm font-semibold text-gray-700">
          Padecimientos del alumno (Condiciones de Salud)
        </label>
        <p className="mb-4 text-sm text-gray-600">
          Los padecimientos que agregues quedarán asignados a este alumno.
        </p> */}

        <div className="mb-6 space-y-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${plusBoxClass}`}>
              <PlusCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Nuevo padecimiento</p>
              <p className="text-xs text-gray-500">{headerHint}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {/* <ClipboardList size={16} className={titleIconClass} /> */}
                Nombre del padecimiento *
              </label>
              <input
                type="text"
                placeholder="Ej: Asma, Alergia..."
                value={newAilmentForm.name}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, name: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {/* <ShieldAlert size={16} className="text-amber-600" /> */}
                Severidad
              </label>
              <select
                value={newAilmentForm.severity}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, severity: e.target.value as AilmentSeverity })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              >
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="severo">Severo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {/* <FileText size={16} className="text-slate-600" /> */}
                Descripción general
              </label>
              <input
                type="text"
                placeholder="Descripción general"
                value={newAilmentForm.description}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, description: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {/* <Pill size={16} className="text-blue-600" /> */}
                Medicamento
              </label>
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
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {/* <NotebookPen size={16} className="text-purple-600" /> */}
                Descripción médica
              </label>
              <input
                type="text"
                placeholder="Detalle médico"
                value={newAilmentForm.medicalDescription}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, medicalDescription: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 ${focusClass}`}
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                {/* <CalendarDays size={16} className="text-teal-600" /> */}
                Notas y seguimiento
              </label>
              <input
                type="text"
                placeholder="Notas adicionales"
                value={newAilmentForm.notes}
                onChange={(e) => onChangeNewAilmentForm({ ...newAilmentForm, notes: e.target.value })}
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
            <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
              {selected.map((ailment) => (
                <div
                  key={ailment.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${pillColorClass}`}>
                          <Pill size={16} />
                        </div>
                        <p className="font-semibold text-gray-800">{ailment.name}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ailment.severity && (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              ailment.severity === 'severo'
                                ? 'bg-red-100 text-red-700'
                                : ailment.severity === 'moderado'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {ailment.severity}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAilment(ailment.id)}
                      className="rounded-full p-1.5 text-red-600 transition-colors hover:bg-red-50"
                      title="Quitar padecimiento"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mb-3 grid gap-2 rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Pill size={15} className="text-blue-600" />
                      <span className="font-semibold">Medicamento:</span>
                      <span>{ailment.medication || 'No especificado'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                      <FileText size={15} className="mt-0.5 text-slate-500" />
                      <div>
                        <span className="font-semibold">Descripción:</span>{' '}
                        <span>{ailment.description || 'Sin descripción'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-gray-200 pt-3">
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <CalendarDays size={14} className="text-teal-600" />
                        Fecha de Diagnóstico
                      </label>
                      <input
                        type="date"
                        value={ailmentDetails[ailment.id]?.diagnosisDate || ''}
                        onChange={(e) =>
                          onUpdateAilmentDetails(
                            ailment.id,
                            e.target.value,
                            ailmentDetails[ailment.id]?.notes || ''
                          )
                        }
                        className={`w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 ${focusClass}`}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <NotebookPen size={14} className="text-purple-600" />
                        Notas del Padecimiento
                      </label>
                      <textarea
                        value={ailmentDetails[ailment.id]?.notes || ''}
                        onChange={(e) =>
                          onUpdateAilmentDetails(
                            ailment.id,
                            ailmentDetails[ailment.id]?.diagnosisDate || '',
                            e.target.value
                          )
                        }
                        placeholder="Ej: Tomar medicamento cada 8 horas..."
                        className={`w-full resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 ${focusClass}`}
                        rows={2}
                      />
                    </div>
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
