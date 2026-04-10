import { useEffect, useState } from 'react';
import { users, API_BASE_URL, sessionSettings } from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';
import { formatPhoneMask, isValidPhone } from '../lib/validators';

interface UserProfile {
  id: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string | null;
  email: string;
  phone: string | null;
  role: 'tutor' | 'admin';
  status: 'activo' | 'inactivo';
  createdAt: string;
}

export default function Profile() {
  const { user, keepSession, setKeepSession } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const data = await users.getCurrentUser();
      setProfile(data as UserProfile);
      setForm({
        firstName: data.firstName || '',
        paternalSurname: data.paternalSurname || '',
        maternalSurname: data.maternalSurname || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      const message = error instanceof Error ? error.message : 'No se pudo cargar tu perfil';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (form.phone.trim() && !isValidPhone(form.phone)) {
      showToast('Ingresa un teléfono válido (10 a 15 dígitos)', 'error');
      return;
    }

    setSaving(true);

    try {
      await users.update(profile.id, {
        firstName: form.firstName,
        paternalSurname: form.paternalSurname,
        maternalSurname: form.maternalSurname || null,
        phone: form.phone || undefined,
      });

      showToast('Perfil actualizado', 'success');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el perfil';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // For profile creation, we create a user record without password since user is already authenticated
      const userData = {
        user_id: user.id,
        first_name: '',
        paternal_surname: '',
        maternal_surname: null,
        email: user.email || '',
        phone: null,
        role: 'tutor',
        status: 'activo',
      };

      // Since users.create() requires password, we'll use a direct API call without password
      const token = sessionSettings.getValue('auth_token');
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.USERS.CREATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Error creating profile');
      }

      showToast('Perfil creado. Completa tus datos.', 'success');
      fetchProfile();
    } catch (error) {
      console.error('Error creating profile:', error);
      const message = error instanceof Error ? error.message : 'No se pudo crear el perfil';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <p className="text-sm text-gray-500">Revisa y actualiza los datos de tu perfil.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          {loading ? (
            <div className="text-center text-gray-600">Cargando perfil...</div>
          ) : !profile ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                No se encontró un perfil asociado a tu cuenta. Pulsa el botón para crear uno y luego podrás editarlo.
              </p>
              <button
                onClick={handleCreateProfile}
                disabled={saving}
                className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creando...' : 'Crear perfil'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido Paterno</label>
                  <input
                    type="text"
                    value={form.paternalSurname}
                    onChange={(e) => setForm((prev) => ({ ...prev, paternalSurname: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido Materno</label>
                  <input
                    type="text"
                    value={form.maternalSurname}
                    onChange={(e) => setForm((prev) => ({ ...prev, maternalSurname: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhoneMask(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="555-123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                  <input
                    type="text"
                    value={profile.role === 'admin' ? 'Administrador' : 'Representante'}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-900">Mantener sesión iniciada</p>
                    <p className="text-xs text-cyan-800/70">
                      Si está activado, la sesión permanece al cerrar y abrir el navegador.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={keepSession}
                    onClick={() => {
                      const nextValue = !keepSession;
                      setKeepSession(nextValue);
                      showToast(
                        nextValue
                          ? 'Sesión persistente activada'
                          : 'Sesión solo para esta pestaña activada',
                        'success'
                      );
                    }}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      keepSession ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        keepSession ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
