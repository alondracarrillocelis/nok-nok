import { useState } from 'react';
import { X } from 'lucide-react';
import { auth, users, API_BASE_URL } from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';
import { showToast } from './Toast';

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'info' | 'contact' | 'access';
type UserRole = 'tutor' | 'admin';

export default function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [role, setRole] = useState<UserRole>('tutor');
  const [formData, setFormData] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'tutor' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      showToast('Por favor ingresa el nombre', 'error');
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
    // La contraseña es opcional; si no se proporciona no intentamos crear un
    // usuario en Auth. Esto evita errores cuando el administrador está
    // autenticado y no puede llamar a signUp.
    if (formData.password) {
      if (formData.password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let authUser: any = null;

      // Si el usuario dejó contraseña, intentamos crear la cuenta de Auth usando la API
      if (formData.password) {
        try {
          authUser = await auth.register(formData.email, formData.password, formData.firstName);
        } catch (authError) {
          // Solo avisamos, no abortamos la creación del registro
          console.warn('Error al crear usuario Auth:', authError);
        }
      }

      // Crear el registro de usuario usando llamada directa a la API
      const token = localStorage.getItem('auth_token');
      const userData = {
        user_id: authUser?.user?.id || null,
        first_name: formData.firstName,
        paternal_surname: formData.paternalSurname,
        maternal_surname: formData.maternalSurname,
        email: formData.email,
        phone: formData.phone,
        role: role,
        status: 'activo',
      };

      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.USERS.CREATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el usuario');
      }

      showToast(`${role === 'admin' ? 'Administrador' : 'Tutor'} agregado exitosamente`, 'success');
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
              onClick={onClose}
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
                    👨‍🏫 Tutor
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
                    ⚙️ Administrador
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
                  onChange={(e) => updateField('phone', e.target.value)}
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
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres. Dejar en blanco si no quieres configurar acceso ahora.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
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
                  handleSubmit();
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
    </div>
  );
}
