import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Bot, Settings, LogOut, Book, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from './BrandLogo';
import ConfirmationModal from './ConfirmationModal';
import doodles from '../assets/Doodles.png';

interface LayoutProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'nok-nok-theme';

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', isDarkMode);
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navButtonClass = (isActive: boolean) => {
    if (isDarkMode) {
      return isActive
        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/30'
        : 'bg-slate-800 text-slate-200 hover:bg-slate-700';
    }

    return isActive
      ? 'bg-green-500 text-white'
      : 'bg-gray-200 text-gray-600 hover:bg-gray-300';
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-green-50'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute inset-0 bg-repeat pointer-events-none ${isDarkMode ? 'opacity-[0.08]' : 'opacity-10'}`}
          style={{ backgroundImage: `url(${doodles})`, backgroundSize: '420px' }}
        ></div>
        <div className={`absolute top-10 right-20 h-64 w-64 rounded-full blur-3xl ${isDarkMode ? 'bg-cyan-500/10' : 'bg-blue-200 opacity-20'}`}></div>
        <div className={`absolute bottom-20 left-10 h-96 w-96 rounded-full blur-3xl ${isDarkMode ? 'bg-emerald-500/10' : 'bg-green-200 opacity-20'}`}></div>
        <div className={`absolute top-1/2 right-1/4 h-80 w-80 rounded-full blur-3xl ${isDarkMode ? 'bg-fuchsia-500/10' : 'bg-purple-200 opacity-20'}`}></div>
      </div>

      <div className="relative z-10">
        <header className={`shadow-md transition-colors ${isDarkMode ? 'border-b border-slate-800 bg-slate-900/90 backdrop-blur' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BrandLogo size="md" />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span>{isDarkMode ? 'Tema claro' : 'Tema oscuro'}</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`rounded-full p-3 transition-colors ${navButtonClass(location.pathname === '/dashboard')}`}
                  title="Inicio"
                >
                  <Home size={20} />
                </button>
                <button
                  onClick={() => navigate('/students')}
                  className={`rounded-full p-3 transition-colors ${navButtonClass(location.pathname === '/students')}`}
                  title="Alumnos"
                >
                  <Bot size={20} />
                </button>
                <button
                  onClick={() => navigate('/programs')}
                  className={`rounded-full p-3 transition-colors ${navButtonClass(location.pathname === '/programs')}`}
                  title="Programas"
                >
                  <Book size={20} />
                </button>
                <button
                  onClick={() => navigate('/users')}
                  className={`rounded-full p-3 transition-colors ${navButtonClass(location.pathname === '/users')}`}
                  title="Usuarios"
                >
                  <Users size={20} />
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className={`rounded-full p-3 transition-colors ${navButtonClass(location.pathname === '/profile')}`}
                  title="Configuración"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`rounded-full p-3 transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
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
