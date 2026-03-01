import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './Toast';
import ConfirmationModal from './ConfirmationModal';

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
  severity: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditStudentModalProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'personal' | 'academic' | 'inscription' | 'tutor' | 'ailments' | 'subjects';

export default function EditStudentModal({ studentId, onClose, onSuccess }: EditStudentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [formData, setFormData] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
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
    // Inscription fields
    folio: '',
    inscriptionDate: '',
    inscriptionType: 'semanal',
    inscriptionProgram: 'Programa I',
    representativeId: '',
    enrollmentId: '',
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedAilments, setSelectedAilments] = useState<string[]>([]);
  const [ailments, setAilments] = useState<Ailment[]>([]);
  const [ailmentDetails, setAilmentDetails] = useState<Record<string, { diagnosisDate: string; notes: string }>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [newAilmentForm, setNewAilmentForm] = useState({
    name: '',
    description: '',
    medication: '',
    severity: 'moderado',
  });
  const [creatingAilment, setCreatingAilment] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      // Fetch student
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (student) {
        setFormData({
          firstName: student.first_name || '',
          paternalSurname: student.paternal_surname || '',
          maternalSurname: student.maternal_surname || '',
          birthDate: student.birth_date || '',
          enrollmentNumber: student.enrollment_number || '',
          enrollmentDate: student.enrollment_date || '',
          currentLevel: student.current_level || 'Principiante',
          currentGrade: student.current_grade || 'Principiante',
          program: student.program || 'Programa I',
          shift: student.shift || 'Matutino',
          representative: student.representative || 'Representante I',
          tutorName: '',
          tutorPhone: '',
          tutorEmail: '',
          tutorId: '',
        });
      }

      // Fetch tutor
      const { data: tutors } = await supabase
        .from('tutors')
        .select('*')
        .eq('student_id', studentId);

      if (tutors && tutors.length > 0) {
        const tutor = tutors[0];
        setFormData(prev => ({
          ...prev,
          tutorName: tutor.name || '',
          tutorPhone: tutor.phone || '',
          tutorEmail: tutor.email || '',
          tutorId: tutor.id || '',
        }));
      }

      // Fetch subjects
      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('status', 'activo')
        .order('name');

      if (allSubjects) {
        setSubjects(allSubjects);
      }

      // Fetch student subjects
      const { data: studentSubjects } = await supabase
        .from('student_subjects')
        .select('subject_id')
        .eq('student_id', studentId);

      if (studentSubjects) {
        setSelectedSubjects(studentSubjects.map(s => s.subject_id));
      }

      // Fetch all ailments
      const { data: allAilments } = await supabase
        .from('ailments')
        .select('id, name, description, medication, severity')
        .order('name');

      if (allAilments) {
        setAilments(allAilments);
      }

      // Fetch student ailments
      const { data: studentAilments } = await supabase
        .from('student_ailments')
        .select('ailment_id, diagnosis_date, notes')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (studentAilments) {
        setSelectedAilments(studentAilments.map(a => a.ailment_id));
        const details: Record<string, { diagnosisDate: string; notes: string }> = {};
        studentAilments.forEach(a => {
          details[a.ailment_id] = {
            diagnosisDate: a.diagnosis_date || '',
            notes: a.notes || '',
          };
        });
        setAilmentDetails(details);
      }

      // Fetch enrollment/inscription
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (enrollment) {
        setFormData(prev => ({
          ...prev,
          folio: enrollment.folio || '',
          inscriptionDate: enrollment.enrollment_date || '',
          inscriptionType: enrollment.enrollment_type || 'semanal',
          inscriptionProgram: enrollment.program || 'Programa I',
          representativeId: enrollment.representative_id || '',
          enrollmentId: enrollment.id || '',
        }));
      }

      // Fetch all users/representatives
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, first_name, paternal_surname, maternal_surname, email, role')
        .eq('status', 'activo')
        .order('first_name');

      if (allUsers) {
        setUsers(allUsers.map((u: { id: string; first_name: string; paternal_surname: string; maternal_surname?: string; email: string; role: string }) => ({
          id: u.id,
          name: [u.first_name, u.paternal_surname, u.maternal_surname].filter(Boolean).join(' '),
          email: u.email,
          role: u.role,
        })));
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

  const toggleAilment = (ailmentId: string) => {
    setSelectedAilments(prev =>
      prev.includes(ailmentId)
        ? prev.filter(id => id !== ailmentId)
        : [...prev, ailmentId]
    );
  };

  const handleCreateAilment = async () => {
    if (!newAilmentForm.name.trim()) {
      showToast('El nombre del padecimiento es obligatorio', 'error');
      return;
    }
    setCreatingAilment(true);
    try {
      const { data, error } = await supabase
        .from('ailments')
        .insert([{
          name: newAilmentForm.name,
          description: newAilmentForm.description,
          medication: newAilmentForm.medication,
          severity: newAilmentForm.severity,
        }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setAilments(prev => [...prev, data]);
        setSelectedAilments(prev => [...prev, data.id]);
        setNewAilmentForm({ name: '', description: '', medication: '', severity: 'moderado' });
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
      await supabase
        .from('students')
        .update({
          first_name: formData.firstName,
          paternal_surname: formData.paternalSurname,
          maternal_surname: formData.maternalSurname,
          birth_date: formData.birthDate || null,
          enrollment_number: formData.enrollmentNumber,
          enrollment_date: formData.enrollmentDate,
          current_level: formData.currentLevel,
          current_grade: formData.currentGrade,
          program: formData.program,
          shift: formData.shift,
          representative: formData.representative,
        })
        .eq('id', studentId);

      // Update or create tutor
      if (formData.tutorName) {
        if (formData.tutorId) {
          // Update existing tutor
          await supabase
            .from('tutors')
            .update({
              name: formData.tutorName,
              phone: formData.tutorPhone,
              email: formData.tutorEmail,
            })
            .eq('id', formData.tutorId);
        } else {
          // Create new tutor
          await supabase.from('tutors').insert([
            {
              student_id: studentId,
              name: formData.tutorName,
              phone: formData.tutorPhone,
              email: formData.tutorEmail,
            },
          ]);
        }
      } else if (formData.tutorId) {
        // Delete tutor if name is empty
        await supabase.from('tutors').delete().eq('id', formData.tutorId);
      }

      // Update subjects
      await supabase
        .from('student_subjects')
        .delete()
        .eq('student_id', studentId);

      if (selectedSubjects.length > 0) {
        const studentSubjects = selectedSubjects.map(subjectId => ({
          student_id: studentId,
          subject_id: subjectId,
          status: 'active',
        }));

        await supabase.from('student_subjects').insert(studentSubjects);
      }

      // Update ailments
      await supabase
        .from('student_ailments')
        .update({ status: 'inactive' })
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (selectedAilments.length > 0) {
        const studentAilments = selectedAilments.map(ailmentId => ({
          student_id: studentId,
          ailment_id: ailmentId,
          status: 'active',
          diagnosis_date: ailmentDetails[ailmentId]?.diagnosisDate || null,
          notes: ailmentDetails[ailmentId]?.notes || null,
        }));

        await supabase.from('student_ailments').upsert(studentAilments, {
          onConflict: 'student_id,ailment_id',
        });
      }

      // Update or create enrollment/inscription
      if (formData.enrollmentId) {
        // Update existing enrollment
        await supabase.from('enrollments').update({
          folio: formData.folio,
          enrollment_date: formData.inscriptionDate,
          enrollment_type: formData.inscriptionType,
          program: formData.inscriptionProgram,
          representative_id: formData.representativeId || null,
        }).eq('id', formData.enrollmentId);
      } else {
        // Create new enrollment
        await supabase.from('enrollments').insert([{
          student_id: studentId,
          folio: formData.folio || `FOLIO-${studentId.slice(0, 8).toUpperCase()}`,
          enrollment_date: formData.inscriptionDate,
          enrollment_type: formData.inscriptionType,
          program: formData.inscriptionProgram,
          representative_id: formData.representativeId || null,
          status: 'activo',
        }]);
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

  const renderErrorField = (fieldName: string) => {
    return errors[fieldName] ? (
      <div className="mt-1 flex items-center space-x-1 text-red-500">
        <AlertCircle size={16} />
        <span className="text-xs font-medium">{errors[fieldName]}</span>
      </div>
    ) : null;
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
        <div className="w-48 bg-gray-50 p-6 space-y-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as Step)}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === step.id
                  ? 'bg-blue-500 text-white'
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
              <h2 className="text-2xl font-bold text-gray-900">Editar Alumno/a</h2>
              <p className="text-sm text-gray-500">Actualiza los datos del estudiante</p>
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
                  {renderErrorField('firstName')}
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
                  {renderErrorField('paternalSurname')}
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
                  {renderErrorField('enrollmentNumber')}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Inscripción
                  </label>
                  <input
                    type="date"
                    value={formData.enrollmentDate}
                    onChange={(e) => updateField('enrollmentDate', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  {renderErrorField('currentLevel')}
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
                  {renderErrorField('shift')}
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
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.email && `(${user.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">📋 Información de Inscripción</p>
                <p className="text-xs text-blue-700">
                  Actualiza los datos de inscripción del alumno/a. El folio se autogenerará si lo dejas en blanco.
                </p>
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
                  onChange={(e) => updateField('tutorPhone', e.target.value)}
                  placeholder="555-123-4567"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  📝 Los datos del tutor son opcionales. Continúa al siguiente paso para agregar padecimientos.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'ailments' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Padecimientos del alumno (Condiciones de Salud)
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Los padecimientos que agregues quedarán asignados a este alumno.
                </p>

                {/* Formulario para agregar padecimiento - siempre visible */}
                <div className="space-y-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700">Agregar padecimiento para este alumno</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del padecimiento *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Asma, Alergia..."
                        value={newAilmentForm.name}
                        onChange={(e) => setNewAilmentForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Severidad
                      </label>
                      <select
                        value={newAilmentForm.severity}
                        onChange={(e) => setNewAilmentForm(prev => ({ ...prev, severity: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="leve">Leve</option>
                        <option value="moderado">Moderado</option>
                        <option value="severo">Severo</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Descripción (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Descripción general"
                        value={newAilmentForm.description}
                        onChange={(e) => setNewAilmentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Medicamento (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Medicamento recomendado"
                        value={newAilmentForm.medication}
                        onChange={(e) => setNewAilmentForm(prev => ({ ...prev, medication: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateAilment}
                      disabled={creatingAilment}
                      className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingAilment ? 'Creando...' : 'Crear y asignar al alumno'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAilmentForm({ name: '', description: '', medication: '', severity: 'moderado' })}
                      className="px-6 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Lista de padecimientos de este alumno */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Padecimientos de este alumno</p>
                  {ailments.filter(a => selectedAilments.includes(a.id)).length === 0 ? (
                    <p className="text-sm text-gray-500">Los padecimientos que agregues aparecerán aquí.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {ailments.filter(a => selectedAilments.includes(a.id)).map((ailment) => (
                        <div
                          key={ailment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{ailment.name}</p>
                              {ailment.description && (
                                <p className="text-sm text-gray-600 mb-1">{ailment.description}</p>
                              )}
                              {ailment.medication && (
                                <p className="text-xs text-blue-600 mb-2">💊 Medicamento: {ailment.medication}</p>
                              )}
                              {ailment.severity && (
                                <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
                                  ailment.severity === 'severo' ? 'bg-red-100 text-red-700' :
                                  ailment.severity === 'moderado' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  Severidad: {ailment.severity}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedAilments(prev => prev.filter(id => id !== ailment.id))}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Quitar padecimiento"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <div className="space-y-3 pt-3 border-t border-gray-200">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Fecha de Diagnóstico
                              </label>
                              <input
                                type="date"
                                value={ailmentDetails[ailment.id]?.diagnosisDate || ''}
                                onChange={(e) => setAilmentDetails(prev => ({
                                  ...prev,
                                  [ailment.id]: {
                                    ...prev[ailment.id],
                                    diagnosisDate: e.target.value,
                                  }
                                }))}
                                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Notas del Padecimiento
                              </label>
                              <textarea
                                value={ailmentDetails[ailment.id]?.notes || ''}
                                onChange={(e) => setAilmentDetails(prev => ({
                                  ...prev,
                                  [ailment.id]: {
                                    ...prev[ailment.id],
                                    notes: e.target.value,
                                  }
                                }))}
                                placeholder="Ej: Tomar medicamento cada 8 horas..."
                                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

              {selectedAilments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    ✓ {selectedAilments.length} padecimiento(s) asignado(s) a este alumno
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  ℹ️ Completa los detalles de cada padecimiento seleccionado. Continúa al siguiente paso para asignar materias.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'subjects' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Asignar Materias
                </label>
                {subjects.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-800">
                      No hay materias disponibles. Por favor, crea materias primero.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {subjects.map((subject) => (
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
                    ✓ {selectedSubjects.length} materia(s) seleccionada(s)
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSaving || showConfirm}
              className="px-8 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            {currentStep !== 'subjects' && (
              <button
                onClick={handleNextStep}
                disabled={isSaving}
                className="px-8 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            )}
            {currentStep === 'subjects' && (
              <button
                onClick={handleSubmit}
                disabled={isSaving || showConfirm}
                className="px-8 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        <ConfirmationModal
      isOpen={showConfirm}
      type="edit"
      title="Confirmar edición"
      message="¿Deseas guardar los cambios realizados al alumno?"
      onConfirm={performSubmit}
      onCancel={() => setShowConfirm(false)}
      isLoading={confirmLoading}
    />
    </div>
      </div>
    </div>
  );
}
