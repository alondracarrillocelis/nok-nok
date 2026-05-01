import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { students as studentsApi, programs as programsApi, users as usersApi, ailments as ailmentsApi, studentAilments, enrollments, documents } from '../lib/api';
import type { AilmentSeverity } from '../lib/api';
import { ENROLLMENT_TYPE_OPTIONS, EnrollmentType, getAvailableProgramOptions, ProgramOption } from '../lib/academy';
import { showToast } from './Toast';
import DragDropUpload from './DragDropUpload';
import ConfirmationModal from './ConfirmationModal';
import AilmentsStepSection from './AilmentsStepSection';
import FieldError from './FieldError';
import StudentWizardActions from './StudentWizardActions';
import StudentWizardSteps from './StudentWizardSteps';
import { formatPhoneMask, isValidPhone } from '../lib/validators';

interface Ailment {
  id: string;
  name: string;
  description: string;
  medication: string;
  medicalDescription?: string;
  severity: string;
  notes?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ApiUser {
  id: string;
  firstName?: string;
  paternalSurname?: string;
  maternalSurname?: string | null;
  email: string;
  role: string;
}

interface AddStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  previewMode?: boolean;
}

type Step = 'personal' | 'inscription' | 'tutor' | 'ailments';
type GenderValue = '' | 'male' | 'female' | 'other';

