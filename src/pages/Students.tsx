import { useEffect, useState, useRef } from 'react';
import { Search, Plus, MoreVertical, Eye, X, Download, FileText, ChevronLeft, ChevronRight, Edit2, Trash2, BookOpen, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import AddStudentModal from '../components/AddStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { showToast } from '../components/Toast';

interface Student {
  id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string;
  enrollment_number: string;
  current_level: string;
  enrollment_date: string;
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
  tutors?: Tutor[];
  subjects?: SubjectShort[];
  documents?: DocumentFile[];
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  }, []);

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
    filterStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setStudents(data);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        `${s.first_name} ${s.paternal_surname} ${s.maternal_surname}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
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

  const handleToggleStudent = async (student: Student) => {
    // toggle: si es el mismo, cerrar
    if (selectedStudent && selectedStudent.id === student.id) {
      setSelectedStudent(null);
      setCurrentDetailTab('info');
      return;
    }

    setCurrentDetailTab('info');
    try {
      // fetch base student (in case we need freshest data)
      const { data: stuData } = await supabase.from('students').select('*').eq('id', student.id).single();

      // fetch tutors
      const { data: tutors } = await supabase.from('tutors').select('*').eq('student_id', student.id);

      // fetch student_subjects -> subjects
      const { data: studentSubjects } = await supabase
        .from('student_subjects')
        .select('subject_id')
        .eq('student_id', student.id);
      let subjects: SubjectShort[] = [];
      if (studentSubjects && studentSubjects.length > 0) {
        const ids = (studentSubjects as { subject_id: string }[]).map((s) => s.subject_id);
        const { data: subs } = await supabase.from('subjects').select('id,name,code').in('id', ids);
        if (subs) subjects = subs;
      }

      // fetch documents
      const { data: documents } = await supabase.from('documents').select('*').eq('student_id', student.id).order('uploaded_at', { ascending: false });

      const detailed: DetailedStudent = {
        ...(stuData || student),
        tutors: tutors || [],
        subjects: subjects || [],
        documents: documents || [],
      };

      setSelectedStudent(detailed);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error fetching student details:', error);
      showToast('Error al cargar detalles del alumno', 'error');
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
        title: 'Eliminar Alumno',
        message: `¿Estás seguro de que deseas eliminar a ${studentName}? Esta acción no se puede deshacer.`,
      },
      'delete-multiple': {
        title: 'Eliminar Múltiples Alumnos',
        message: `¿Estás seguro de que deseas eliminar ${selectedStudents.size} alumno(s)? Esta acción no se puede deshacer.`,
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
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    showConfirmation('delete', async () => {
      setIsConfirmLoading(true);
      try {
        await supabase.from('students').delete().eq('id', studentId);
        showToast('Alumno/a eliminado exitosamente', 'success');
        fetchStudents();
        setSelectedStudent(null);
        setOpenMenuId(null);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Error al eliminar el alumno', 'error');
      } finally {
        setIsConfirmLoading(false);
      }
    }, `${student.first_name} ${student.paternal_surname}`);
  };

  const handleDeleteMultiple = async () => {
    if (selectedStudents.size === 0) return;

    showConfirmation('delete-multiple', async () => {
      setIsConfirmLoading(true);
      try {
        const idsArray = Array.from(selectedStudents);
        await supabase.from('students').delete().in('id', idsArray);
        showToast(`${selectedStudents.size} alumno(s) eliminado(s) exitosamente`, 'success');
        fetchStudents();
        setSelectedStudents(new Set());
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Error deleting students:', error);
        showToast('Error al eliminar alumnos', 'error');
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
          <div ref={cardRef} className="absolute top-24 right-8 bg-white p-6 rounded-xl shadow-2xl z-20 w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  {selectedStudent.first_name} {selectedStudent.paternal_surname}
                </h3>
                <p className="text-xs text-gray-500">Matrícula: {selectedStudent.enrollment_number}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setCurrentDetailTab('info');
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {currentDetailTab === 'info' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Nombre Completo</p>
                      <p className="font-semibold text-gray-900 truncate">
                        {selectedStudent.first_name} {selectedStudent.paternal_surname} {selectedStudent.maternal_surname}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Matrícula</p>
                      <p className="font-semibold text-gray-900">{selectedStudent.enrollment_number}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Nivel</p>
                      <p className="font-semibold text-gray-900">{selectedStudent.current_level}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Estado</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedStudent.status)}`}>
                        {selectedStudent.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Fecha de Inscripción</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedStudent.enrollment_date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}

              {currentDetailTab === 'tutores' && (
                <div className="space-y-3">
                  {selectedStudent.tutors && selectedStudent.tutors.length > 0 ? (
                    selectedStudent.tutors.map((tutor) => (
                      <div key={tutor.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">👨‍🏫 {tutor.name}</p>
                            {tutor.phone && (
                              <p className="text-sm text-gray-600 mt-1">📱 {tutor.phone}</p>
                            )}
                            {tutor.email && (
                              <p className="text-sm text-gray-600 truncate">📧 {tutor.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                      <p className="text-sm text-yellow-800">No hay tutores asignados</p>
                    </div>
                  )}
                </div>
              )}

              {currentDetailTab === 'materias' && (
                <div className="space-y-2">
                  {selectedStudent.subjects && selectedStudent.subjects.length > 0 ? (
                    selectedStudent.subjects.map((subject) => (
                      <div key={subject.id} className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">📚 {subject.name}</p>
                          <p className="text-xs text-gray-600">{subject.code}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                      <p className="text-sm text-yellow-800">No hay materias asignadas</p>
                    </div>
                  )}
                </div>
              )}

              {currentDetailTab === 'documentos' && (
                <div className="space-y-2">
                  {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                    selectedStudent.documents.map((doc) => (
                      <div key={doc.id} className="bg-purple-50 p-3 rounded-lg border border-purple-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <FileText size={16} className="text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">{doc.document_type || 'Archivo'}</p>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 flex-shrink-0 ml-2"
                          title="Descargar"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                      <p className="text-sm text-yellow-800">No hay documentos</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => handleNavigateTab('prev')}
                disabled={currentDetailTab === 'info'}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Sección anterior"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDetailTab('info')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    currentDetailTab === 'info'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ℹ️ Info
                </button>
                <button
                  onClick={() => setCurrentDetailTab('tutores')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    currentDetailTab === 'tutores'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  👨‍🏫 Tutores
                </button>
                <button
                  onClick={() => setCurrentDetailTab('materias')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    currentDetailTab === 'materias'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📚 Materias
                </button>
                <button
                  onClick={() => setCurrentDetailTab('documentos')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    currentDetailTab === 'documentos'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📄 Docs
                </button>
              </div>

              <button
                onClick={() => handleNavigateTab('next')}
                disabled={currentDetailTab === 'documentos'}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Siguiente sección"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            <Plus size={20} />
            <span>Agregar Alumno/a</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
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
                    Tipo de Inscripción
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
                {filteredStudents.map((student) => (
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
                        <div className="font-semibold text-blue-600">
                          {student.first_name} {student.paternal_surname}
                          <button
                            onClick={() => handleToggleStudent(student)}
                            title="Ver detalles"
                            aria-label={`Ver detalles de ${student.first_name} ${student.paternal_surname}`}
                            className="inline-flex items-center justify-center ml-2 p-1 rounded hover:bg-green-50 text-green-600 hover:text-green-800 cursor-pointer"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.enrollment_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {student.current_level || 'Principiante'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(student.enrollment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-600 hover:underline cursor-pointer">
                        Juan Díaz
                      </div>
                      <div className="text-sm text-gray-500">61H000000</div>
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
                              <span>Asignar Materias</span>
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center space-x-2 transition-colors text-red-700 font-semibold"
                            >
                              <Trash2 size={16} />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'activo'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Activo
          </button>
          <button
            onClick={() => setStatusFilter('pendiente')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'pendiente'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pendiente
          </button>
          <button
            onClick={() => setStatusFilter('baja')}
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

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchStudents();
            showToast('Alumno/a agregado exitosamente', 'success');
          }}
        />
      )}

      {editingStudentId && (
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
            ? 'Eliminar'
            : confirmationModal.type === 'edit'
              ? 'Guardar'
              : 'Agregar'
        }
      />
    </Layout>
  );
}
