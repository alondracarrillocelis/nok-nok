import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (firstName: string, paternalSurname: string, maternalSurname: string, email: string, password: string, phone: string, role: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = localStorage.getItem('user_data');
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
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username || email,
        role: response.user.role || 'user',
      };

      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (firstName: string, paternalSurname: string, maternalSurname: string, email: string, password: string, phone: string, role: string) => {
    try {
      const response = await auth.register(firstName, paternalSurname, maternalSurname, email, password, phone, role);
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        username: `${firstName} ${paternalSurname} ${maternalSurname}`,
        role: response.user.role || 'user',
      };

      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await auth.logout();
      setUser(null);
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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