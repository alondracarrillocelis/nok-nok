import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Bot, Settings, LogOut, Book } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from './BrandLogo';
import ConfirmationModal from './ConfirmationModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BrandLogo size="md" />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`p-3 rounded-full transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Inicio"
                >
                  <Home size={20} />
                </button>
                <button
                  onClick={() => navigate('/students')}
                  className={`p-3 rounded-full transition-colors ${
                    location.pathname === '/students'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Alumnos"
                >
                  <Bot size={20} />
                </button>
                <button
                  onClick={() => navigate('/subjects')}
                  className={`p-3 rounded-full transition-colors ${
                    location.pathname === '/subjects'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Materias"
                >
                  <Book size={20} />
                </button>
                <button
                  onClick={() => navigate('/users')}
                  className={`p-3 rounded-full transition-colors ${
                    location.pathname === '/users'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Usuarios"
                >
                  <Users size={20} />
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className={`p-3 rounded-full transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Configuración"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-3 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        type="info"
        title="Cerrar sesión"
        message="¿Deseas salir de tu sesión actual?"
        confirmText="Cerrar sesión"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          void handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
