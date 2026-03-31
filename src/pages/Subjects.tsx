import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Layers3, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { subjects as subjectsApi } from '../lib/api';
import Layout from '../components/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import { showToast } from '../components/Toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  status?: 'activo' | 'inactivo';
}

interface Program {
  id: string;
  name: string;
  description: string;
  subjectIds: string[];
  status: 'activo' | 'baja';
}

const newSubjectFormInitial = {
  name: '',
  code: '',
  description: '',
};

export default function Subjects() {
  const [subjectCatalog, setSubjectCatalog] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'edit' | 'add' | 'info';
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    selectedSubjectIds: [] as string[],
  });

  const [newSubjectForm, setNewSubjectForm] = useState(newSubjectFormInitial);

  useEffect(() => {
    void fetchSubjectsCatalog();
  }, []);

  useEffect(() => {
    if (programs.length > 0 && !selectedProgramId) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  const fetchSubjectsCatalog = async () => {
    try {
      const response = await subjectsApi.list();
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as { data?: Subject[] }).data)
          ? (response as { data: Subject[] }).data
          : [];

      const normalized = list.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        description: s.description || '',
        status: s.status || 'activo',
      }));

      setSubjectCatalog(normalized);

      const initialPrograms: Program[] = [
        {
          id: 'prog-1',
          name: 'Programa Inicial',
          description: 'Vista preliminar de estructura de programa',
          subjectIds: normalized.map((s) => s.id),
          status: 'activo',
        },
        {
          id: 'prog-2',
          name: 'Programa Avanzado',
          description: 'Vista preliminar para alumnos avanzados',
          subjectIds: normalized.map((s) => s.id),
          status: 'activo',
        },
      ];

      setPrograms(initialPrograms);
      setSelectedProgramId(initialPrograms[0]?.id ?? null);
    } catch (error) {
      console.error('Error fetching subjects catalog:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar el catálogo de materias';
      showToast(message, 'error');
      setSubjectCatalog([]);
      setPrograms([]);
      setSelectedProgramId(null);
    }
  };

  const filteredPrograms = useMemo(() => {
    if (!searchTerm.trim()) return programs;
    const lower = searchTerm.toLowerCase();
    return programs.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(lower));
  }, [programs, searchTerm]);

  const selectedProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId) || null;
  }, [programs, selectedProgramId]);

  const subjectsForSelectedProgram = useMemo(() => {
    if (!selectedProgram) return [];
    const byId = new Map(subjectCatalog.map((subject) => [subject.id, subject]));
    return selectedProgram.subjectIds
      .map((subjectId) => byId.get(subjectId))
      .filter((subject): subject is Subject => Boolean(subject));
  }, [selectedProgram, subjectCatalog]);

  const reorderSubjectsInProgram = (fromSubjectId: string, toSubjectId: string) => {
    if (!selectedProgramId || fromSubjectId === toSubjectId) return;

    setPrograms((prev) =>
      prev.map((program) => {
        if (program.id !== selectedProgramId) return program;

        const fromIndex = program.subjectIds.indexOf(fromSubjectId);
        const toIndex = program.subjectIds.indexOf(toSubjectId);
        if (fromIndex === -1 || toIndex === -1) return program;

        const nextIds = [...program.subjectIds];
        const [moved] = nextIds.splice(fromIndex, 1);
        nextIds.splice(toIndex, 0, moved);

        return { ...program, subjectIds: nextIds };
      })
    );
  };

  const toggleProgramSubject = (subjectId: string) => {
    setProgramForm((prev) => {
      const exists = prev.selectedSubjectIds.includes(subjectId);
      if (exists) {
        return {
          ...prev,
          selectedSubjectIds: prev.selectedSubjectIds.filter((id) => id !== subjectId),
        };
      }
      return {
        ...prev,
        selectedSubjectIds: [...prev.selectedSubjectIds, subjectId],
      };
    });
  };

  const resetSubjectModal = () => {
    setShowAddSubjectModal(false);
    setEditingSubjectId(null);
    setNewSubjectForm(newSubjectFormInitial);
  };

  const openEditSubjectModal = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setNewSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
    });
    setShowAddSubjectModal(true);
  };

  const saveSubject = async (onCreated?: (newId: string) => void) => {
    if (!newSubjectForm.name.trim() || !newSubjectForm.code.trim()) {
      showToast('Nombre y código de materia son obligatorios', 'error');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: editingSubjectId ? 'edit' : 'add',
      title: editingSubjectId ? 'Guardar cambios de materia' : 'Agregar materia',
      message: editingSubjectId
        ? '¿Deseas guardar los cambios de esta materia?'
        : '¿Deseas agregar esta materia al catálogo?',
      confirmText: editingSubjectId ? 'Guardar cambios' : 'Agregar materia',
      onConfirm: async () => {
        setSubjectSaving(true);
        try {
          if (editingSubjectId) {
            const updatedSubject = await subjectsApi.update(editingSubjectId, {
              name: newSubjectForm.name.trim(),
              code: newSubjectForm.code.trim(),
              description: newSubjectForm.description.trim(),
            });

            setSubjectCatalog((prev) => prev.map((subject) => (
              subject.id === editingSubjectId
                ? {
                    ...subject,
                    name: updatedSubject.name,
                    code: updatedSubject.code,
                    description: updatedSubject.description || '',
                    status: updatedSubject.status || 'activo',
                  }
                : subject
            )));
            showToast('Materia actualizada exitosamente', 'success');
          } else {
            const createdSubject = await subjectsApi.create({
              name: newSubjectForm.name.trim(),
              code: newSubjectForm.code.trim(),
              description: newSubjectForm.description.trim(),
              credits: 0,
              status: 'activo',
            });

            const normalizedSubject: Subject = {
              id: createdSubject.id,
              name: createdSubject.name,
              code: createdSubject.code,
              description: createdSubject.description || '',
              status: createdSubject.status || 'activo',
            };

            setSubjectCatalog((prev) => [...prev, normalizedSubject]);
            if (onCreated) onCreated(normalizedSubject.id);
            showToast('Materia agregada exitosamente', 'success');
          }

          resetSubjectModal();
        } catch (error) {
          console.error('Error saving subject:', error);
          const message = error instanceof Error ? error.message : 'Error al guardar la materia';
          showToast(message, 'error');
        } finally {
          setSubjectSaving(false);
        }
      },
    });
  };

  const createProgramLocally = () => {
    if (!programForm.name.trim()) {
      showToast('El nombre del programa es obligatorio', 'error');
      return;
    }

    const subjectIds =
      programForm.selectedSubjectIds.length > 0
        ? programForm.selectedSubjectIds
        : subjectCatalog.map((s) => s.id);

    setConfirmationModal({
      isOpen: true,
      type: 'add',
      title: 'Agregar programa',
      message: '¿Deseas agregar este programa a la vista previa actual?',
      confirmText: 'Agregar programa',
      onConfirm: () => {
        const newProgram: Program = {
          id: `program-${Date.now()}`,
          name: programForm.name.trim(),
          description: programForm.description.trim(),
          subjectIds,
          status: 'activo',
        };

        setPrograms((prev) => [newProgram, ...prev]);
        setSelectedProgramId(newProgram.id);
        setProgramForm({ name: '', description: '', selectedSubjectIds: [] });
        setShowAddProgramModal(false);
        showToast('Programa agregado localmente para vista previa', 'success');
      },
    });
  };

  const handleProgramStatusChange = (program: Program) => {
    if (program.status === 'baja') {
      setPrograms((prev) => prev.map((item) => (
        item.id === program.id ? { ...item, status: 'activo' } : item
      )));
      showToast('Programa reactivado en vista previa', 'success');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: 'Dar de baja programa',
      message: `¿Deseas confirmar la baja de ${program.name}? Esta acción solo aplica a la vista previa actual.`,
      confirmText: 'Confirmar baja',
      onConfirm: () => {
        setPrograms((prev) => prev.map((item) => (
          item.id === program.id ? { ...item, status: 'baja' } : item
        )));
        showToast('Programa dado de baja en vista previa', 'success');
      },
    });
  };

  const handleSubjectDrop = (subject: Subject) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: 'Dar de baja materia',
      message: `¿Deseas confirmar la baja de ${subject.name}? La materia conservará su registro y cambiará a inactiva.`,
      confirmText: 'Confirmar baja',
      onConfirm: async () => {
        const updatedSubject = await subjectsApi.update(subject.id, { status: 'inactivo' });
        setSubjectCatalog((prev) => prev.map((item) => (
          item.id === subject.id ? { ...item, status: updatedSubject.status || 'inactivo' } : item
        )));
        showToast('Materia dada de baja exitosamente', 'success');
        resetSubjectModal();
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Programas</h1>
            <p className="text-sm text-gray-600">Vista previa mock sin endpoint de programas</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddProgramModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              Agregar Programa
            </button>
            <button
              type="button"
              onClick={() => void fetchSubjectsCatalog()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
              Recargar
            </button>
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Agregar Materia
            </button>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar programa"
                className="pl-10 pr-4 py-2.5 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-5 bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {filteredPrograms.length === 0 ? (
                <div className="text-sm text-gray-500">No hay programas para mostrar.</div>
              ) : (
                filteredPrograms.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => setSelectedProgramId(program.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                      selectedProgramId === program.id
                        ? program.status === 'baja'
                          ? 'bg-red-500 text-white'
                          : 'bg-green-600 text-white'
                        : program.status === 'baja'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {program.name} ({program.subjectIds.length})
                  </button>
                ))
              )}
            </div>

            {!selectedProgram ? (
              <div className="h-full min-h-[380px] flex items-center justify-center text-gray-500">
                Selecciona un programa para ver sus materias.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedProgram.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedProgram.description || 'Sin descripción'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleProgramStatusChange(selectedProgram)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                        selectedProgram.status === 'baja'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <Trash2 size={16} />
                      {selectedProgram.status === 'baja' ? 'Reactivar programa' : 'Dar de baja programa'}
                    </button>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedProgram.status === 'baja'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedProgram.status === 'baja' ? 'Baja' : 'Activo'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    Materias mostradas para este programa. Puedes arrastrar y soltar para reordenar y usar el lápiz para editar o dar de baja.
                  </p>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {subjectsForSelectedProgram.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 border border-dashed rounded-xl border-gray-300">
                      Este programa no tiene materias asignadas aún.
                    </div>
                  ) : (
                    subjectsForSelectedProgram.map((subject) => (
                      <div
                        key={subject.id}
                        draggable
                        onDragStart={() => setDraggedSubjectId(subject.id)}
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!draggedSubjectId) return;
                          reorderSubjectsInProgram(draggedSubjectId, subject.id);
                          setDraggedSubjectId(null);
                        }}
                        onDragEnd={() => setDraggedSubjectId(null)}
                        className={`rounded-xl border p-4 transition-colors cursor-move ${
                          draggedSubjectId === subject.id
                            ? 'border-green-400 bg-green-50'
                            : subject.status === 'inactivo'
                              ? 'border-red-200 bg-red-50/70'
                              : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            <p className="text-xs text-gray-500">{subject.description || 'Sin descripción'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditSubjectModal(subject)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                              title="Editar materia"
                            >
                              <Pencil size={16} />
                            </button>
                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                              {subject.code}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              subject.status === 'inactivo'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {subject.status === 'inactivo' ? 'Baja' : 'Activa'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Agregar Programa</h2>
                <p className="text-sm text-gray-600">Asigna materias existentes o crea nuevas desde aquí (mock)</p>
              </div>
              <button
                onClick={() => setShowAddProgramModal(false)}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del programa</label>
                <input
                  type="text"
                  value={programForm.name}
                  onChange={(e) => setProgramForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Programa Kids 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={programForm.description}
                  onChange={(e) => setProgramForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Descripción breve del programa"
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">Asignar materias al programa</p>
                  <button
                    type="button"
                    onClick={() => void saveSubject((newId) => {
                      setProgramForm((prev) => ({
                        ...prev,
                        selectedSubjectIds: [...prev.selectedSubjectIds, newId],
                      }));
                    })}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    + Crear materia y asignar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newSubjectForm.name}
                    onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre materia"
                    className="px-3 py-2 rounded-lg border border-gray-300"
                  />
                  <input
                    type="text"
                    value={newSubjectForm.code}
                    onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="Código"
                    className="px-3 py-2 rounded-lg border border-gray-300"
                  />
                  <input
                    type="text"
                    value={newSubjectForm.description}
                    onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción"
                    className="px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg p-2">
                  {subjectCatalog.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No hay materias en catálogo.</div>
                  ) : (
                    subjectCatalog.map((subject) => (
                      <label key={subject.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={programForm.selectedSubjectIds.includes(subject.id)}
                          onChange={() => toggleProgramSubject(subject.id)}
                        />
                        <div className="flex items-center gap-2">
                          <Layers3 size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-800">{subject.name}</span>
                          <span className="text-xs text-gray-500">{subject.code}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddProgramModal(false)}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createProgramLocally}
                className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                Guardar Programa
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Agregar Materia</h2>
                <p className="text-sm text-gray-600">Edita o agrega materias del catálogo</p>
              </div>
              <button
                onClick={() => {
                  resetSubjectModal();
                }}
                className="text-gray-500 hover:text-gray-800 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={newSubjectForm.name}
                onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de materia"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
              <input
                type="text"
                value={newSubjectForm.code}
                onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="Código"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
              <textarea
                value={newSubjectForm.description}
                onChange={(e) => setNewSubjectForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Descripción"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              {editingSubjectId && (
                <button
                  type="button"
                  onClick={() => {
                    const subject = subjectCatalog.find((item) => item.id === editingSubjectId);
                    if (subject) {
                      handleSubjectDrop(subject);
                    }
                  }}
                  className="px-6 py-2 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200"
                >
                  Dar de baja
                </button>
              )}
              <button
                onClick={() => {
                  resetSubjectModal();
                }}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void saveSubject()}
                disabled={subjectSaving}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                {subjectSaving ? 'Guardando...' : editingSubjectId ? 'Guardar cambios' : 'Guardar materia'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        type={confirmationModal.type}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        isLoading={confirmLoading}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setConfirmLoading(true);
          try {
            await confirmationModal.onConfirm();
            setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
          } catch (error) {
            console.error('Error confirming subject/program action:', error);
            const message = error instanceof Error ? error.message : 'No se pudo completar la acción';
            showToast(message, 'error');
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
    </Layout>
  );
}
