import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { students as studentsApi, subjects as subjectsApi, users as usersApi, ailments as ailmentsApi, studentAilments, studentSubjects, enrollments, documents } from '../lib/api';
import { showToast } from './Toast';
import ConfirmationModal from './ConfirmationModal';
import DragDropUpload from './DragDropUpload';
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

interface ApiUser {
  id: string;
  firstName?: string;
  paternalSurname?: string;
  maternalSurname?: string | null;
  email: string;
  role: string;
}

interface ApiStudentSubject {
  id: string;
  subjectId?: string;
  subject?: { id: string };
}

interface EditStudentModalProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'personal' | 'academic' | 'inscription' | 'tutor' | 'ailments' | 'subjects';
type GenderValue = '' | 'femenino' | 'masculino' | 'otro' | 'prefiero_no_decirlo';

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
    program: 'Programa I',
    shift: 'Matutino',
    representative: 'Representante I',
    tutorName: '',
    tutorPhone: '',
    tutorEmail: '',
    tutorId: '',
    folio: '',
    inscriptionDate: '',
    inscriptionType: 'semanal',
    inscriptionProgram: 'Programa I',
    representativeId: '',
    enrollmentId: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [savedFormData, setSavedFormData] = useState(initialFormData);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [savedSelectedSubjects, setSavedSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
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
    severity: 'moderado' as 'leve' | 'moderado' | 'severo',
    notes: '',
  });
  const [creatingAilment, setCreatingAilment] = useState(false);

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(savedFormData) || 
           JSON.stringify(selectedSubjects) !== JSON.stringify(savedSelectedSubjects) ||
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

      if (student) {
        const formValues = {
          firstName: student.firstName || '',
          paternalSurname: student.paternalSurname || '',
          maternalSurname: student.maternalSurname || '',
          gender: '' as GenderValue,
          birthDate: student.birthDate || '',
          enrollmentNumber: student.enrollmentNumber || '',
          enrollmentDate: student.enrollmentDate || '',
          currentLevel: student.currentLevel || 'Principiante',
          currentGrade: student.currentGrade || 'Principiante',
          program: student.program || 'Programa I',
          shift: student.shift || 'Matutino',
          representative: student.representative || 'Representante I',
          tutorName: student.tutors && student.tutors.length > 0 ? student.tutors[0].name : '',
          tutorPhone: student.tutors && student.tutors.length > 0 ? student.tutors[0].phone || '' : '',
          tutorEmail: '',
          tutorId: '',
          folio: '',
          inscriptionDate: student.enrollmentDate || '',
          inscriptionType: 'semanal',
          inscriptionProgram: student.program || 'Programa I',
          representativeId: '',
          enrollmentId: '',
        };
        setFormData(formValues);
        setSavedFormData(formValues);
      }

      // Fetch subjects
      const subjectsResponse = await subjectsApi.list();
      const subjectsList = Array.isArray(subjectsResponse)
        ? subjectsResponse
        : Array.isArray((subjectsResponse as { data?: Subject[] }).data)
          ? (subjectsResponse as { data: Subject[] }).data
          : [];
      setAvailableSubjects(subjectsList as Subject[]);

      setSelectedSubjects(
        (student.subjects || [])
          .map((item) => item.subject.id)
          .filter((id): id is string => Boolean(id))
      );

      const subjectIds = (student.subjects || [])
        .map((item) => item.subject.id)
        .filter((id): id is string => Boolean(id));
      setSavedSelectedSubjects(subjectIds);

      // Fetch all ailments
      const ailmentsResponse = await ailmentsApi.list();
      const ailmentsList = Array.isArray(ailmentsResponse)
        ? ailmentsResponse
        : Array.isArray((ailmentsResponse as { data?: Ailment[] }).data)
          ? (ailmentsResponse as { data: Ailment[] }).data
          : [];
      setAvailableAilments(ailmentsList as Ailment[]);

      setSelectedAilments((student.ailments || []).map((a) => a.ailmentId));
      const details: Record<string, { diagnosisDate: string; notes: string }> = {};
      (student.ailments || []).forEach((a) => {
        details[a.ailmentId] = {
          diagnosisDate: a.diagnosisDate || '',
          notes: a.notes || '',
        };
      });
      setAilmentDetails(details);

      setSavedSelectedAilments((student.ailments || []).map((a) => a.ailmentId));
      setSavedAilmentDetails(details);

      // Fetch enrollment/inscription
      const enrollmentsResponse = await enrollments.list(studentId);
      if (enrollmentsResponse.data && enrollmentsResponse.data.length > 0) {
        const enrollment = enrollmentsResponse.data[0];
        setFormData(prev => ({
          ...prev,
          inscriptionDate: enrollment.enrollmentDate,
          inscriptionProgram: enrollment.program || 'Programa I',
          enrollmentId: enrollment.id,
        }));
      }

      // Fetch all users/representatives
      const usersResponse = await usersApi.list();
      setAvailableUsers(usersResponse.map((u: ApiUser) => ({
        id: u.id,
        name: [u.firstName, u.paternalSurname, u.maternalSurname].filter(Boolean).join(' '),
        email: u.email,
        role: u.role,
      })));
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
        setAvailableAilments(prev => [...prev, newAilment as Ailment]);
        setSelectedAilments(prev => [...prev, newAilment.id]);
        setNewAilmentForm({ name: '', description: '', medication: '', medicalDescription: '', severity: 'moderado', notes: '' });
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
      // Update student
      const studentData = {
        firstName: formData.firstName.trim(),
        paternalSurname: formData.paternalSurname.trim(),
        maternalSurname: formData.maternalSurname.trim() || null,
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

      await studentsApi.update(studentId, studentData);

      // Update subjects - delete existing and create new
      // First get current student subjects to delete them
      const currentStudentSubjects = await studentSubjects.list(studentId);
      for (const ss of currentStudentSubjects as ApiStudentSubject[]) {
        await studentSubjects.delete(ss.id);
      }

      // Create new student subjects
      if (selectedSubjects.length > 0) {
        for (const subjectId of selectedSubjects) {
          await studentSubjects.create({
            studentId,
            subjectId,
          });
        }
      }

      // Update ailments - delete existing and create new
      // First get current student ailments to delete them
      const currentStudentAilments = await studentAilments.list(studentId);
      for (const sa of currentStudentAilments.data) {
        await studentAilments.delete(sa.id);
      }

      // Create new student ailments
      if (selectedAilments.length > 0) {
        for (const ailmentId of selectedAilments) {
          await studentAilments.create({
            studentId,
            ailmentId,
            notes: ailmentDetails[ailmentId]?.notes || undefined,
          });
        }
      }

      // Update or create enrollment/inscription
      if (formData.enrollmentId) {
        // Update existing enrollment
        await enrollments.update(formData.enrollmentId, {
          studentId,
          program: formData.inscriptionProgram,
          status: 'activo',
          enrollmentDate: formData.inscriptionDate,
        });
      } else {
        // Create new enrollment
        await enrollments.create({
          studentId,
          program: formData.inscriptionProgram,
          status: 'activo',
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        : 'border-gray-300 focus:ring-blue-500'
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Nombre del Tutor
                </label>
                <input
                  type="text"
                  value={formData.tutorName}
                  onChange={(e) => updateField('tutorName', e.target.value)}
                  placeholder="Nombre del tutor"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      : 'border-gray-300 focus:ring-blue-500'
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
                      : 'border-gray-300 focus:ring-blue-500'
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
                    severity: 'moderado',
                    notes: '',
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
                          className="w-4 h-4 text-blue-500 rounded cursor-pointer"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    {selectedSubjects.length} materia(s) seleccionada(s)
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
            showNext={currentStep !== 'subjects'}
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
