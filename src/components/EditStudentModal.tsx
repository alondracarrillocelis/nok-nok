import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { students as studentsApi, programs as programsApi, users as usersApi, ailments as ailmentsApi, studentAilments, enrollments, documents } from '../lib/api';
import type { AilmentSeverity } from '../lib/api';
import { ENROLLMENT_TYPE_OPTIONS, EnrollmentType, getAvailableProgramOptions, ProgramOption, sortEnrollmentsByDate } from '../lib/academy';
import { showToast } from './Toast';
import ConfirmationModal from './ConfirmationModal';
import DragDropUpload from './DragDropUpload';
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

interface EditStudentModalProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'personal' | 'inscription' | 'tutor' | 'ailments';
type GenderValue = '' | 'male' | 'female' | 'other';

export default function EditStudentModal({ studentId, onClose, onSuccess }: EditStudentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const initialFormData = {
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
    inscriptionDate: '',
    inscriptionType: 'semanal' as EnrollmentType,
    inscriptionProgram: '',
    representativeId: '',
    enrollmentId: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [savedFormData, setSavedFormData] = useState(initialFormData);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<ProgramOption[]>([]);
  const [selectedAilments, setSelectedAilments] = useState<string[]>([]);
  const [savedSelectedAilments, setSavedSelectedAilments] = useState<string[]>([]);
  const [availableAilments, setAvailableAilments] = useState<Ailment[]>([]);
  const [ailmentDetails, setAilmentDetails] = useState<Record<string, { diagnosisDate: string; notes: string }>>({});
  const [savedAilmentDetails, setSavedAilmentDetails] = useState<Record<string, { diagnosisDate: string; notes: string }>>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const handleRepresentativeChange = (userId: string) => {
    const selectedUser = availableUsers.find((user) => user.id === userId);
    setFormData((prev) => ({
      ...prev,
      representativeId: userId,
      representative: selectedUser?.name || '',
    }));
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(savedFormData) || 
           JSON.stringify(selectedAilments) !== JSON.stringify(savedSelectedAilments) ||
           JSON.stringify(ailmentDetails) !== JSON.stringify(savedAilmentDetails) ||
           documentFiles.length > 0;
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      // Fetch student
      const student = await studentsApi.getById(studentId);
      let latestEnrollmentRepresentativeId = '';

      if (student) {
        const formValues = {
          firstName: student.firstName || '',
          paternalSurname: student.paternalSurname || '',
          maternalSurname: student.maternalSurname || '',
          gender: student.gender || '' as GenderValue,
          birthDate: student.birthDate || '',
          enrollmentNumber: student.enrollmentNumber || '',
          enrollmentDate: student.enrollmentDate || '',
          currentLevel: student.currentLevel || 'Principiante',
          currentGrade: student.currentGrade || 'Principiante',
          program: student.program || '',
          shift: student.shift || 'Matutino',
          representative: student.representative || '',
          emergencyContactName: student.emergencyContactName || '',
          emergencyContactPhone: student.emergencyContactPhone || '',
          folio: '',
          inscriptionDate: student.enrollmentDate || '',
          inscriptionType: 'semanal' as EnrollmentType,
          inscriptionProgram: student.program || '',
          representativeId: '',
          enrollmentId: '',
        };
        setFormData(formValues);
        setSavedFormData(formValues);
      }

      const programsResponse = await programsApi.list();
      const nextPrograms = getAvailableProgramOptions(programsResponse, student.program || '');
      setAvailablePrograms(nextPrograms);
      if (student && !student.program && nextPrograms.length > 0) {
        setFormData((prev) => ({
          ...prev,
          program: prev.program || prev.inscriptionProgram || nextPrograms[0].id,
          inscriptionProgram: prev.inscriptionProgram || prev.program || nextPrograms[0].id,
        }));
        setSavedFormData((prev) => ({
          ...prev,
          program: prev.program || prev.inscriptionProgram || nextPrograms[0].id,
          inscriptionProgram: prev.inscriptionProgram || prev.program || nextPrograms[0].id,
        }));
      }

      // Fetch all ailments
      const ailmentsResponse = await ailmentsApi.list();
      const ailmentsList = Array.isArray(ailmentsResponse)
        ? ailmentsResponse
        : Array.isArray((ailmentsResponse as { data?: Ailment[] }).data)
          ? (ailmentsResponse as { data: Ailment[] }).data
          : [];
      setAvailableAilments(ailmentsList as Ailment[]);

      const studentAilmentIds = (student.ailments || [])
        .map((ailment) => ailment.ailmentId || ailment.ailment?.id || '')
        .filter(Boolean);

      setSelectedAilments(studentAilmentIds);
      const details: Record<string, { diagnosisDate: string; notes: string }> = {};
      (student.ailments || []).forEach((ailment) => {
        const ailmentId = ailment.ailmentId || ailment.ailment?.id || '';

        if (!ailmentId) {
          return;
        }

        details[ailmentId] = {
          diagnosisDate: ailment.diagnosisDate || '',
          notes: ailment.notes || '',
        };
      });
      setAilmentDetails(details);

      setSavedSelectedAilments(studentAilmentIds);
      setSavedAilmentDetails(details);

      // Fetch enrollment/inscription
      const enrollmentsResponse = await enrollments.list(studentId);
      if (enrollmentsResponse.data && enrollmentsResponse.data.length > 0) {
        const enrollment = sortEnrollmentsByDate(enrollmentsResponse.data)[0];
        const selectedProgramId = enrollment.programId || enrollment.program || '';
        latestEnrollmentRepresentativeId = enrollment.representativeId || '';
        setFormData(prev => ({
          ...prev,
          inscriptionDate: enrollment.enrollmentDate,
          inscriptionType: (enrollment.enrollmentType as EnrollmentType) || 'semanal',
          program: selectedProgramId || prev.program,
          inscriptionProgram: selectedProgramId || prev.program,
          representativeId: enrollment.representativeId || prev.representativeId,
          enrollmentId: enrollment.id,
        }));
        setSavedFormData(prev => ({
          ...prev,
          inscriptionDate: enrollment.enrollmentDate,
          inscriptionType: (enrollment.enrollmentType as EnrollmentType) || 'semanal',
          program: selectedProgramId || prev.program,
          inscriptionProgram: selectedProgramId || prev.program,
          representativeId: enrollment.representativeId || prev.representativeId,
          enrollmentId: enrollment.id,
        }));
      }

      // Fetch all users/representatives
      const usersResponse = await usersApi.list();
      const mappedUsers = usersResponse.map((u: ApiUser) => ({
        id: u.id,
        name: [u.firstName, u.paternalSurname, u.maternalSurname].filter(Boolean).join(' '),
        email: u.email,
        role: u.role,
      }));
      setAvailableUsers(mappedUsers);

      const matchedRepresentative = latestEnrollmentRepresentativeId
        ? mappedUsers.find((user) => user.id === latestEnrollmentRepresentativeId)
        : mappedUsers.find((user) => user.name === student.representative);

      if (matchedRepresentative) {
        setFormData((prev) => ({
          ...prev,
          representativeId: matchedRepresentative.id,
          representative: matchedRepresentative.name,
        }));
        setSavedFormData((prev) => ({
          ...prev,
          representativeId: matchedRepresentative.id,
          representative: matchedRepresentative.name,
        }));
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      showToast('Error al cargar datos del alumno', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!formData.program) {
      newErrors.program = 'El programa es obligatorio';
    }

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
        status: 'active',
        notes: newAilmentForm.notes.trim(),
      });

      if (newAilment) {
        setAvailableAilments(prev => [...prev, newAilment as Ailment]);
        setSelectedAilments(prev => [...prev, newAilment.id]);
        setAilmentDetails((prev) => ({
          ...prev,
          [newAilment.id]: {
            diagnosisDate: newAilmentForm.diagnosisDate,
            notes: newAilmentForm.assignmentNotes.trim(),
          },
        }));
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

  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    // show confirmation modal first
    setShowConfirm(true);
  };

  const performSubmit = async () => {
    setConfirmLoading(true);
    setIsSaving(true);
    try {
      const selectedProgram = availablePrograms.find((program) => program.id === formData.program);

      if (!formData.gender) {
        showToast('El género es obligatorio', 'error');
        setErrors((prev) => ({ ...prev, gender: 'El género es obligatorio' }));
        return;
      }

      // Update student
      const studentData = {
        firstName: formData.firstName.trim(),
        paternalSurname: formData.paternalSurname.trim(),
        maternalSurname: formData.maternalSurname.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        curp: undefined,
        enrollmentNumber: formData.enrollmentNumber.trim(),
        enrollmentDate: formData.enrollmentDate || formData.inscriptionDate || undefined,
        currentLevel: formData.currentLevel,
        currentGrade: formData.currentGrade,
        shift: formData.shift,
        representative: formData.representative || undefined,
        gender: formData.gender,
        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
        status: 'active' as const,
      };

      await studentsApi.update(studentId, studentData);

      // Update ailments - delete existing and create new
      // First get current student ailments to delete them
      const currentStudentAilments = await studentAilments.list(studentId);
      const currentAilments = Array.isArray(currentStudentAilments.data) ? currentStudentAilments.data : [];
      for (const sa of currentAilments) {
        await studentAilments.delete(sa.id);
      }

      // Create new student ailments
      if (selectedAilments.length > 0) {
        const validSelectedAilments = selectedAilments.filter(Boolean);

        for (const ailmentId of validSelectedAilments) {
          await studentAilments.create({
            studentId,
            ailmentId,
            status: 'active',
            diagnosisDate: ailmentDetails[ailmentId]?.diagnosisDate || undefined,
            notes: ailmentDetails[ailmentId]?.notes || undefined,
          });
        }
      }

      // Update or create enrollment/inscription
      if (formData.enrollmentId) {
        // Update existing enrollment
        await enrollments.update(formData.enrollmentId, {
          studentId,
          programId: formData.program,
          program: selectedProgram?.name,
          enrollmentType: formData.inscriptionType,
          representativeId: formData.representativeId || undefined,
          status: 'active',
          enrollmentDate: formData.inscriptionDate,
        });
      } else {
        // Create new enrollment
        await enrollments.create({
          studentId,
          programId: formData.program,
          program: selectedProgram?.name,
          enrollmentType: formData.inscriptionType,
          representativeId: formData.representativeId || undefined,
          status: 'active',
          enrollmentDate: formData.inscriptionDate,
        });
      }

      // Guardado secuencial de metadatos de documentos (1 por 1)
      if (documentFiles.length > 0) {
        for (const file of documentFiles) {
          await documents.upload({
            studentId,
            documentType: 'pdf',
            fileName: file.name,
            fileUrl: URL.createObjectURL(file),
          });
        }
      }

      showToast('Alumno/a actualizado exitosamente', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error updating student:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el alumno';
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
      setConfirmLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Cargando datos del alumno...</p>
          </div>
        </div>
      </div>
    );
  }

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
          accent="blue"
          onStepChange={(stepId) => setCurrentStep(stepId as Step)}
        />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editar Alumno/a</h2>
              <p className="text-sm text-gray-500">Actualiza los datos del estudiante</p>
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                      errors.program
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Seleccionar programa</option>
                    {availablePrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.description ? `${program.name} - ${program.description}` : program.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.program} />
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar representante...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.email && `(${user.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">Información de Inscripción</p>
                <p className="text-xs text-blue-700">
                  Actualiza los datos de inscripción del alumno/a. El folio se autogenerará si lo dejas en blanco.
                </p>
              </div>

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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">
                    {documentFiles.length} archivo(s) listo(s) para guardar
                  </p>
                  <ul className="space-y-1">
                    {documentFiles.map((file, index) => (
                      <li key={index} className="text-xs text-blue-600 flex items-center space-x-1">
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      : 'border-gray-300 focus:ring-blue-500'
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
                theme="blue"
                headerHint="Mantén los medicamentos y notas separados para una lectura más clara."
                medicationHint="Usa un medicamento principal por registro para que el historial sea claro."
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    {selectedAilments.length} padecimiento(s) asignado(s) a este alumno
                  </p>
                </div>
              )}

             
            </div>
          )}

          <StudentWizardActions
            accent="blue"
            onCancel={handleClose}
            onNext={handleNextStep}
            onSubmit={handleSubmit}
            showNext={currentStep !== 'ailments'}
            cancelDisabled={isSaving || showConfirm}
            nextDisabled={isSaving}
            submitDisabled={isSaving || showConfirm}
            submitLabel={isSaving ? 'Guardando...' : 'Guardar Cambios'}
          />
        <ConfirmationModal
      isOpen={showConfirm}
      type="edit"
      title="Confirmar edición"
      message="¿Deseas guardar los cambios realizados al alumno?"
      onConfirm={performSubmit}
      onCancel={() => setShowConfirm(false)}
      isLoading={confirmLoading}
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
      </div>
    </div>
  );
}
