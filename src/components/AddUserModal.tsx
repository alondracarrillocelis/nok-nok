import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { users as usersApi } from '../lib/api';
import { showToast } from './Toast';
import { formatPhoneMask, isValidPhone } from '../lib/validators';
import ConfirmationModal from './ConfirmationModal';

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'info' | 'contact' | 'access';
type UserRole = 'tutor' | 'admin';

export default function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [role, setRole] = useState<UserRole>('tutor');
  const initialFormData = {
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'tutor' as UserRole,
  };
  const [formData, setFormData] = useState(initialFormData);
  const [savedFormData] = useState(initialFormData);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      showToast('Por favor ingresa el nombre', 'error');
      return false;
    }
    if (!formData.paternalSurname.trim()) {
      showToast('Por favor ingresa el apellido paterno', 'error');
      return false;
    }
    if (!formData.email.trim()) {
      showToast('Por favor ingresa el correo electrónico', 'error');
      return false;
    }
    if (!formData.email.includes('@')) {
      showToast('Por favor ingresa un correo válido', 'error');
      return false;
    }
    if (!formData.phone.trim()) {
      showToast('Por favor ingresa el teléfono', 'error');
      return false;
    }
    if (!isValidPhone(formData.phone)) {
      showToast('Por favor ingresa un teléfono válido (10 a 15 dígitos)', 'error');
      return false;
    }
    if (!formData.password) {
      showToast('La contraseña es obligatoria', 'error');
      return false;
    }
    if (formData.password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres', 'error');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setShowSubmitConfirm(true);
  };

  const performSubmit = async () => {
    setIsLoading(true);
    try {
      await usersApi.create({
        firstName: formData.firstName,
        paternalSurname: formData.paternalSurname,
        maternalSurname: formData.maternalSurname || '',
        email: formData.email,
        password: formData.password,
        phone: formData.phone || '',
        role,
      });

      showToast(`${role === 'admin' ? 'Administrador' : 'Representante'} agregado exitosamente`, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el usuario';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'info', label: 'Información Personal' },
    { id: 'contact', label: 'Contacto' },
    { id: 'access', label: 'Acceso' },
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
                  ? 'bg-green-500 text-white'
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
              <h2 className="text-2xl font-bold text-gray-900">Agregar Usuario</h2>
              <p className="text-sm text-gray-500">Por favor llena los campos solicitados</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {currentStep === 'info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Usuario
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setRole('tutor');
                      setFormData(prev => ({ ...prev, role: 'tutor' }));
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border-2 ${
                      role === 'tutor'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    Representante
                  </button>
                  <button
                    onClick={() => {
                      setRole('admin');
                      setFormData(prev => ({ ...prev, role: 'admin' }));
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border-2 ${
                      role === 'admin'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Juan"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellido Paterno
                  </label>
                  <input
                    type="text"
                    value={formData.paternalSurname}
                    onChange={(e) => updateField('paternalSurname', e.target.value)}
                    placeholder="Pérez"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
                    placeholder="García"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="juan@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', formatPhoneMask(e.target.value))}
                  placeholder="555-123-4567"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {currentStep === 'access' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres. Dejar en blanco si no quieres configurar acceso ahora.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-8 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const stepOrder: Step[] = ['info', 'contact', 'access'];
                const currentIndex = stepOrder.indexOf(currentStep);
                if (currentIndex < stepOrder.length - 1) {
                  setCurrentStep(stepOrder[currentIndex + 1]);
                } else {
                  void handleSubmit();
                }
              }}
              disabled={isLoading}
              className="px-8 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : currentStep === 'access' ? 'Guardar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSubmitConfirm}
        type="add"
        title="Confirmar alta de usuario"
        message="¿Deseas guardar este usuario con la información capturada?"
        confirmText="Guardar usuario"
        onConfirm={() => {
          setShowSubmitConfirm(false);
          void performSubmit();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
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
  );
}
