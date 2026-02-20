import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'personal' | 'academic' | 'tutor' | 'conditions';

export default function AddStudentModal({ onClose, onSuccess }: AddStudentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [formData, setFormData] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    birthDate: '',
    age: '',
    curp: '',
    enrollmentNumber: '',
    enrollmentDate: '',
    currentLevel: 'Principiante',
    currentGrade: 'Principiante',
    program: 'Programa I',
    shift: 'Matutino',
    representative: 'Representante I',
    tutorName: '',
    tutorPhone: '',
    tutorEmail: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .insert([
          {
            first_name: formData.firstName,
            paternal_surname: formData.paternalSurname,
            maternal_surname: formData.maternalSurname,
            birth_date: formData.birthDate,
            curp: formData.curp,
            enrollment_number: formData.enrollmentNumber,
            enrollment_date: formData.enrollmentDate || new Date().toISOString().split('T')[0],
            current_level: formData.currentLevel,
            current_grade: formData.currentGrade,
            program: formData.program,
            shift: formData.shift,
            representative: formData.representative,
            status: 'activo',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (student && formData.tutorName) {
        await supabase.from('tutors').insert([
          {
            student_id: student.id,
            name: formData.tutorName,
            phone: formData.tutorPhone,
            email: formData.tutorEmail,
          },
        ]);
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  const steps = [
    { id: 'personal', label: 'Info. Personal' },
    { id: 'academic', label: 'Info. Académica' },
    { id: 'tutor', label: 'Tutor' },
    { id: 'conditions', label: 'Padecimientos' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        <div className="w-48 bg-gray-50 p-6 space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as Step)}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === step.id
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Agregar Alumno/a</h2>
              <p className="text-sm text-gray-500">Por favor llena los campos solicitados</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {currentStep === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Karen Paola"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido Paterno
                  </label>
                  <input
                    type="text"
                    value={formData.paternalSurname}
                    onChange={(e) => updateField('paternalSurname', e.target.value)}
                    placeholder="Díaz"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    value={formData.maternalSurname}
                    onChange={(e) => updateField('maternalSurname', e.target.value)}
                    placeholder="Alammmyyyy"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CURP
                  </label>
                  <input
                    type="text"
                    value={formData.curp}
                    onChange={(e) => updateField('curp', e.target.value)}
                    placeholder="CACG031204HMCRSR05"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    placeholder="18 años"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Documentos
                </label>
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto mb-2 text-green-500" size={32} />
                  <p className="text-sm text-gray-600">Arrastra archivos aquí o haz clic para seleccionar</p>
                  <div className="mt-4 flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                      <FileText size={20} className="text-blue-600" />
                      <span className="text-sm font-medium">documento.pdf</span>
                    </div>
                    <span className="text-xs text-gray-500">Acta de Nacimiento</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'academic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={formData.enrollmentNumber}
                    onChange={(e) => updateField('enrollmentNumber', e.target.value)}
                    placeholder="A001"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Inscripción
                  </label>
                  <input
                    type="date"
                    value={formData.enrollmentDate}
                    onChange={(e) => updateField('enrollmentDate', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nivel Actual
                  </label>
                  <select
                    value={formData.currentLevel}
                    onChange={(e) => updateField('currentLevel', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Principiante</option>
                    <option>Intermedio</option>
                    <option>Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Inscripción
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Anual</option>
                    <option>Mensual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grado Actual
                  </label>
                  <select
                    value={formData.currentGrade}
                    onChange={(e) => updateField('currentGrade', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Principiante</option>
                    <option>Medio</option>
                    <option>Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nivel de Inscripción
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Medio</option>
                    <option>Básico</option>
                    <option>Superior</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Programa
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => updateField('program', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Programa I</option>
                    <option>Programa II</option>
                    <option>Programa III</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Representante
                  </label>
                  <select
                    value={formData.representative}
                    onChange={(e) => updateField('representative', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Representante I</option>
                    <option>Representante II</option>
                    <option>Representante III</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Turno
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) => updateField('shift', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option>Matutino</option>
                  <option>Vespertino</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 'tutor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Tutor
                </label>
                <input
                  type="text"
                  value={formData.tutorName}
                  onChange={(e) => updateField('tutorName', e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.tutorPhone}
                  onChange={(e) => updateField('tutorPhone', e.target.value)}
                  placeholder="555-123-4567"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.tutorEmail}
                  onChange={(e) => updateField('tutorEmail', e.target.value)}
                  placeholder="tutor@email.com"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {currentStep === 'conditions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Padecimientos o Condiciones Médicas
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe cualquier padecimiento o condición médica relevante..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const stepOrder: Step[] = ['personal', 'academic', 'tutor', 'conditions'];
                const currentIndex = stepOrder.indexOf(currentStep);
                if (currentIndex < stepOrder.length - 1) {
                  setCurrentStep(stepOrder[currentIndex + 1]);
                } else {
                  handleSubmit();
                }
              }}
              className="px-8 py-2 bg-blue-900 text-white rounded-full font-semibold hover:bg-blue-800 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
