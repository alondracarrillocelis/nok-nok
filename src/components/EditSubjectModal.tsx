import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { subjects } from '../lib/api';
import ConfirmationModal from './ConfirmationModal';
import { showToast } from './Toast';

interface EditSubjectModalProps {
  subjectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSubjectModal({ subjectId, onClose, onSuccess }: EditSubjectModalProps) {
  const initialFormData = {
    name: '',
    code: '',
    description: '',
    credits: 0,
    status: 'active' as 'active' | 'inactive',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [savedFormData, setSavedFormData] = useState(initialFormData);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(savedFormData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedChangesConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const data = await subjects.getById(subjectId);
        if (data) {
          const formValues: typeof initialFormData = {
            name: data.name || '',
            code: data.code || '',
            description: data.description || '',
            credits: data.credits ?? 0,
            status: data.status === 'inactive' ? 'inactive' : 'active',
          };
          setFormData(formValues);
          setSavedFormData(formValues);
        }
      } catch (error) {
        console.error('Error fetching subject:', error);
        showToast('Error al cargar la materia', 'error');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubject();
  }, [subjectId, onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.code.trim()) newErrors.code = 'El código es obligatorio';
    if (formData.credits < 0) newErrors.credits = 'Los créditos no pueden ser negativos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await subjects.update(subjectId, {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        credits: formData.credits,
        status: formData.status,
      });
      showToast('Materia actualizada exitosamente', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating subject:', error);
      const msg = error instanceof Error ? error.message : 'Error al actualizar la materia';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Cargando materia...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Materia</h2>
            <p className="text-sm text-gray-500">Actualiza los datos de la materia</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Matemáticas Básicas"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="Ej: MAT101"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                errors.code ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción de la materia..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Créditos</label>
            <input
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
              min={0}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                errors.credits ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
              }`}
            />
            {errors.credits && <p className="text-xs text-red-500 mt-1">{errors.credits}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-8 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

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
