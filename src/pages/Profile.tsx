import { useEffect, useState } from 'react';
import { users } from '../lib/api';
import { API_BASE_URL, ENDPOINTS } from '../constants/endpoints';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string | null;
  email: string;
  phone: string | null;
  role: 'tutor' | 'admin';
  status: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const { user } = useAuth();
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
      setProfile(data);
      setForm({
        firstName: data.first_name || '',
        paternalSurname: data.paternal_surname || '',
        maternalSurname: data.maternal_surname || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('No se pudo cargar tu perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      await users.update(profile.id, {
        first_name: form.firstName,
        paternal_surname: form.paternalSurname,
        maternal_surname: form.maternalSurname || null,
        phone: form.phone || null,
      });

      showToast('Perfil actualizado', 'success');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('No se pudo actualizar el perfil', 'error');
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
      const token = localStorage.getItem('auth_token');
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
      showToast('No se pudo crear el perfil', 'error');
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
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    value={profile.role === 'admin' ? 'Administrador' : 'Tutor'}
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
                  />
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
