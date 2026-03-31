import { useEffect, useState, lazy, Suspense } from 'react';
import { Search, Plus, MoreVertical, RefreshCw } from 'lucide-react';
import { users as usersApi } from '../lib/api';
import Layout from '../components/Layout';
const AddUserModal = lazy(() => import('../components/AddUserModal'));
import ConfirmationModal from '../components/ConfirmationModal';
import { showToast } from '../components/Toast';
import { formatPhoneMask, isValidPhone } from '../lib/validators';

interface User {
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

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'tutor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    role: 'tutor' as 'tutor' | 'admin',
    status: 'activo' as 'activo' | 'inactivo',
    phone: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
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
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar los usuarios';
      showToast(message, 'error');
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(u =>
        `${u.firstName} ${u.paternalSurname} ${u.maternalSurname ?? ''} ${u.email}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const toggleUserSelection = (id: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedUsers(newSelection);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tutor':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'tutor':
        return 'Tutor';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      status: user.status,
      phone: user.phone || '',
    });
    setOpenMenuId(null);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;

    if (editForm.phone.trim() && !isValidPhone(editForm.phone)) {
      showToast('Ingresa un teléfono válido (10 a 15 dígitos)', 'error');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'edit',
      title: 'Guardar cambios de usuario',
      message: `¿Deseas guardar los cambios de ${editingUser.firstName} ${editingUser.paternalSurname}?`,
      confirmText: 'Guardar cambios',
      onConfirm: async () => {
        setIsSavingEdit(true);
        try {
          await usersApi.update(editingUser.id, {
            role: editForm.role,
            status: editForm.status,
            phone: editForm.phone,
          });
          showToast('Usuario actualizado exitosamente', 'success');
          setEditingUser(null);
          await fetchUsers();
        } catch (error) {
          console.error('Error updating user:', error);
          const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
          showToast(message, 'error');
        } finally {
          setIsSavingEdit(false);
        }
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors shadow-lg"
            >
              <Plus size={20} />
              <span>Agregar Usuario</span>
            </button>
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
              Recargar
            </button>
          </div>

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

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
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
                          setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                        } else {
                          setSelectedUsers(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Correo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Fecha de alta
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <p className="text-sm">No se encontraron usuarios</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-blue-600">
                            {user.firstName} {user.paternalSurname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.maternalSurname || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">
                          {user.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                          {user.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>
                        {openMenuId === user.id && (
                          <div className="absolute right-6 mt-0 w-44 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                            <button
                              onClick={() => openEditModal(user)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 font-semibold border-b border-gray-100"
                            >
                              Editar usuario
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmationModal({
                                  isOpen: true,
                                  type: 'edit',
                                  title: user.status === 'activo' ? 'Desactivar usuario' : 'Activar usuario',
                                  message: `¿Deseas ${user.status === 'activo' ? 'desactivar' : 'activar'} a ${user.firstName} ${user.paternalSurname}?`,
                                  confirmText: user.status === 'activo' ? 'Desactivar' : 'Activar',
                                  onConfirm: async () => {
                                    try {
                                      await usersApi.update(user.id, {
                                        status: user.status === 'activo' ? 'inactivo' : 'activo',
                                      });
                                      showToast('Estado actualizado', 'success');
                                      await fetchUsers();
                                    } catch (error) {
                                      const message = error instanceof Error ? error.message : 'Error al cambiar estado';
                                      showToast(message, 'error');
                                    }
                                  },
                                });
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 font-semibold"
                            >
                              {user.status === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              roleFilter === 'all'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('tutor')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              roleFilter === 'tutor'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tutores ({users.filter(u => u.role === 'tutor').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              roleFilter === 'admin'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Administradores ({users.filter(u => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos estados ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'activo'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Activos ({users.filter(u => u.status === 'activo').length})
          </button>
          <button
            onClick={() => setStatusFilter('inactivo')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'inactivo'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Inactivos ({users.filter(u => u.status === 'inactivo').length})
          </button>
        </div>
      </div>

      {showAddModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-3xl p-8"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div></div>}>
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchUsers();
              showToast('Usuario agregado exitosamente', 'success');
            }}
          />
        </Suspense>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Editar Usuario</h2>
                <p className="text-sm text-gray-500">Actualiza rol, estado o teléfono</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <p className="text-sm text-gray-900">{editingUser.firstName} {editingUser.paternalSurname}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value as 'tutor' | 'admin' }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="tutor">Tutor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as 'activo' | 'inactivo' }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: formatPhoneMask(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="555-123-4567"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setEditingUser(null)}
                className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveUserChanges}
                disabled={isSavingEdit}
                className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
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
        isLoading={isConfirmLoading || isSavingEdit}
        onCancel={() => setConfirmationModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setIsConfirmLoading(true);
          try {
            await confirmationModal.onConfirm();
            setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
          } finally {
            setIsConfirmLoading(false);
          }
        }}
      />
    </Layout>
  );
}
