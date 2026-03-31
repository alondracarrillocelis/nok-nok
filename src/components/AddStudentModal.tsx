import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { students as studentsApi, subjects as subjectsApi, users as usersApi, ailments as ailmentsApi, studentAilments, studentSubjects, enrollments, documents } from '../lib/api';
import { showToast } from './Toast';
import DragDropUpload from './DragDropUpload';
import ConfirmationModal from './ConfirmationModal';
import AilmentsStepSection from './AilmentsStepSection';
import FieldError from './FieldError';
import StudentWizardActions from './StudentWizardActions';
import StudentWizardSteps from './StudentWizardSteps';
import { formatPhoneMask, isValidEmail, isValidPhone } from '../lib/validators';

interface Subject {
  id: string;
  name: string;
  code: string;
}

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

interface ApiSubject {
  id: string;
  name: string;
  code: string;
  status?: string;
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
}

type Step = 'personal' | 'academic' | 'inscription' | 'tutor' | 'ailments' | 'subjects';
type GenderValue = '' | 'femenino' | 'masculino' | 'otro' | 'prefiero_no_decirlo';

export default function AddStudentModal({ onClose, onSuccess }: AddStudentModalProps) {
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
    program: 'Programa I',
    shift: 'Matutino',
    representative: 'Representante I',
    tutorName: '',
    tutorPhone: '',
    tutorEmail: '',
    folio: '',
    inscriptionDate: new Date().toISOString().split('T')[0],
    inscriptionType: 'semanal',
    inscriptionProgram: 'Programa I',
    representativeId: '',
  };
  const [formData, setFormData] = useState(initialData);
  const [initialFormData, setInitialFormData] = useState(initialData);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
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
    severity: 'moderado' as 'leve' | 'moderado' | 'severo',
    notes: '',
  });
  const [creatingAilment, setCreatingAilment] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData) || selectedSubjects.length > 0 || selectedAilments.length > 0 || documentFiles.length > 0;
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchAilments();
    fetchUsers();
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

  const fetchSubjects = async () => {
    try {
      const response = await subjectsApi.list();
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as { data?: ApiSubject[] }).data)
          ? (response as { data: ApiSubject[] }).data
          : [];
      setAvailableSubjects(
        list
          .filter((subject) => (subject.status ? subject.status === 'activo' : true))
          .map((subject) => ({ id: subject.id, name: subject.name, code: subject.code }))
      );
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setAvailableSubjects([]);
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

  const handleCreateAilment = async () => {
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
        notes: newAilmentForm.notes.trim(),
      });

      if (newAilment) {
        // Add new ailment to the list
        setAvailableAilments(prev => [...prev, newAilment as Ailment]);
        // Auto-select the new ailment
        setSelectedAilments(prev => [...prev, newAilment.id]);
        // Reset form
        setNewAilmentForm({
          name: '',
          description: '',
          medication: '',
          medicalDescription: '',
          severity: 'moderado',
          notes: '',
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

  const validateAcademicStep = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (): boolean => {
    if (currentStep === 'personal') {
      return validatePersonalStep();
    } else if (currentStep === 'academic') {
      return validateAcademicStep();
    } else if (currentStep === 'tutor') {
      const newErrors: Record<string, string> = {};

      if (formData.tutorPhone.trim() && !isValidPhone(formData.tutorPhone)) {
        newErrors.tutorPhone = 'El teléfono debe tener entre 10 y 15 dígitos';
      }
      if (formData.tutorEmail.trim() && !isValidEmail(formData.tutorEmail)) {
        newErrors.tutorEmail = 'Ingresa un correo electrónico válido';
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

    const stepOrder: Step[] = ['personal', 'academic', 'inscription', 'tutor', 'ailments', 'subjects'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setShowSubmitConfirm(true);
  };

  const performSubmit = async () => {
    setIsLoading(true);
    try {
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
        program: formData.program,
        shift: formData.shift,
        representative: formData.representative,
        status: 'activo' as const,
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

      // Asignar materias
      if (student && selectedSubjects.length > 0) {
        for (const subjectId of selectedSubjects) {
          await studentSubjects.create({
            studentId: student.id,
            subjectId,
          });
        }
      }

      // Asignar padecimientos
      if (student && selectedAilments.length > 0) {
        for (const ailmentId of selectedAilments) {
          await studentAilments.create({
            studentId: student.id,
            ailmentId,
            notes: ailmentDetails[ailmentId]?.notes || undefined,
          });
        }
      }

      // Crear inscripción
      if (student) {
        await enrollments.create({
          studentId: student.id,
          enrollmentDate: formData.inscriptionDate,
          enrollmentType: formData.inscriptionType as 'semanal' | 'trimestral' | 'anual',
          program: formData.inscriptionProgram,
          representativeId: formData.representativeId || undefined,
          status: 'activo',
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
    { id: 'academic', label: 'Info. Académica' },
    { id: 'inscription', label: 'Inscripción' },
    { id: 'tutor', label: 'Tutor' },
    { id: 'ailments', label: 'Padecimientos' },
    { id: 'subjects', label: 'Materias' },
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
              <p className="text-sm text-gray-500">Por favor llena los campos solicitados</p>
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
                  </select>
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
              </div>
            </div>
          )}

          {currentStep === 'academic' && (
            <div className="space-y-4">
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
                    Programa
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => updateField('program', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Programa I">Programa I</option>
                    <option value="Programa II">Programa II</option>
                  </select>
                </div>
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
                  <option value="Representante I">Representante I</option>
                  <option value="Representante II">Representante II</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 'inscription' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de Inscripción
                  </label>
                  <select
                    value={formData.inscriptionType}
                    onChange={(e) => updateField('inscriptionType', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Programa
                  </label>
                  <select
                    value={formData.inscriptionProgram}
                    onChange={(e) => updateField('inscriptionProgram', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Programa I">Programa I</option>
                    <option value="Programa II">Programa II</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Representante
                </label>
                <select
                  value={formData.representativeId}
                  onChange={(e) => updateField('representativeId', e.target.value)}
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
                  Nombre del Tutor
                </label>
                <input
                  type="text"
                  value={formData.tutorName}
                  onChange={(e) => updateField('tutorName', e.target.value)}
                  placeholder="Nombre del tutor"
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
                  onChange={(e) => updateField('tutorPhone', formatPhoneMask(e.target.value))}
                  placeholder="555-123-4567"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.tutorPhone
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                <FieldError message={errors.tutorPhone} />
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
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.tutorEmail
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                <FieldError message={errors.tutorEmail} />
              </div>

              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Los datos del tutor son opcionales. Continúa al siguiente paso para agregar padecimientos.
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
                    severity: 'moderado',
                    notes: '',
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

          {currentStep === 'subjects' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Asignar Materias
                </label>
                  {availableSubjects.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-800">
                      No hay materias disponibles. Por favor, crea materias primero.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {availableSubjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="w-4 h-4 text-green-500 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">{subject.name}</p>
                          <p className="text-xs text-gray-500">{subject.code}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedSubjects.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    {selectedSubjects.length} materia(s) seleccionada(s)
                  </p>
                </div>
              )}
            </div>
          )}

          <StudentWizardActions
            accent="green"
            onCancel={handleClose}
            onNext={handleNextStep}
            onSubmit={handleSubmit}
            showNext={currentStep !== 'subjects'}
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
          // Reset form for new student
          setCurrentStep('personal');
          setFormData(initialData);
          setInitialFormData(initialData);
          setSelectedSubjects([]);
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
