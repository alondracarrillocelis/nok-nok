import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Search, Plus, MoreVertical, Eye, X, Edit2, Trash2, BookOpen, Trash, Bot } from 'lucide-react';
import { students as studentsApi, StudentDetailResponse } from '../lib/api';
import Layout from '../components/Layout';
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
  status: 'activo' | 'pendiente' | 'baja';
}

interface Tutor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
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

interface DetailedStudent extends Student {
  birthDate?: string | null;
  currentGrade?: string | null;
  program?: string | null;
  shift?: string | null;
  representative?: string | null;
  curp?: string | null;
  tutors?: Tutor[];
  subjects?: SubjectShort[];
  documents?: DocumentFile[];
  ailments?: Array<{
    id: string;
    name: string;
    severity?: string;
    medication?: string;
  }>;
}

export default function Students() {
  const getPreviousMonthValue = () => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'pendiente' | 'baja'>('all');
  const [enrollmentMonthFilter, setEnrollmentMonthFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<DetailedStudent | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentDetailTab, setCurrentDetailTab] = useState<'info' | 'tutores' | 'materias' | 'documentos'>('info');
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

  const fetchStudents = async () => {
    try {
      const response = await studentsApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
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
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Student['status']) => {
    switch (status) {
      case 'activo':
        return 'Activo';
      case 'pendiente':
        return 'Pendiente';
      case 'baja':
        return 'Baja';
      default:
        return status;
    }
  };

  const handleToggleStudent = async (student: Student) => {
    if (selectedStudent && selectedStudent.id === student.id) {
      setSelectedStudent(null);
      setCurrentDetailTab('info');
      return;
    }

    setCurrentDetailTab('info');
    try {
      const stuData: StudentDetailResponse = await studentsApi.getById(student.id);

      const detailed: DetailedStudent = {
        ...student,
        ...stuData,
        tutors: (stuData.tutors || []).map((tutor) => ({
          id: tutor.id,
          name: tutor.name,
          phone: tutor.phone || undefined,
          email: tutor.email || undefined,
        })),
        subjects: (stuData.subjects || []).map((item) => ({
          id: item.subject.id,
          name: item.subject.name,
          code: item.subject.code,
        })),
        documents: (stuData.documents || []).map((doc) => ({
          id: doc.id,
          document_type: doc.documentType,
          file_name: doc.fileName,
          file_url: doc.fileUrl,
          uploaded_at: doc.uploadedAt,
        })),
        ailments: (stuData.ailments || []).map((item) => ({
          id: item.id,
          name: item.ailment?.name || 'Padecimiento',
          severity: item.ailment?.severity,
          medication: item.ailment?.medication,
        })),
      };

      setSelectedStudent(detailed);
      setCurrentDetailTab('info');
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error fetching student details:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar detalles del alumno';
      showToast(message, 'error');
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
    const tabs: ('info' | 'tutores' | 'materias' | 'documentos')[] = ['info', 'tutores', 'materias', 'documentos'];
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
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm p-4">
            <div ref={cardRef} className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white/95 shadow-2xl ring-1 ring-blue-100 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 p-6 pb-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ficha del Alumno</p>
                <h3 className="font-black text-2xl text-gray-900 mt-1">
                  {selectedStudent.firstName} {selectedStudent.paternalSurname}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Matrícula: <span className="font-semibold text-gray-800">{selectedStudent.enrollmentNumber}</span></p>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setCurrentDetailTab('info');
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-white/80"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {currentDetailTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Nombre completo</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.firstName} {selectedStudent.paternalSurname} {selectedStudent.maternalSurname}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Matrícula</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.enrollmentNumber}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Nivel</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.currentLevel || '—'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Estado</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{getStatusLabel(selectedStudent.status)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-2xl p-4 border border-cyan-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Género</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">—</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-violet-50 rounded-2xl p-4 border border-violet-100 md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Fecha de Inscripción</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '—'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-4 border border-emerald-100 md:col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Contacto de emergencia</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedStudent.tutors && selectedStudent.tutors.length > 0 ? selectedStudent.tutors[0].name : 'Sin contacto registrado'}</p>
                    <p className="text-sm text-gray-700 mt-1">Teléfono: {selectedStudent.tutors && selectedStudent.tutors.length > 0 ? selectedStudent.tutors[0].phone || '—' : '—'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-rose-50 rounded-2xl p-4 border border-rose-100 md:col-span-2">
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

              {currentDetailTab === 'tutores' && (
                <div className="space-y-3">
                  {selectedStudent.tutors && selectedStudent.tutors.length > 0 ? (
                    selectedStudent.tutors.map((tutor) => (
                      <div key={tutor.id} className="rounded-xl border border-gray-200 p-3 bg-gray-50">
                        <p className="font-medium text-gray-800">{tutor.name}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      No hay tutores asignados
                    </div>
                  )}
                </div>
              )}

              {currentDetailTab === 'materias' && (
                <div className="space-y-2">
                  {selectedStudent.subjects && selectedStudent.subjects.length > 0 ? (
                    selectedStudent.subjects.map((subject) => (
                      <div key={subject.id} className="rounded-xl border border-gray-200 p-3 bg-gray-50 flex items-center justify-between">
                        <p className="font-medium text-gray-800">{subject.name}</p>
                        <span className="text-xs text-gray-500">{subject.code}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      No hay programas asignados
                    </div>
                  )}
                </div>
              )}

              {currentDetailTab === 'documentos' && (
                <div className="space-y-2">
                  {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                    selectedStudent.documents.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-gray-200 p-3 bg-gray-50">
                        <p className="text-sm font-medium text-gray-800">{doc.file_name}</p>
                        <p className="text-xs text-gray-500 mt-1">{doc.document_type || 'Archivo'}</p>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Descargar</a>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                      No hay documentos
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 p-6 pt-4 border-t border-emerald-100 flex items-center justify-between bg-white">
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
                  onClick={() => setCurrentDetailTab('tutores')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentDetailTab === 'tutores'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tutores
                </button>
                <button
                  onClick={() => setCurrentDetailTab('materias')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    currentDetailTab === 'materias'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Programas
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
            {/*
            <button
              type="button"
              onClick={() => fetchStudents()}
              disabled
              title="Recarga deshabilitada temporalmente"
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-400 px-4 py-3 rounded-full font-semibold cursor-not-allowed"
            >
              <RefreshCw size={18} />
              Recargar
            </button>
            */}
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
                  setStatusFilter('activo');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'activo'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Activo
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  setStatusFilter('pendiente');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'pendiente'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => {
                  setPage(1);
                  setStatusFilter('baja');
                }}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  statusFilter === 'baja'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Baja
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
                    Tutor
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
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                          {getStatusLabel(student.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-600 hover:underline cursor-pointer">
                        Sin tutor asignado
                      </div>
                      <div className="text-sm text-gray-500">—</div>
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
                                setCurrentDetailTab('materias');
                                handleToggleStudent(student);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center space-x-2 transition-colors text-gray-700 font-semibold border-b border-gray-100"
                            >
                              <BookOpen size={16} className="text-green-600" />
                              <span>Asignar Programas</span>
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
            onSuccess={() => {
              setEditingStudentId(null);
              fetchStudents();
              setSelectedStudent(null);
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
