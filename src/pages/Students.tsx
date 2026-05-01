import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Search, Plus, MoreVertical, Eye, X, Edit2, Trash2, BookOpen, Trash, Bot } from 'lucide-react';
import { students as studentsApi, programs as programsApi, users as usersApi, enrollments, documents, Enrollment, Program } from '../lib/api';
import { getEnrollmentTypeLabel, getProgramFromEnrollment, getProgramNameFromEnrollment, sortEnrollmentsByDate } from '../lib/academy';
import Layout from '../components/Layout';
import DragDropUpload from '../components/DragDropUpload';
const AddStudentModal = lazy(() => import('../components/AddStudentModal'));
const EditStudentModal = lazy(() => import('../components/EditStudentModal'));
import ConfirmationModal from '../components/ConfirmationModal';
import { showToast } from '../components/Toast';

interface Student {
  id: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string | null;
  enrollmentNumber: string;
  currentLevel?: string | null;
  enrollmentDate?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  representative?: string | null;
  status: 'active' | 'pending' | 'dropped';
}

interface SubjectShort {
  id: string;
  name: string;
  code?: string;
}

interface DocumentFile {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface RepresentativeOption {
  id: string;
  name: string;
}

interface StudentEnrollmentDetail extends Enrollment {
  programName: string;
  programDetails: Program | null;
  representativeName?: string | null;
}

interface DetailedStudent extends Student {
  birthDate?: string | null;
  currentGrade?: string | null;
  program?: string | null;
  programDetails?: Program | null;
  enrollments?: StudentEnrollmentDetail[];
  shift?: string | null;
  representative?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  curp?: string | null;
  subjects?: SubjectShort[];
  documents?: DocumentFile[];
  ailments?: Array<{
    id: string;
    name: string;
    severity?: string;
    medication?: string;
  }>;
}



const formatRepresentativeName = (user: { firstName?: string; paternalSurname?: string; maternalSurname?: string | null } | RepresentativeOption) => {
  if ('name' in user) {
    return user.name;
  }

  return [user.firstName, user.paternalSurname, user.maternalSurname].filter(Boolean).join(' ');
};

export default function Students() {
  const getPreviousMonthValue = () => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'dropped'>('all');
  const [enrollmentMonthFilter, setEnrollmentMonthFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<DetailedStudent | null>(null);
  const [programCatalog, setProgramCatalog] = useState<Program[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentDetailTab, setCurrentDetailTab] = useState<'info' | 'programas' | 'representante' | 'documentos'>('info');
  const [showAddEnrollmentForm, setShowAddEnrollmentForm] = useState(false);
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false);
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null);
  const [recentEnrollmentId, setRecentEnrollmentId] = useState<string | null>(null);
  const [newEnrollmentForm, setNewEnrollmentForm] = useState({
    programId: '',
  });
  const [showInlineDocumentUploader, setShowInlineDocumentUploader] = useState(false);
  const [inlineDocumentFiles, setInlineDocumentFiles] = useState<File[]>([]);
  const [isUploadingInlineDocuments, setIsUploadingInlineDocuments] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'edit' | 'add' | 'delete-multiple';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'add',
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [editingStatusStudentId, setEditingStatusStudentId] = useState<string | null>(null);
  const [pendingStatusValue, setPendingStatusValue] = useState<Student['status']>('active');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, page, limit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setSelectedStudent(null);
        setCurrentDetailTab('info');
        setShowAddEnrollmentForm(false);
        setExpandedEnrollmentId(null);
        setRecentEnrollmentId(null);
        setShowInlineDocumentUploader(false);
        setInlineDocumentFiles([]);
      }
    };

    if (selectedStudent) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedStudent]);

  useEffect(() => {
    applyEnrollmentDateFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, enrollmentMonthFilter]);

  const loadStudentsWithoutStatusFilter = async (search?: string) => {
    const pageSize = 100;
    const firstResponse = await studentsApi.list({
      search,
      page: 1,
      limit: pageSize,
    });

    const firstPageRows = firstResponse.data || [];
    const total = firstResponse.pagination?.total || firstPageRows.length;
    const totalPagesCount = firstResponse.pagination?.totalPages || Math.max(1, Math.ceil(total / pageSize));

    if (totalPagesCount <= 1) {
      return firstPageRows;
    }

    const remainingResponses = await Promise.all(
      Array.from({ length: totalPagesCount - 1 }, (_, index) =>
        studentsApi.list({
          search,
          page: index + 2,
          limit: pageSize,
        })
      )
    );

    return [...firstPageRows, ...remainingResponses.flatMap((response) => response.data || [])];
  };

  const fetchStudents = async () => {
    try {
      if (statusFilter !== 'all') {
        const allStudentsForSearch = await loadStudentsWithoutStatusFilter(searchTerm.trim() || undefined);
        const studentsByStatus = allStudentsForSearch.filter((student) => student.status === statusFilter);
        const nextTotalPages = Math.max(1, Math.ceil(studentsByStatus.length / limit));
        const safePage = Math.min(page, nextTotalPages);

        if (safePage !== page) {
          setPage(safePage);
          return;
        }

        const startIndex = (safePage - 1) * limit;
        const nextRows = studentsByStatus.slice(startIndex, startIndex + limit);

        setStudents(nextRows);
        setTotalPages(nextTotalPages);
        setTotalStudents(studentsByStatus.length);
        return;
      }

      const response = await studentsApi.list({
        search: searchTerm.trim() || undefined,
        page,
        limit,
      });
      setStudents(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalStudents(response.pagination?.total || response.data.length || 0);
    } catch (error) {
      console.error('Error fetching students:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar alumnos';
      showToast(message, 'error');
    }
  };

  const applyEnrollmentDateFilter = () => {
    let filtered = students;

    if (enrollmentMonthFilter) {
      filtered = filtered.filter(s => s.enrollmentDate?.startsWith(enrollmentMonthFilter));
    }

    setFilteredStudents(filtered);
  };

  const toggleStudentSelection = (id: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStudents(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
      case 'dropped':
        return 'Baja';
      default:
        return status;
    }
  };

  const getGenderLabel = (gender?: Student['gender']) => {
    switch (gender) {
      case 'male':
        return 'Masculino';
      case 'female':
        return 'Femenino';
      case 'other':
        return 'Otro';
      default:
        return '—';
    }
  };

  const handleStartStatusEdit = (student: Student) => {
    setEditingStatusStudentId(student.id);
    setPendingStatusValue(student.status);
  };

  const handleSaveStatus = async (studentId: string) => {
    try {
      const updatedStudent = await studentsApi.update(studentId, { status: pendingStatusValue });

      setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, status: updatedStudent.status } : student)));
      setFilteredStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, status: updatedStudent.status } : student)));
      setSelectedStudent((prev) => (prev && prev.id === studentId ? { ...prev, status: updatedStudent.status } : prev));
      setEditingStatusStudentId(null);
      showToast('Estado del alumno actualizado', 'success');
    } catch (error) {
      console.error('Error updating student status:', error);
      const message = error instanceof Error ? error.message : 'Error al actualizar el estado del alumno';
      showToast(message, 'error');
    }
  };

  const getEnrollmentStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'active':
      case 'activo':
        return 'Activa';
      case 'inactive':
      case 'inactivo':
        return 'Inactiva';
      case 'dropped':
      case 'baja':
        return 'Baja';
      default:
        return status || 'Sin estado';
    }
  };

  const availableProgramsForSelectedStudent = selectedStudent
    ? programCatalog.filter((program) => {
        const assignedProgramIds = new Set(
          (selectedStudent.enrollments || []).map((enrollment) => enrollment.programId).filter(Boolean)
        );

        return program.status === 'active' && !assignedProgramIds.has(program.id);
      })
    : [];

  const openAddEnrollmentForm = () => {
    if (!selectedStudent) {
      return;
    }

    const defaultProgramId = availableProgramsForSelectedStudent[0]?.id || '';
    setNewEnrollmentForm({
      programId: defaultProgramId,
    });
    setShowAddEnrollmentForm(true);
  };

  const handleCreateEnrollment = async () => {
    if (!selectedStudent) {
      return;
    }

    if (!newEnrollmentForm.programId) {
      showToast('Selecciona un programa para inscribir al alumno', 'error');
      return;
    }

    setIsSavingEnrollment(true);
    try {
      const selectedProgram = programCatalog.find((program) => program.id === newEnrollmentForm.programId);

      const createdEnrollment = await enrollments.create({
        studentId: selectedStudent.id,
        programId: newEnrollmentForm.programId,
        program: selectedProgram?.name,
        enrollmentDate: new Date().toISOString().slice(0, 10),
        status: 'active',
      });

      const enrollmentDetail: StudentEnrollmentDetail = {
        ...createdEnrollment,
        programDetails: selectedProgram || getProgramFromEnrollment(programCatalog, createdEnrollment),
        programName: getProgramNameFromEnrollment(programCatalog, {
          programId: createdEnrollment.programId || newEnrollmentForm.programId,
          program: createdEnrollment.program || selectedProgram?.name || null,
        }),
        representativeName: null,
      };

      setSelectedStudent((prev) => {
        if (!prev || prev.id !== selectedStudent.id) {
          return prev;
        }

        return {
          ...prev,
          program: enrollmentDetail.programName,
          programDetails: enrollmentDetail.programDetails,
          enrollments: sortEnrollmentsByDate([enrollmentDetail, ...(prev.enrollments || [])]),
        };
      });

      setExpandedEnrollmentId(createdEnrollment.id);
      setRecentEnrollmentId(createdEnrollment.id);
      setShowAddEnrollmentForm(false);
      showToast('Programa asignado exitosamente al alumno', 'success');
    } catch (error) {
      console.error('Error creating enrollment:', error);
      const message = error instanceof Error ? error.message : 'Error al asignar el programa';
      showToast(message, 'error');
    } finally {
      setIsSavingEnrollment(false);
    }
  };

  const handleToggleStudent = async (student: Student, initialTab: 'info' | 'programas' = 'info') => {
    if (selectedStudent && selectedStudent.id === student.id) {
      setSelectedStudent(null);
      setCurrentDetailTab(initialTab);
      setShowAddEnrollmentForm(false);
      setExpandedEnrollmentId(null);
      setRecentEnrollmentId(null);
      setShowInlineDocumentUploader(false);
      setInlineDocumentFiles([]);
      return;
    }

    setCurrentDetailTab(initialTab);
    try {
      const detailed = await fetchStudentDetail(student);
      setSelectedStudent(detailed);
      setShowInlineDocumentUploader(false);
      setInlineDocumentFiles([]);
      setExpandedEnrollmentId(detailed.enrollments?.[0]?.id || null);
      setRecentEnrollmentId(null);
      setCurrentDetailTab(initialTab);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error fetching student details:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar detalles del alumno';
      showToast(message, 'error');
    }
  };

  const fetchStudentDetail = async (student: Student): Promise<DetailedStudent> => {
      const [stuData, programsCatalog, usersCatalog] = await Promise.all([
        studentsApi.getById(student.id),
        programsApi.list(),
        usersApi.list(),
      ]);
      const representativeOptions = usersCatalog.map((user) => ({
        id: user.id,
        name: formatRepresentativeName(user),
      }));
      const representativesById = new Map(representativeOptions.map((user) => [user.id, user.name]));

      setProgramCatalog(programsCatalog);
      const enrollmentsResponse = await enrollments.list(stuData.id);

      const enrollmentHistory = sortEnrollmentsByDate(enrollmentsResponse.data || []);
      const enrollmentDetails = enrollmentHistory.map((enrollment) => {
        const programDetails = getProgramFromEnrollment(programsCatalog, enrollment);

        return {
          ...enrollment,
          programDetails,
          programName: getProgramNameFromEnrollment(programsCatalog, enrollment),
          representativeName: enrollment.representativeId ? representativesById.get(enrollment.representativeId) || null : null,
        };
      });
      const latestEnrollment = enrollmentDetails[0];
      const programDetails = latestEnrollment?.programDetails || getProgramFromEnrollment(programsCatalog, {
        programId: null,
        program: stuData.program || null,
      });
      const studentDocuments = stuData.documents || [];
      const activeAilments = (stuData.ailments || []).filter((item) => {
        const relationStatus = item.status || 'active';
        const ailmentId = item.ailmentId || item.ailment?.id;

        return relationStatus === 'active' && Boolean(ailmentId);
      });

      const detailed: DetailedStudent = {
        ...student,
        ...stuData,
        program: latestEnrollment?.programName || stuData.program || null,
        programDetails,
        enrollments: enrollmentDetails,
        subjects: (stuData.subjects || []).map((item) => ({
          id: item.subject.id,
          name: item.subject.name,
          code: item.subject.code,
        })),
        documents: studentDocuments.map((doc) => ({
          id: doc.id,
          document_type: doc.documentType,
          file_name: doc.fileName,
          file_url: doc.fileUrl,
          uploaded_at: doc.uploadedAt,
        })),
        ailments: activeAilments.map((item) => ({
          id: item.id,
          name: item.ailment?.name || 'Padecimiento',
          severity: item.ailment?.severity,
          medication: item.ailment?.medication,
        })),
      };

      return detailed;
  };

  const refreshSelectedStudent = async (studentId: string) => {
    const student = students.find((item) => item.id === studentId)
      || filteredStudents.find((item) => item.id === studentId)
      || (selectedStudent && selectedStudent.id === studentId ? selectedStudent : null);

    if (!student) {
      return;
    }

    const detailed = await fetchStudentDetail(student);
    setSelectedStudent(detailed);
  };

  const handleInlineDocumentUpload = async () => {
    if (!selectedStudent || inlineDocumentFiles.length === 0) {
      return;
    }

    setIsUploadingInlineDocuments(true);
    try {
      for (const file of inlineDocumentFiles) {
        await documents.upload({
          studentId: selectedStudent.id,
          documentType: 'pdf',
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
        });
      }

      await refreshSelectedStudent(selectedStudent.id);
      setInlineDocumentFiles([]);
      setShowInlineDocumentUploader(false);
      setCurrentDetailTab('documentos');
      showToast('Documentos agregados exitosamente', 'success');
    } catch (error) {
      console.error('Error uploading student documents:', error);
      const message = error instanceof Error ? error.message : 'Error al agregar documentos';
      showToast(message, 'error');
    } finally {
      setIsUploadingInlineDocuments(false);
    }
  };

  const showConfirmation = (type: 'delete' | 'edit' | 'add' | 'delete-multiple', onConfirm: () => void, studentName?: string) => {
    const messages: Record<string, { title: string; message: string }> = {
      add: {
        title: 'Agregar Nuevo Alumno',
        message: 'Confirma que deseas agregar este nuevo alumno a la academia. Los datos se guardarán en la base de datos.',
      },
      edit: {
        title: 'Guardar Cambios',
        message: `Confirma que deseas guardar los cambios de ${studentName}. Los datos serán actualizados en la base de datos.`,
      },
      delete: {
        title: 'Dar de baja alumno',
        message: `¿Deseas confirmar la baja de ${studentName}? El alumno conservará su historial y cambiará a estado de baja.`,
      },
      'delete-multiple': {
        title: 'Dar de baja alumnos',
        message: `¿Deseas confirmar la baja de ${selectedStudents.size} alumno(s)? El historial permanecerá disponible.`,
      },
    };

    const config = messages[type];
    setConfirmationModal({
      isOpen: true,
      type,
      title: config.title,
      message: config.message,
      onConfirm,
    });
  };

  const handleDeleteStudent = async (studentId: string) => {
    const student = filteredStudents.find(s => s.id === studentId) || students.find(s => s.id === studentId);
    if (!student) return;

    showConfirmation('delete', async () => {
      setIsConfirmLoading(true);
      try {
        await studentsApi.delete(studentId);
        showToast('Alumno/a dado de baja exitosamente', 'success');
        fetchStudents();
        setSelectedStudent(null);
        setOpenMenuId(null);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Error deleting student:', error);
        const message = error instanceof Error ? error.message : 'Error al eliminar el alumno';
        showToast(message, 'error');
      } finally {
        setIsConfirmLoading(false);
      }
    }, `${student.firstName} ${student.paternalSurname}`);
  };

  const handleDeleteMultiple = async () => {
    if (selectedStudents.size === 0) return;

    showConfirmation('delete-multiple', async () => {
      setIsConfirmLoading(true);
      try {
        const idsArray = Array.from(selectedStudents);
        for (const id of idsArray) {
          await studentsApi.delete(id);
        }
        showToast(`${selectedStudents.size} alumno(s) dado(s) de baja exitosamente`, 'success');
        fetchStudents();
        setSelectedStudents(new Set());
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Error deleting students:', error);
        const message = error instanceof Error ? error.message : 'Error al eliminar alumnos';
        showToast(message, 'error');
      } finally {
        setIsConfirmLoading(false);
      }
    });
  };

  const handleEditStudentClick = (studentId: string) => {
    setEditingStudentId(studentId);
    setOpenMenuId(null);
  };

  const handleNavigateTab = (direction: 'next' | 'prev') => {
    const tabs: ('info' | 'programas' | 'representante' | 'documentos')[] = ['info', 'programas', 'representante', 'documentos'];
    const currentIndex = tabs.indexOf(currentDetailTab);
    
    if (direction === 'next') {
      if (currentIndex < tabs.length - 1) {
        setCurrentDetailTab(tabs[currentIndex + 1]);
      }
    } else {
      if (currentIndex > 0) {
        setCurrentDetailTab(tabs[currentIndex - 1]);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6 relative">
        {selectedStudent && (
          <div className="student-detail-modal fixed inset-0 z-30 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm p-4">
            <div ref={cardRef} className="student-detail-shell w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white/95 shadow-2xl ring-1 ring-blue-100 flex flex-col">
            {/* Header */}
            <div className="student-detail-header flex justify-between items-start mb-4 p-6 pb-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ficha del Alumno</p>
                <h3 className="font-black text-2xl text-gray-900 mt-1">
                  {selectedStudent.firstName} {selectedStudent.paternalSurname}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Matrícula: <span className="font-semibold text-gray-800">{selectedStudent.enrollmentNumber}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditStudentClick(selectedStudent.id)}
                  className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-white/80 hover:text-blue-700"
                  title="Editar alumno"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setCurrentDetailTab('info');
                    setShowAddEnrollmentForm(false);
                    setShowInlineDocumentUploader(false);
                    setInlineDocumentFiles([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-white/80"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="student-detail-content flex-1 overflow-y-auto px-6 pb-2">
              {currentDetailTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Nombre completo</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.firstName} {selectedStudent.paternalSurname} {selectedStudent.maternalSurname}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Matrícula</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.enrollmentNumber}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Nivel</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.currentLevel || '—'}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-4 border border-indigo-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Programa actual</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.programDetails?.name || selectedStudent.program || '—'}</p>
                    {selectedStudent.enrollments && selectedStudent.enrollments.length > 1 && (
                      <p className="mt-1 text-xs text-gray-500">{selectedStudent.enrollments.length} programas registrados</p>
                    )}
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Estado</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{getStatusLabel(selectedStudent.status)}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-cyan-50 rounded-2xl p-4 border border-cyan-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Género</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{getGenderLabel(selectedStudent.gender)}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-violet-50 rounded-2xl p-4 border border-violet-100 md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Fecha de Inscripción</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '—'}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-4 border border-emerald-100 md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Contacto de emergencia</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.emergencyContactName || 'Sin contacto registrado'}</p>
                    <p className="text-sm text-gray-700 mt-1">Teléfono: {selectedStudent.emergencyContactPhone || '—'}</p>
                  </div>
                  <div className="student-detail-card bg-gradient-to-br from-slate-50 to-rose-50 rounded-2xl p-4 border border-rose-100 md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Padecimientos</p>
                    {selectedStudent.ailments && selectedStudent.ailments.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedStudent.ailments.map((ailment) => (
                          <span key={ailment.id} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-sm">
                            <span>{ailment.name}</span>
                            {(ailment.severity || ailment.medication) && (
                              <span className="text-rose-500">
                                {ailment.severity || ailment.medication}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">Sin padecimientos registrados</p>
                    )}
                  </div>
                </div>
              )}

              {currentDetailTab === 'representante' && (
                <div className="space-y-3">
                  {selectedStudent.representative ? (
                    <div className="student-detail-card rounded-xl border border-gray-200 p-4 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Representante</p>
                      <p className="mt-1 font-medium text-gray-800">{selectedStudent.representative}</p>
                    </div>
                  ) : (
                    <div className="student-detail-card rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      No hay representante asignado
                    </div>
                  )}
                </div>
              )}

              {currentDetailTab === 'programas' && (
                <div className="space-y-4">
                  <div className="student-detail-card rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase text-indigo-600">Programas inscritos</p>
                      <button
                        type="button"
                        onClick={openAddEnrollmentForm}
                        disabled={availableProgramsForSelectedStudent.length === 0}
                        className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Agregar programa
                      </button>
                    </div>

                    {showAddEnrollmentForm && (
                      <div className="student-detail-card mt-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-gray-500">Programa</label>
                          <select
                            value={newEnrollmentForm.programId}
                            onChange={(event) => setNewEnrollmentForm((prev) => ({ ...prev, programId: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value="">Seleccionar programa</option>
                            {availableProgramsForSelectedStudent.map((program) => (
                              <option key={program.id} value={program.id}>{program.name}</option>
                            ))}
                          </select>
                          <p className="mt-2 text-xs text-gray-500">
                            Solo se asigna el programa. La inscripción se crea activa con la fecha actual.
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddEnrollmentForm(false)}
                            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateEnrollment}
                            disabled={isSavingEnrollment || !newEnrollmentForm.programId}
                            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {isSavingEnrollment ? 'Guardando...' : 'Asignar programa'}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {selectedStudent.enrollments.map((enrollment, index) => (
                          <details
                            key={enrollment.id}
                            open={expandedEnrollmentId ? expandedEnrollmentId === enrollment.id : index === 0}
                            onToggle={(event) => {
                              const element = event.currentTarget;
                              if (element.open) {
                                setExpandedEnrollmentId(enrollment.id);
                                return;
                              }

                              if (expandedEnrollmentId === enrollment.id) {
                                setExpandedEnrollmentId(null);
                              }
                            }}
                            className={`student-detail-enrollment rounded-xl p-4 shadow-sm transition-colors ${
                              recentEnrollmentId === enrollment.id
                                ? 'border border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
                                : 'bg-white'
                            }`}
                          >
                            <summary className="cursor-pointer list-none">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{enrollment.programName}</span>
                                  {recentEnrollmentId === enrollment.id && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                      Recién asignado
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {getEnrollmentTypeLabel(enrollment.enrollmentType)} · {getEnrollmentStatusLabel(enrollment.status)}
                                </span>
                              </div>
                            </summary>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <div className="student-detail-card rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase text-gray-500">Fecha de inscripción</p>
                                <p className="mt-1 text-sm text-gray-800">{enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString('es-MX') : 'Sin fecha'}</p>
                              </div>
                              <div className="student-detail-card rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase text-gray-500">Representante</p>
                                <p className="mt-1 text-sm text-gray-800">{enrollment.representativeName || 'Sin representante'}</p>
                              </div>
                              <div className="student-detail-card rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase text-gray-500">Estatus</p>
                                <p className="mt-1 text-sm text-gray-800">{getEnrollmentStatusLabel(enrollment.status)}</p>
                              </div>
                              <div className="student-detail-card rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                <p className="text-xs font-semibold uppercase text-gray-500">Vigencia</p>
                                <p className="mt-1 text-sm text-gray-800">{enrollment.dueDate ? new Date(enrollment.dueDate).toLocaleDateString('es-MX') : 'Sin vencimiento'}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                              {enrollment.programDetails?.description || 'Sin descripción'}
                            </p>
                            <div className="mt-3 space-y-2">
                              {enrollment.programDetails?.subjects.length ? (
                                enrollment.programDetails.subjects.map((subject) => (
                                  <div key={subject.id} className="student-detail-card flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-medium text-gray-800">{subject.name}</span>
                                    <span className="text-xs text-gray-500">{subject.code}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">Este programa no tiene materias configuradas.</p>
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">No hay inscripciones registradas para este alumno.</p>
                    )}
                  </div>
                </div>
              )}

              {currentDetailTab === 'documentos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Documentos del alumno</p>
                      <p className="text-xs text-gray-500">Puedes agregarlos desde aqui sin abrir el modal completo.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInlineDocumentUploader((prev) => !prev)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      {showInlineDocumentUploader ? 'Ocultar' : 'Agregar documentos'}
                    </button>
                  </div>

                  {showInlineDocumentUploader && (
                    <div className="student-detail-card rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="text-sm font-semibold text-gray-900">Carga rapida de documentos</p>
                      <p className="mt-1 text-xs text-gray-600">Selecciona los archivos y guardalos directamente en la ficha.</p>
                      <div className="mt-4">
                        <DragDropUpload
                          onFilesSelected={setInlineDocumentFiles}
                          accept=".pdf"
                          maxFiles={10}
                          maxFileSizeMB={10}
                          label="Arrastra documentos PDF aqui o selecciona archivos"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowInlineDocumentUploader(false);
                            setInlineDocumentFiles([]);
                          }}
                          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleInlineDocumentUpload}
                          disabled={inlineDocumentFiles.length === 0 || isUploadingInlineDocuments}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUploadingInlineDocuments ? 'Guardando...' : 'Guardar documentos'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                    selectedStudent.documents.map((doc) => (
                      <div key={doc.id} className="student-detail-card rounded-xl border border-gray-200 p-3 bg-gray-50">
                        <p className="text-sm font-medium text-gray-800">{doc.file_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{doc.document_type || 'Archivo'}</p>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Descargar</a>
                      </div>
                    ))
                  ) : (
                    <div className="student-detail-card rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      <p>No hay documentos.</p>
                      <p className="mt-1">Si quieres agregarlos, presiona el siguiente boton para abrir una carga rapida aqui mismo.</p>
                      {!showInlineDocumentUploader && (
                        <button
                          type="button"
                          onClick={() => setShowInlineDocumentUploader(true)}
                          className="mt-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          Agregar documentos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="student-detail-footer mt-4 p-6 pt-4 border-t border-emerald-100 flex items-center justify-between bg-white">
              <button
                onClick={() => handleNavigateTab('prev')}
                disabled={currentDetailTab === 'info'}
                className="text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sección anterior"
              >
                Anterior
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDetailTab('info')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentDetailTab === 'info'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Info
                </button>
                <button
                  onClick={() => setCurrentDetailTab('programas')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentDetailTab === 'programas'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Programas
                </button>
                <button
                  onClick={() => setCurrentDetailTab('representante')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentDetailTab === 'representante'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Representante
                </button>
                <button
                  onClick={() => setCurrentDetailTab('documentos')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentDetailTab === 'documentos'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Documentos
                </button>
              </div>

              <button
                onClick={() => handleNavigateTab('next')}
                disabled={currentDetailTab === 'documentos'}
                className="text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Siguiente sección"
              >
                Siguiente
              </button>
            </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Agregar Alumno/a</span>
            </button>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar"
                  value={searchTerm}
                  onChange={(e) => {
                    setPage(1);
                    setSearchTerm(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={enrollmentMonthFilter}
                  onChange={(e) => setEnrollmentMonthFilter(e.target.value)}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setEnrollmentMonthFilter(getPreviousMonthValue())}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Mes pasado
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollmentMonthFilter('')}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="flex flex-wrap flex-row-reverse items-center justify-end gap-4">
              <button
                onClick={() => {
                  setPage(1);
                  setStatusFilter('all');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todos ({totalStudents})
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  setStatusFilter('active');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  setStatusFilter('pending');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  setStatusFilter('dropped');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'dropped'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dados de baja
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden relative">
          {selectedStudents.size > 0 && (
            <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-3 z-10 shadow-md">
              <div className="text-center">
                <p className="text-xs text-gray-600">Seleccionados</p>
                <p className="text-lg font-bold text-red-600">{selectedStudents.size}</p>
              </div>
              <button
                onClick={handleDeleteMultiple}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
              >
                <Trash size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
                        } else {
                          setSelectedStudents(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Alumno/a
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Nivel Actual
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Fecha de Inscripción
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Representante
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {totalStudents > 0
                        ? 'No hay alumnos que coincidan con los filtros actuales.'
                        : 'No hay alumnos registrados todavía.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-blue-600 flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <Bot size={16} />
                          </span>
                          <span>
                          {student.firstName} {student.paternalSurname}
                          </span>
                          <button
                            onClick={() => handleToggleStudent(student)}
                            title="Ver detalles"
                            aria-label={`Ver detalles de ${student.firstName} ${student.paternalSurname}`}
                            className="inline-flex items-center justify-center ml-2 p-1 rounded hover:bg-green-50 text-green-600 hover:text-green-800 cursor-pointer"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.enrollmentNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {student.currentLevel || 'Principiante'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="space-y-2">
                        <div>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString('es-MX') : '—'}</div>
                        {editingStatusStudentId === student.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={pendingStatusValue}
                              onChange={(event) => setPendingStatusValue(event.target.value as Student['status'])}
                              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="active">Activo</option>
                              <option value="pending">Pendiente</option>
                              <option value="dropped">Baja</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveStatus(student.id)}
                              className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStatusStudentId(null)}
                              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartStatusEdit(student)}
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}
                            title="Cambiar estado"
                          >
                            {getStatusLabel(student.status)}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div className="font-medium text-blue-600">
                        {student.representative || 'Sin representante asignado'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>

                        {openMenuId === student.id && (
                          <div className="absolute right-0 mt-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleEditStudentClick(student.id);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center space-x-2 transition-colors text-gray-700 font-semibold border-b border-gray-100"
                            >
                              <Edit2 size={16} className="text-blue-600" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleToggleStudent(student, 'programas');
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center space-x-2 transition-colors text-gray-700 font-semibold border-b border-gray-100"
                            >
                              <BookOpen size={16} className="text-green-600" />
                              <span>Ver Programas</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 transition-colors text-red-700 font-semibold"
                            >
                              <Trash2 size={16} />
                              <span>Dar de baja</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm font-semibold text-gray-700">
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
            disabled={page >= (totalPages || 1)}
            className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>

      </div>

      {showAddModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-3xl p-8"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div></div>}>
          <AddStudentModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchStudents();
              showToast('Alumno/a agregado exitosamente', 'success');
            }}
          />
        </Suspense>
      )}

      {editingStudentId && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-3xl p-8"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div></div>}>
          <EditStudentModal
            studentId={editingStudentId}
            onClose={() => setEditingStudentId(null)}
            onSuccess={async () => {
              const updatedStudentId = editingStudentId;
              setEditingStudentId(null);
              await fetchStudents();
              if (updatedStudentId && selectedStudent?.id === updatedStudentId) {
                await refreshSelectedStudent(updatedStudentId);
              }
              showToast('Alumno/a actualizado exitosamente', 'success');
            }}
          />
        </Suspense>
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        type={confirmationModal.type as 'delete' | 'edit' | 'add' | 'info'}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={async () => {
          await confirmationModal.onConfirm();
        }}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={isConfirmLoading}
        confirmText={
          confirmationModal.type === 'delete' || confirmationModal.type === 'delete-multiple'
            ? 'Confirmar baja'
            : confirmationModal.type === 'edit'
              ? 'Guardar'
              : 'Agregar'
        }
      />
    </Layout>
  );
}
