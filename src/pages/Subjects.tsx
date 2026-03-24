import { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { subjects } from '../lib/api';
import Layout from '../components/Layout';
import EditSubjectModal from '../components/EditSubjectModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { showToast } from '../components/Toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  status: 'activo' | 'inactivo';
  created_at: string;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'delete-multiple';
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, type: 'delete', title: '', message: '', onConfirm: () => {} });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, searchTerm, statusFilter]);

  const fetchSubjects = async () => {
    try {
      const data = await subjects.list();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showToast('Error al cargar las materias', 'error');
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        `${s.name} ${s.code} ${s.description}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubjects(filtered);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio';
    }
    if (formData.credits <= 0) {
      newErrors.credits = 'Los créditos deben ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubject = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await subjects.create({
        name: formData.name,
        code: formData.code,
        description: formData.description,
        credits: formData.credits,
        status: 'activo',
      });

      showToast('Materia agregada exitosamente', 'success');
      setFormData({ name: '', code: '', description: '', credits: 3 });
      setErrors({});
      setShowAddModal(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error adding subject:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al agregar la materia';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const toggleSubjectSelection = (id: string) => {
    const next = new Set(selectedSubjects);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSubjects(next);
  };

  const showConfirmation = (
    type: 'delete' | 'delete-multiple',
    onConfirm: () => void,
    subjectName?: string
  ) => {
    const messages: Record<string, { title: string; message: string }> = {
      delete: {
        title: 'Eliminar materia',
        message: `¿Estás seguro de que deseas eliminar ${subjectName}? Esta acción no se puede deshacer.`,
      },
      'delete-multiple': {
        title: 'Eliminar materias',
        message: `¿Estás seguro de que deseas eliminar ${selectedSubjects.size} materia(s)? Esta acción no se puede deshacer.`,
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

  const handleDeleteSubject = async (id: string) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;
    showConfirmation('delete', async () => {
      setIsConfirmLoading(true);
      try {
        await subjects.delete(id);
        showToast('Materia eliminada exitosamente', 'success');
        fetchSubjects();
        setSelectedSubjects(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (error) {
        console.error('Error deleting subject:', error);
        showToast('Error al eliminar la materia', 'error');
      } finally {
        setIsConfirmLoading(false);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    }, subject.name);
  };

  const handleDeleteMultiple = () => {
    if (selectedSubjects.size === 0) return;
    showConfirmation('delete-multiple', async () => {
      setIsConfirmLoading(true);
      try {
        const ids = Array.from(selectedSubjects);
        // Delete subjects one by one since API doesn't support bulk delete
        for (const id of ids) {
          await subjects.delete(id);
        }
        showToast(`${ids.length} materia(s) eliminada(s) exitosamente`, 'success');
        fetchSubjects();
        setSelectedSubjects(new Set());
      } catch (error) {
        console.error('Error deleting subjects:', error);
        showToast('Error al eliminar las materias', 'error');
      } finally {
        setIsConfirmLoading(false);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Agregar Materia</span>
            </button>
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
          {selectedSubjects.size > 0 && (
            <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-3 z-10 shadow-md">
              <div className="text-center">
                <p className="text-xs text-gray-600">Seleccionados</p>
                <p className="text-lg font-bold text-red-600">{selectedSubjects.size}</p>
              </div>
              <button
                onClick={handleDeleteMultiple}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
              >
                <Trash2 size={16} />
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
                          setSelectedSubjects(new Set(filteredSubjects.map(s => s.id)));
                        } else {
                          setSelectedSubjects(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Créditos
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <p className="text-sm">No se encontraron materias</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedSubjects.has(subject.id)}
                          onChange={() => toggleSubjectSelection(subject.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{subject.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                          {subject.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <p className="text-sm truncate max-w-xs">{subject.description || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                          {subject.credits}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            subject.status === 'activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subject.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === subject.id ? null : subject.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>
                          {openMenuId === subject.id && (
                            <div className="absolute right-0 mt-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setEditingSubjectId(subject.id);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center space-x-2 transition-colors text-gray-700 font-semibold border-b border-gray-100"
                              >
                                <Edit2 size={16} className="text-blue-600" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteSubject(subject.id);
                                }}
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
                  ))
                )}
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
            Todas ({subjects.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'activo'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Activas ({subjects.filter(s => s.status === 'activo').length})
          </button>
          <button
            onClick={() => setStatusFilter('inactivo')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'inactivo'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Inactivas ({subjects.filter(s => s.status === 'inactivo').length})
          </button>
        </div>
      </div>

      {/* Modal para agregar materia */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Agregar Materia</h2>
                <p className="text-sm text-gray-500">Por favor llena los campos solicitados</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setErrors({});
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ej: Matemáticas Básicas"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">⚠️ {errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, code: e.target.value }));
                    if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
                  }}
                  placeholder="Ej: MAT101"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.code
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.code && (
                  <p className="text-xs text-red-500 mt-1">⚠️ {errors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la materia..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Créditos
                </label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }));
                    if (errors.credits) setErrors(prev => ({ ...prev, credits: '' }));
                  }}
                  min="1"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.credits
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.credits && (
                  <p className="text-xs text-red-500 mt-1">⚠️ {errors.credits}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setErrors({});
                }}
                className="px-8 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSubject}
                disabled={isLoading}
                className="px-8 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Guardando...' : 'Guardar Materia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubjectId && (
        <EditSubjectModal
          subjectId={editingSubjectId}
          onClose={() => setEditingSubjectId(null)}
          onSuccess={() => {
            setEditingSubjectId(null);
            fetchSubjects();
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
        confirmText={confirmationModal.type === 'delete' || confirmationModal.type === 'delete-multiple' ? 'Eliminar' : 'Confirmar'}
      />
    </Layout>
  );
}
