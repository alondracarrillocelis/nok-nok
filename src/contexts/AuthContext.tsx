import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, sessionSettings } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  keepSession: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (firstName: string, paternalSurname: string, maternalSurname: string, email: string, password: string, phone: string, role: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setKeepSession: (keep: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [keepSession, setKeepSessionState] = useState<boolean>(sessionSettings.isPersistent());

  useEffect(() => {
    (async () => {
      try {
        const token = sessionSettings.getValue('auth_token');
        if (token) {
          // Aquí podrías hacer una llamada para obtener el usuario actual
          // Por ahora asumimos que el usuario está autenticado
          const userData = sessionSettings.getValue('user_data');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.warn('Failed to restore session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await auth.login(email, password);
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.email,
        role: response.user.role || 'user',
      };
      setUser(userData);
      sessionSettings.setValue('user_data', JSON.stringify(userData));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (firstName: string, paternalSurname: string, maternalSurname: string, email: string, password: string, phone: string, role: string) => {
    try {
      await auth.register(firstName, paternalSurname, maternalSurname, email, password, phone, role);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    setUser(null);
    sessionSettings.removeValue('user_data');
  };

  const setKeepSession = (keep: boolean) => {
    sessionSettings.setPersistent(keep);
    setKeepSessionState(keep);
  };

  return (
    <AuthContext.Provider value={{ user, loading, keepSession, signIn, signUp, signOut, setKeepSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