export default function AddStudentModal({ onClose, onSuccess, previewMode = false }: AddStudentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const initialData = {
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    gender: '' as GenderValue,
    birthDate: '',
    enrollmentNumber: '',
    enrollmentDate: '',
    currentLevel: 'Principiante',
    currentGrade: 'Principiante',
    program: '',
    shift: 'Matutino',
    representative: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    folio: '',
    inscriptionDate: new Date().toISOString().split('T')[0],
    inscriptionType: 'semanal' as EnrollmentType,
    inscriptionProgram: '',
    representativeId: '',
  };
  const [formData, setFormData] = useState(initialData);
  const [initialFormData, setInitialFormData] = useState(initialData);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramOption[]>([]);
  const [selectedAilments, setSelectedAilments] = useState<string[]>([]);
  const [availableAilments, setAvailableAilments] = useState<Ailment[]>([]);
  const [ailmentDetails, setAilmentDetails] = useState<Record<string, { diagnosisDate: string; notes: string }>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [newAilmentForm, setNewAilmentForm] = useState({
    name: '',
    description: '',
    medication: '',
    medicalDescription: '',
    severity: 'moderate' as AilmentSeverity,
    notes: '',
    diagnosisDate: '',
    assignmentNotes: '',
  });
  const [creatingAilment, setCreatingAilment] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData) || selectedAilments.length > 0 || documentFiles.length > 0;
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (previewMode) {
      const mockPrograms: ProgramOption[] = [
        { id: 'program-1', name: 'Iniciacion Musical', description: 'Piano y ritmo' },
        { id: 'program-2', name: 'Exploracion Creativa', description: 'Arte y movimiento' },
      ];
      const mockAilments: Ailment[] = [
        {
          id: 'ailment-1',
          name: 'Alergia estacional',
          description: 'Sensibilidad al polvo',
          medication: 'Loratadina',
          medicalDescription: 'Controlada',
          severity: 'mild',
          notes: 'Solo en temporada',
        },
      ];
      const mockUsers: User[] = [
        {
          id: 'user-1',
          name: 'Laura Martinez',
          email: 'laura@example.com',
          role: 'tutor',
        },
      ];

      setAvailablePrograms(mockPrograms);
      setAvailableAilments(mockAilments);
      setAvailableUsers(mockUsers);
      setFormData((prev) => ({
        ...prev,
        firstName: 'Valeria',
        paternalSurname: 'Santos',
        maternalSurname: 'Lopez',
        gender: 'female',
        birthDate: '2017-09-14',
        enrollmentNumber: 'MAT-2026-014',
        enrollmentDate: new Date().toISOString().split('T')[0],
        currentLevel: 'Intermedio',
        currentGrade: 'Segundo',
        program: mockPrograms[0].id,
        inscriptionProgram: mockPrograms[0].id,
        representativeId: mockUsers[0].id,
        representative: mockUsers[0].name,
        emergencyContactName: 'Rosa Lopez',
        emergencyContactPhone: '555-123-4567',
        folio: 'FOL-2026-014',
        shift: 'Matutino',
      }));
      setInitialFormData((prev) => ({
        ...prev,
        firstName: 'Valeria',
        paternalSurname: 'Santos',
        maternalSurname: 'Lopez',
        gender: 'female',
        birthDate: '2017-09-14',
        enrollmentNumber: 'MAT-2026-014',
        enrollmentDate: new Date().toISOString().split('T')[0],
        currentLevel: 'Intermedio',
        currentGrade: 'Segundo',
        program: mockPrograms[0].id,
        inscriptionProgram: mockPrograms[0].id,
        representativeId: mockUsers[0].id,
        representative: mockUsers[0].name,
        emergencyContactName: 'Rosa Lopez',
        emergencyContactPhone: '555-123-4567',
        folio: 'FOL-2026-014',
        shift: 'Matutino',
      }));
      setSelectedAilments(['ailment-1']);
      setAilmentDetails({
        'ailment-1': {
          diagnosisDate: '2026-01-12',
          notes: 'Seguimiento anual',
        },
      });
      return;
    }

    fetchPrograms();
    fetchAilments();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAilments = async () => {
    try {
      const response = await ailmentsApi.list();
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as { data?: Ailment[] }).data)
          ? (response as { data: Ailment[] }).data
          : [];
      setAvailableAilments(list as Ailment[]);
    } catch (error) {
      console.error('Error fetching ailments:', error);
      setAvailableAilments([]);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await programsApi.list();
      const nextPrograms = getAvailableProgramOptions(response, formData.program || formData.inscriptionProgram);

      setAvailablePrograms(nextPrograms);

      if (nextPrograms.length > 0) {
        setFormData((prev) => ({
          ...prev,
          program: prev.program || prev.inscriptionProgram || nextPrograms[0].id,
          inscriptionProgram: prev.inscriptionProgram || prev.program || nextPrograms[0].id,
        }));
        setInitialFormData((prev) => ({
          ...prev,
          program: prev.program || prev.inscriptionProgram || nextPrograms[0].id,
          inscriptionProgram: prev.inscriptionProgram || prev.program || nextPrograms[0].id,
        }));
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setAvailablePrograms([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await usersApi.list();
      setAvailableUsers(
        data.map((u: ApiUser) => ({
          id: u.id,
          name: [u.firstName, u.paternalSurname, u.maternalSurname].filter(Boolean).join(' '),
          email: u.email,
          role: u.role,
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleRepresentativeChange = (userId: string) => {
    const selectedUser = availableUsers.find((user) => user.id === userId);
    setFormData((prev) => ({
      ...prev,
      representativeId: userId,
      representative: selectedUser?.name || '',
    }));
  };

  const handleCreateAilment = async () => {
    if (previewMode) {
      showToast('Vista previa: este modo no crea padecimientos ni llama a la API', 'info');
      return;
    }

    if (!newAilmentForm.name.trim()) {
      showToast('El nombre del padecimiento es obligatorio', 'error');
      return;
    }

    setCreatingAilment(true);
    try {
      const newAilment = await ailmentsApi.create({
        name: newAilmentForm.name.trim(),
        description: newAilmentForm.description.trim(),
        medication: newAilmentForm.medication.trim(),
        medicalDescription: newAilmentForm.medicalDescription.trim(),
        severity: newAilmentForm.severity,
        status: 'active',
        notes: newAilmentForm.notes.trim(),
      });

      if (newAilment) {
        // Add new ailment to the list
        setAvailableAilments(prev => [...prev, newAilment as Ailment]);
        // Auto-select the new ailment
        setSelectedAilments(prev => [...prev, newAilment.id]);
        setAilmentDetails((prev) => ({
          ...prev,
          [newAilment.id]: {
            diagnosisDate: newAilmentForm.diagnosisDate,
            notes: newAilmentForm.assignmentNotes.trim(),
          },
        }));
        // Reset form
        setNewAilmentForm({
          name: '',
          description: '',
          medication: '',
          medicalDescription: '',
          severity: 'moderate',
          notes: '',
          diagnosisDate: '',
          assignmentNotes: '',
        });
        showToast('Padecimiento creado y asignado al alumno', 'success');
      }
    } catch (error) {
      console.error('Error creating ailment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear padecimiento';
      showToast(errorMessage, 'error');
    } finally {
      setCreatingAilment(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePersonalStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }
    if (!formData.paternalSurname.trim()) {
      newErrors.paternalSurname = 'El apellido paterno es obligatorio';
    }
    if (!formData.enrollmentNumber.trim()) {
      newErrors.enrollmentNumber = 'La matrícula es obligatoria';
    }
    if (!formData.gender) {
      newErrors.gender = 'El género es obligatorio';
    }
    if (formData.enrollmentNumber && formData.enrollmentNumber.trim().length < 4) {
      newErrors.enrollmentNumber = 'La matrícula debe tener al menos 4 caracteres';
    }
    if (formData.birthDate) {
      const today = new Date();
      if (new Date(formData.birthDate) > today) {
        newErrors.birthDate = 'La fecha de nacimiento no puede ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateInscriptionStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentLevel) {
      newErrors.currentLevel = 'El nivel actual es obligatorio';
    }
    if (!formData.shift) {
      newErrors.shift = 'El turno es obligatorio';
    }
    if (!formData.currentGrade.trim()) {
      newErrors.currentGrade = 'El grado actual es obligatorio';
    }
    // Programa es opcional - puede asignarse después

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (): boolean => {
    if (currentStep === 'personal') {
      return validatePersonalStep();
    } else if (currentStep === 'inscription') {
      return validateInscriptionStep();
    } else if (currentStep === 'tutor') {
      const newErrors: Record<string, string> = {};

      if (formData.emergencyContactPhone.trim() && !isValidPhone(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = 'El teléfono debe tener entre 10 y 15 dígitos';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    // documents and other steps have no required fields
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep()) {
      return;
    }

    const stepOrder: Step[] = ['personal', 'inscription', 'tutor', 'ailments'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setShowSubmitConfirm(true);
  };

  const performSubmit = async () => {
    if (previewMode) {
      setShowSuccessConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      const selectedProgram = availablePrograms.find((program) => program.id === formData.program);

      if (!formData.gender) {
        showToast('El género es obligatorio', 'error');
        setErrors((prev) => ({ ...prev, gender: 'El género es obligatorio' }));
        return;
      }

      // Crear estudiante con el body documentado por el API contract
      const studentData = {
        firstName: formData.firstName.trim(),
        paternalSurname: formData.paternalSurname.trim(),
        maternalSurname: formData.maternalSurname.trim(),
        birthDate: formData.birthDate || undefined,
        curp: undefined,
        enrollmentNumber: formData.enrollmentNumber.trim(),
        enrollmentDate: formData.enrollmentDate || formData.inscriptionDate || undefined,
        currentLevel: formData.currentLevel,
        currentGrade: formData.currentGrade,
        program: formData.program || undefined,
        shift: formData.shift,
        representative: formData.representative || undefined,
        gender: formData.gender,
        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
        status: 'active' as const,
      };

      const student = await studentsApi.create(studentData);

      // Cargar documentos si existen
      if (student && documentFiles.length > 0) {
        for (const file of documentFiles) {
          try {
            // Guardado secuencial 1 por 1 de metadatos de documento
            await documents.upload({
              studentId: student.id,
              documentType: 'pdf',
              fileName: file.name,
              fileUrl: URL.createObjectURL(file),
            });
          } catch (uploadErr) {
            console.error('Exception uploading document:', uploadErr);
          }
        }
      }

      // Asignar padecimientos
      if (student && selectedAilments.length > 0) {
        for (const ailmentId of selectedAilments) {
          await studentAilments.create({
            studentId: student.id,
            ailmentId,
            status: 'active',
            diagnosisDate: ailmentDetails[ailmentId]?.diagnosisDate || undefined,
            notes: ailmentDetails[ailmentId]?.notes || undefined,
          });
        }
      }

      // Crear inscripción
      if (student && formData.program) {
        await enrollments.create({
          studentId: student.id,
          enrollmentDate: formData.inscriptionDate,
          enrollmentType: formData.inscriptionType,
          programId: formData.program,
          program: selectedProgram?.name,
          representativeId: formData.representativeId || undefined,
          status: 'active',
        });
      }

      // Show success confirmation modal instead of calling onSuccess immediately
      setShowSuccessConfirm(true);
    } catch (error) {
      console.error('Error creating student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el alumno';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'personal', label: 'Info. Personal' },
    { id: 'inscription', label: 'Inscripción' },
    { id: 'tutor', label: 'Contacto de emergencia' },
    { id: 'ailments', label: 'Padecimientos' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        <StudentWizardSteps
          steps={steps}
          currentStep={currentStep}
          accent="green"
          onStepChange={(stepId) => setCurrentStep(stepId as Step)}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Agregar Alumno/a</h2>
              <p className="text-sm text-gray-500">
                {previewMode
                  ? 'Vista previa del diseño. No se enviarán datos ni se llamará a la API.'
                  : 'Por favor llena los campos solicitados'}
              </p>
            </div>
            <button
              onClick={handleClose}
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
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Juan"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.firstName
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    value={formData.paternalSurname}
                    onChange={(e) => updateField('paternalSurname', e.target.value)}
                    placeholder="García"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.paternalSurname
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  <FieldError message={errors.paternalSurname} />
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
                    placeholder="López"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Género
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.gender
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                  <FieldError message={errors.gender} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.birthDate
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  <FieldError message={errors.birthDate} />
                </div>
              </div>

            </div>
          )}

          {currentStep === 'inscription' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Matrícula *
                  </label>
                  <input
                    type="text"
                    value={formData.enrollmentNumber}
                    onChange={(e) => updateField('enrollmentNumber', e.target.value)}
                    placeholder="MAT-2024-001"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.enrollmentNumber
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  <FieldError message={errors.enrollmentNumber} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Folio
                  </label>
                  <input
                    type="text"
                    value={formData.folio}
                    onChange={(e) => updateField('folio', e.target.value)}
                    placeholder="Ej: FOLIO-2024-001"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se autogenerará si la dejas vacía</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nivel Actual *
                  </label>
                  <select
                    value={formData.currentLevel}
                    onChange={(e) => updateField('currentLevel', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.currentLevel
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                  <FieldError message={errors.currentLevel} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grado Actual *
                  </label>
                  <input
                    type="text"
                    value={formData.currentGrade}
                    onChange={(e) => updateField('currentGrade', e.target.value)}
                    placeholder="Principiante"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.currentGrade
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  <FieldError message={errors.currentGrade} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Turno *
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => updateField('shift', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.shift
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                  </select>
                  <FieldError message={errors.shift} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Programa
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => {
                      updateField('program', e.target.value);
                      updateField('inscriptionProgram', e.target.value);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar programa</option>
                    {availablePrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.description ? `${program.name} - ${program.description}` : program.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Opcional. Si no lo asignas ahora, puedes hacerlo después</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Inscripción
                  </label>
                  <input
                    type="date"
                    value={formData.inscriptionDate}
                    onChange={(e) => updateField('inscriptionDate', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Inscripción
                </label>
                <select
                  value={formData.inscriptionType}
                  onChange={(e) => updateField('inscriptionType', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {ENROLLMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Representante
                </label>
                <select
                  value={formData.representativeId}
                  onChange={(e) => handleRepresentativeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar representante...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.email && `(${user.email})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800">Información de Inscripción</p>
                <p className="text-xs text-blue-700">
                  Completa los datos de inscripción del alumno/a. El folio se autogenerará si lo dejas en blanco.
                </p>
              </div> */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Documentos del Alumno/a (Opcional)
                </label>
                <DragDropUpload 
                  onFilesSelected={setDocumentFiles}
                  accept=".pdf"
                  maxFileSizeMB={10}
                  maxFiles={20}
                  label="Arrastra PDFs aquí o selecciona archivos"
                />
              </div>

              {documentFiles.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-700 mb-2">
                    {documentFiles.length} archivo(s) seleccionado(s)
                  </p>
                  <ul className="space-y-1">
                    {documentFiles.map((file, index) => (
                      <li key={index} className="text-xs text-green-600 flex items-center space-x-1">
                        <FileText size={14} />
                        <span>{file.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {currentStep === 'tutor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del contacto de emergencia
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  placeholder="Nombre del contacto"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', formatPhoneMask(e.target.value))}
                  placeholder="555-123-4567"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.emergencyContactPhone
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                <FieldError message={errors.emergencyContactPhone} />
              </div>

              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Los datos del contacto de emergencia son opcionales. Continúa al siguiente paso para agregar padecimientos.
                </p>
              </div> */}
            </div>
          )}

          {currentStep === 'ailments' && (
            <div className="space-y-4">
              <AilmentsStepSection
                theme="green"
                headerHint="Captura la información médica en bloques claros y fáciles de revisar."
                medicationHint="Escribe un solo medicamento por padecimiento para mantener la captura ordenada."
                selectedAilments={selectedAilments}
                availableAilments={availableAilments}
                ailmentDetails={ailmentDetails}
                newAilmentForm={newAilmentForm}
                creatingAilment={creatingAilment}
                onCreateAilment={handleCreateAilment}
                onResetNewAilmentForm={() =>
                  setNewAilmentForm({
                    name: '',
                    description: '',
                    medication: '',
                    medicalDescription: '',
                    severity: 'moderate',
                    notes: '',
                    diagnosisDate: '',
                    assignmentNotes: '',
                  })
                }
                onChangeNewAilmentForm={setNewAilmentForm}
                onRemoveAilment={(ailmentId) => {
                  setSelectedAilments((prev) => prev.filter((id) => id !== ailmentId));
                  setAilmentDetails((prev) => {
                    const next = { ...prev };
                    delete next[ailmentId];
                    return next;
                  });
                }}
                onUpdateAilmentDetails={(ailmentId, diagnosisDate, notes) => {
                  setAilmentDetails((prev) => ({
                    ...prev,
                    [ailmentId]: {
                      diagnosisDate,
                      notes,
                    },
                  }));
                }}
              />

              {selectedAilments.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    {selectedAilments.length} padecimiento(s) asignado(s) a este alumno
                  </p>
                </div>
              )}

              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Usa esta lista como referencia rápida y completa solo los datos necesarios de cada padecimiento.
                </p>
              </div> */}
            </div>
          )}

          <StudentWizardActions
            accent="green"
            onCancel={handleClose}
            onNext={handleNextStep}
            onSubmit={handleSubmit}
            showNext={currentStep !== 'ailments'}
            nextDisabled={isLoading}
            submitDisabled={isLoading}
            submitLabel={isLoading ? 'Guardando...' : 'Guardar Alumno/a'}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSubmitConfirm}
        type="add"
        title="Confirmar alta de alumno"
        message="¿Deseas guardar este alumno con la información capturada?"
        onConfirm={() => {
          setShowSubmitConfirm(false);
          void performSubmit();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
        confirmText="Guardar alumno"
      />

      <ConfirmationModal
        isOpen={showSuccessConfirm}
        type="add"
        title="¡Alumno Agregado!"
        message="El alumno ha sido registrado exitosamente. ¿Deseas agregar otro alumno o terminar?"
        onConfirm={() => {
          setShowSuccessConfirm(false);
          const nextInitialData = {
            ...initialData,
            program: availablePrograms[0]?.id || '',
            inscriptionProgram: availablePrograms[0]?.id || '',
          };
          // Reset form for new student
          setCurrentStep('personal');
          setFormData(nextInitialData);
          setInitialFormData(nextInitialData);
          setSelectedAilments([]);
          setAilmentDetails({});
          setDocumentFiles([]);
        }}
        onCancel={() => {
          setShowSuccessConfirm(false);
          onSuccess();
        }}
        confirmText="Agregar Otro"
        cancelText="Terminar"
      />

      <ConfirmationModal
        isOpen={showUnsavedChangesConfirm}
        type="info"
        title="Cambios Sin Guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar sin guardar?"
        onConfirm={() => {
          setShowUnsavedChangesConfirm(false);
          onClose();
        }}
        onCancel={() => setShowUnsavedChangesConfirm(false)}
        confirmText="Cerrar Sin Guardar"
        cancelText="Continuar Editando"
      />
    </div>
  );
}
