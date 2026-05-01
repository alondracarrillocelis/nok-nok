import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, Eye } from 'lucide-react';
import {
  programs as programsApi,
  Program as ApiProgram,
  subjects as subjectsApi,
  Subject as ApiSubject,
} from '../lib/api';
import Layout from '../components/Layout';
import ConfirmationModal from '../components/ConfirmationModal';
import { showToast } from '../components/Toast';

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  status?: 'active' | 'inactive';
}

const UUID_PATTERN = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

const newSubjectFormInitial = {
  name: '',
  code: '',
  description: '',
  credits: 0,
  status: 'active' as 'active' | 'inactive',
};

export default function Programs() {
  const [subjectCatalog, setSubjectCatalog] = useState<SubjectOption[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showViewSubjectsModal, setShowViewSubjectsModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [programSaving, setProgramSaving] = useState(false);
  const [assigningSubject, setAssigningSubject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  const [subjectCreationContext, setSubjectCreationContext] = useState<'catalog' | 'program-form' | 'selected-program'>('catalog');

  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    selectedSubjectIds: [] as string[],
  });
  const [assignSubjectId, setAssignSubjectId] = useState('');

  const [newSubjectForm, setNewSubjectForm] = useState(newSubjectFormInitial);

  useEffect(() => {
    void fetchCatalog();
  }, []);

  useEffect(() => {
    if (programs.length === 0) {
      setSelectedProgramId(null);
      return;
    }

    if (!selectedProgramId || !programs.some((program) => program.id === selectedProgramId)) {
      setSelectedProgramId(programs[0].id);
    }
  }, [programs, selectedProgramId]);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const [subjectsResponse, programsResponse] = await Promise.all([
        subjectsApi.list(),
        programsApi.list(),
      ]);

      setSubjectCatalog(normalizeSubjects(subjectsResponse));
      setPrograms(programsResponse);
    } catch (error) {
      console.error('Error fetching programs catalog:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar programas y materias';
      showToast(message, 'error');
      setSubjectCatalog([]);
      setPrograms([]);
      setSelectedProgramId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrograms = useMemo(() => {
    if (!searchTerm.trim()) return programs;
    const lower = searchTerm.toLowerCase();
    return programs.filter((program) => `${program.name} ${program.description}`.toLowerCase().includes(lower));
  }, [programs, searchTerm]);

  const selectedProgram = useMemo(() => {
    return programs.find((program) => program.id === selectedProgramId) || null;
  }, [programs, selectedProgramId]);

  const availableSubjectsToAssign = useMemo(() => {
    if (!selectedProgram) return [];

    const assignedSubjectIds = new Set(selectedProgram.subjects.map((subject) => subject.id));

    return subjectCatalog.filter(
      (subject) => subject.status !== 'inactive' && UUID_PATTERN.test(subject.id) && !assignedSubjectIds.has(subject.id)
    );
  }, [selectedProgram, subjectCatalog]);

  const availableSubjectsForProgramForm = useMemo(() => {
    return subjectCatalog.filter((subject) => subject.status !== 'inactive' && UUID_PATTERN.test(subject.id));
  }, [subjectCatalog]);

  const resetSubjectModal = () => {
    setShowAddSubjectModal(false);
    setEditingSubjectId(null);
    setNewSubjectForm(newSubjectFormInitial);
    setSubjectCreationContext('catalog');
  };

  const resetProgramModal = () => {
    setShowAddProgramModal(false);
    setProgramForm({ name: '', description: '', selectedSubjectIds: [] });
  };

  const resetAssignSubjectModal = () => {
    setShowAssignSubjectModal(false);
    setAssignSubjectId('');
  };

  const resetViewSubjectsModal = () => {
    setShowViewSubjectsModal(false);
  };

  const openEditSubjectModal = (subject: SubjectOption) => {
    setEditingSubjectId(subject.id);
    setNewSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      credits: subject.credits,
      status: subject.status || 'active',
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
            await subjectsApi.update(editingSubjectId, {
              name: newSubjectForm.name.trim(),
              code: newSubjectForm.code.trim(),
              description: newSubjectForm.description.trim(),
              credits: newSubjectForm.credits,
              status: newSubjectForm.status,
            });
            showToast('Materia actualizada exitosamente', 'success');
          } else {
            const createdSubject = await subjectsApi.create({
              name: newSubjectForm.name.trim(),
              code: newSubjectForm.code.trim(),
              description: newSubjectForm.description.trim(),
              credits: newSubjectForm.credits,
              status: newSubjectForm.status,
            });

            if (subjectCreationContext === 'program-form') {
              setProgramForm((prev) => ({
                ...prev,
                selectedSubjectIds: prev.selectedSubjectIds.includes(createdSubject.id)
                  ? prev.selectedSubjectIds
                  : [...prev.selectedSubjectIds, createdSubject.id],
              }));
            }

            if (subjectCreationContext === 'selected-program' && selectedProgram) {
              await programsApi.addSubject(selectedProgram.id, createdSubject.id);
              resetAssignSubjectModal();
            }

            if (onCreated) onCreated(createdSubject.id);
            showToast(
              subjectCreationContext === 'selected-program'
                ? 'Materia agregada y asignada al programa'
                : subjectCreationContext === 'program-form'
                  ? 'Materia agregada y lista para el nuevo programa'
                  : 'Materia agregada exitosamente',
              'success'
            );
          }

          resetSubjectModal();
          await fetchCatalog();
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

  const createProgram = () => {
    if (!programForm.name.trim()) {
      showToast('El nombre del programa es obligatorio', 'error');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'add',
      title: 'Agregar programa',
      message: '¿Deseas agregar este programa al catálogo?',
      confirmText: 'Agregar programa',
      onConfirm: async () => {
        setProgramSaving(true);
        try {
          const createdProgram = await programsApi.create({
            name: programForm.name.trim(),
            description: programForm.description.trim(),
            status: 'active',
          });

          if (programForm.selectedSubjectIds.length > 0) {
            await Promise.all(
              programForm.selectedSubjectIds.map((subjectId) => programsApi.addSubject(createdProgram.id, subjectId))
            );
          }

          showToast(
            programForm.selectedSubjectIds.length > 0
              ? 'Programa agregado con materias asignadas'
              : 'Programa agregado exitosamente',
            'success'
          );
          resetProgramModal();
          await fetchCatalog();
          setSelectedProgramId(createdProgram.id);
        } catch (error) {
          console.error('Error creating program:', error);
          const message = error instanceof Error ? error.message : 'Error al crear el programa';
          showToast(message, 'error');
        } finally {
          setProgramSaving(false);
        }
      },
    });
  };

  const handleProgramStatusChange = (program: ApiProgram) => {
    const nextStatus = program.status === 'inactive' ? 'active' : 'inactive';

    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: nextStatus === 'inactive' ? 'Dar de baja programa' : 'Reactivar programa',
      message:
        nextStatus === 'inactive'
          ? `¿Deseas confirmar la baja de ${program.name}?`
          : `¿Deseas reactivar ${program.name}?`,
      confirmText: nextStatus === 'inactive' ? 'Confirmar baja' : 'Reactivar',
      onConfirm: async () => {
        await programsApi.update(program.id, { status: nextStatus });
        showToast(
          nextStatus === 'inactive' ? 'Programa dado de baja exitosamente' : 'Programa reactivado exitosamente',
          'success'
        );
        await fetchCatalog();
      },
    });
  };

  const handleSubjectDrop = (subject: SubjectOption) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: 'Dar de baja materia',
      message: `¿Deseas confirmar la baja de ${subject.name}? La materia conservará su registro y cambiará a inactiva.`,
      confirmText: 'Confirmar baja',
      onConfirm: async () => {
        await subjectsApi.update(subject.id, { status: 'inactive' });
        showToast('Materia dada de baja exitosamente', 'success');
        resetSubjectModal();
        await fetchCatalog();
      },
    });
  };

  const openAssignSubjectModal = () => {
    if (!selectedProgram) {
      showToast('Selecciona un programa primero', 'error');
      return;
    }

    if (availableSubjectsToAssign.length === 0) {
      showToast('No hay materias disponibles para asignar', 'error');
      return;
    }

    setAssignSubjectId(availableSubjectsToAssign[0].id);
    setShowAssignSubjectModal(true);
  };

  const toggleProgramFormSubject = (subjectId: string) => {
    setProgramForm((prev) => ({
      ...prev,
      selectedSubjectIds: prev.selectedSubjectIds.includes(subjectId)
        ? prev.selectedSubjectIds.filter((id) => id !== subjectId)
        : [...prev.selectedSubjectIds, subjectId],
    }));
  };

  const assignSubjectToProgram = async () => {
    if (!selectedProgram || !assignSubjectId) {
      showToast('Selecciona una materia para asignar', 'error');
      return;
    }

    if (!UUID_PATTERN.test(assignSubjectId)) {
      showToast('La materia seleccionada no tiene un ID válido para el API', 'error');
      return;
    }

    setAssigningSubject(true);
    try {
      await programsApi.addSubject(selectedProgram.id, assignSubjectId);
      showToast('Materia asignada al programa', 'success');
      resetAssignSubjectModal();
      await fetchCatalog();
    } catch (error) {
      console.error('Error assigning subject to program:', error);
      const message = error instanceof Error ? error.message : 'Error al asignar materia al programa';
      showToast(message, 'error');
    } finally {
      setAssigningSubject(false);
    }
  };

  const removeSubjectFromProgram = (program: ApiProgram, subjectId: string, subjectName: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      title: 'Quitar materia del programa',
      message: `¿Deseas quitar ${subjectName} de ${program.name}?`,
      confirmText: 'Quitar materia',
      onConfirm: async () => {
        await programsApi.removeSubject(program.id, subjectId);
        showToast('Materia removida del programa', 'success');
        await fetchCatalog();
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Programas</h1>
            <p className="text-sm text-gray-600">Catálogo activo de programas y materias</p>
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
              onClick={() => {
                setSubjectCreationContext('catalog');
                setShowAddSubjectModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Agregar Materia
            </button>
            <button
              onClick={() => setShowViewSubjectsModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              <Eye size={18} />
              Ver Materias
            </button>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
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
                        ? program.status === 'inactive'
                          ? 'bg-red-500 text-white'
                          : 'bg-green-600 text-white'
                        : program.status === 'inactive'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {program.name} ({program.subjects.length})
                  </button>
                ))
              )}
            </div>

            {!selectedProgram ? (
              <div className="h-full min-h-[380px] flex items-center justify-center text-gray-500">
                {isLoading ? 'Cargando programas...' : 'Selecciona un programa para ver sus materias.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedProgram.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedProgram.description || 'Sin descripción'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openAssignSubjectModal}
                      disabled={availableSubjectsToAssign.length === 0}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Asignar materia
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProgramStatusChange(selectedProgram)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                        selectedProgram.status === 'inactive'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <Trash2 size={16} />
                      {selectedProgram.status === 'inactive' ? 'Reactivar programa' : 'Dar de baja programa'}
                    </button>
                    <div
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        selectedProgram.status === 'inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedProgram.status === 'inactive' ? 'Baja' : 'Activo'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {selectedProgram.subjects.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 border border-dashed rounded-xl border-gray-300">
                      Este programa no tiene materias asignadas aún.
                    </div>
                  ) : (
                    selectedProgram.subjects.map((subject) => {
                      const catalogSubject = subjectCatalog.find((item) => item.id === subject.id);

                      return (
                        <div
                          key={subject.id}
                          className={`rounded-xl border p-4 transition-colors ${
                            catalogSubject?.status === 'inactive'
                              ? 'border-red-200 bg-red-50/70'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{subject.name}</p>
                              <p className="text-xs text-gray-500">{catalogSubject?.description || 'Sin descripción'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {catalogSubject && (
                                <button
                                  type="button"
                                  onClick={() => openEditSubjectModal(catalogSubject)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                                  title="Editar materia"
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeSubjectFromProgram(selectedProgram, subject.id, subject.name)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                Quitar
                              </button>
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-800">{subject.code}</span>
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  catalogSubject?.status === 'inactive'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {catalogSubject?.status === 'inactive' ? 'Baja' : 'Activa'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
              </div>
              <button onClick={resetProgramModal} className="text-gray-500 hover:text-gray-800 text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del programa</label>
                <input
                  type="text"
                  value={programForm.name}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: Programa Kids 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={programForm.description}
                  onChange={(event) => setProgramForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Descripción breve del programa"
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Asignar materias al programa</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona materias existentes o crea una nueva y quedará marcada automáticamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectCreationContext('program-form');
                      setShowAddSubjectModal(true);
                    }}
                    className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                  >
                    Crear materia
                  </button>
                </div>

                <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {availableSubjectsForProgramForm.length > 0 ? (
                    availableSubjectsForProgramForm.map((subject) => {
                      const isSelected = programForm.selectedSubjectIds.includes(subject.id);

                      return (
                        <label
                          key={subject.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                            isSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProgramFormSubject(subject.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-gray-900">{subject.name}</span>
                              <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">{subject.code}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{subject.description || 'Sin descripción'}</p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
                      No hay materias activas en el catálogo. Crea una para asignarla al programa.
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs font-medium text-gray-600">
                  {programForm.selectedSubjectIds.length} materia(s) seleccionada(s)
                </p>
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={resetProgramModal}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createProgram}
                disabled={programSaving}
                className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {programSaving ? 'Guardando...' : 'Guardar Programa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewSubjectsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Materias Disponibles</h2>
                <p className="text-sm text-gray-600 mt-1">Catálogo completo de todas las materias</p>
              </div>
              <button
                onClick={resetViewSubjectsModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {subjectCatalog.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border border-dashed rounded-xl border-gray-300">
                  No hay materias en el catálogo.
                </div>
              ) : (
                subjectCatalog.map((subject) => {
                    const isAssignedToSelectedProgram = selectedProgram?.subjects.some((s) => s.id === subject.id);

                    return (
                      <div
                        key={subject.id}
                        className={`rounded-xl border p-4 transition-colors ${
                          subject.status === 'inactive'
                            ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{subject.description || 'Sin descripción'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-800">
                                Código: {subject.code}
                              </span>
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-800">
                                Créditos: {subject.credits}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProgram && isAssignedToSelectedProgram && (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800">
                                Asignada
                              </span>
                            )}
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-full ${
                                subject.status === 'inactive'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {subject.status === 'inactive' ? 'Baja' : 'Activa'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSubjectDrop(subject)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                subject.status === 'inactive'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                              title={subject.status === 'inactive' ? 'Activar materia' : 'Desactivar materia'}
                            >
                              {subject.status === 'inactive' ? 'Activar' : 'Desactivar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditSubjectModal(subject)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                              title="Editar materia"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setSubjectCreationContext('catalog');
                  setShowAddSubjectModal(true);
                }}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Agregar Materia
              </button>
              <button
                onClick={resetViewSubjectsModal}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignSubjectModal && selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Asignar Materia</h2>
                <p className="text-sm text-gray-600">Selecciona una materia para asignarla a {selectedProgram.name}</p>
              </div>
              <button onClick={resetAssignSubjectModal} className="text-gray-500 hover:text-gray-800 text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Materia disponible</label>
                {availableSubjectsToAssign.length > 0 ? (
                  <select
                    value={assignSubjectId}
                    onChange={(event) => setAssignSubjectId(event.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableSubjectsToAssign.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} · {subject.code}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    No hay materias disponibles para asignar.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                <p>Si la materia no existe en el catálogo, puedes crearla desde aquí y quedará asignada automáticamente.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSubjectCreationContext('selected-program');
                    setShowAddSubjectModal(true);
                  }}
                  className="mt-3 rounded-full bg-blue-100 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-200"
                >
                  Crear y asignar materia
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={resetAssignSubjectModal}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void assignSubjectToProgram()}
                disabled={assigningSubject || !assignSubjectId}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {assigningSubject ? 'Asignando...' : 'Asignar materia'}
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
                <p className="text-sm text-gray-600">
                  {subjectCreationContext === 'selected-program'
                    ? 'La materia nueva se asignará automáticamente al programa actual.'
                    : subjectCreationContext === 'program-form'
                      ? 'La materia nueva quedará seleccionada para el programa que estás creando.'
                      : 'Edita o agrega materias del catálogo.'}
                </p>
              </div>
              <button onClick={resetSubjectModal} className="text-gray-500 hover:text-gray-800 text-xl">×</button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={newSubjectForm.name}
                onChange={(event) => setNewSubjectForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nombre de materia"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
              <input
                type="text"
                value={newSubjectForm.code}
                onChange={(event) => setNewSubjectForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="Código"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
              <textarea
                value={newSubjectForm.description}
                onChange={(event) => setNewSubjectForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                placeholder="Descripción"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Créditos</label>
                  <input
                    type="number"
                    min={0}
                    value={newSubjectForm.credits}
                    onChange={(event) =>
                      setNewSubjectForm((prev) => ({
                        ...prev,
                        credits: Math.max(0, Number(event.target.value || 0)),
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                  <select
                    value={newSubjectForm.status}
                    onChange={(event) =>
                      setNewSubjectForm((prev) => ({
                        ...prev,
                        status: event.target.value as 'active' | 'inactive',
                      }))
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
              </div>
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
                onClick={resetSubjectModal}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void saveSubject()}
                disabled={subjectSaving}
                className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
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

function normalizeSubjects(response: ApiSubject[] | { data?: ApiSubject[] }) {
  const list = Array.isArray(response)
    ? response
    : Array.isArray(response.data)
      ? response.data
      : [];

  return list.map((subject) => ({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description || '',
    credits: subject.credits ?? 0,
    status: subject.status || 'active',
  }));
}