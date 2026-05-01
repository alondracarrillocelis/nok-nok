import { createContext, useEffect, useState, ReactNode } from 'react';
import { AUTH_EVENTS, auth, clearSessionStorage, sessionSettings } from '../lib/api';

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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [keepSession, setKeepSessionState] = useState<boolean>(sessionSettings.isPersistent());

  useEffect(() => {
    const handleSessionCleared = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared);

    (async () => {
      try {
        const token = sessionSettings.getValue('auth_token');
        const refreshToken = sessionSettings.getValue('refresh_token');
        const userData = sessionSettings.getValue('user_data');

        if (token === 'dev-access-token') {
          clearSessionStorage();
          return;
        }

        if (!token && !refreshToken) {
          setUser(null);
          return;
        }

        if (refreshToken) {
          await auth.refresh();
        }

        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.warn('Failed to restore session:', error);
        clearSessionStorage();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      window.removeEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared);
    };
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
