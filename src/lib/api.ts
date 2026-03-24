// API Service - Centralizado para todas las llamadas a la API REST

import { ENDPOINTS, HTTP_METHODS, ERROR_MESSAGES } from '../constants/endpoints';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Tipos
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: any;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender: 'M' | 'F' | 'O';
  emergency_contact?: string;
  emergency_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  code: string;
  created_at: string;
}

export interface Ailment {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'staff';
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  program_id: string;
  status: 'active' | 'inactive' | 'completed';
  enrollment_date: string;
}

export interface StudentAilment {
  id: string;
  student_id: string;
  ailment_id: string;
  ailment?: Ailment;
  notes?: string;
}

export interface Document {
  id: string;
  student_id: string;
  subject_id?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

// Helper para obtener token
const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper para requests
const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const headers = getAuthHeader();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }

  return response.json();
};

// =====================================
// AUTENTICACIÓN
// =====================================

export const auth = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj;
      try {
        errorObj = errorText ? JSON.parse(errorText) : null;
      } catch {
        errorObj = null;
      }
      throw new Error((errorObj && errorObj.message) || 'Error en el login');
    }

    const text = await response.text();
    if (!text) {
      throw new Error('La respuesta del login no contiene JSON válido');
    }

    const data: AuthResponse = JSON.parse(text);
    localStorage.setItem('auth_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj;
      try {
        errorObj = errorText ? JSON.parse(errorText) : null;
      } catch {
        errorObj = null;
      }
      throw new Error((errorObj && errorObj.message) || 'Error en el registro');
    }

    const text = await response.text();
    if (!text) {
      // Si el registro no devuelve cuerpo JSON, intentar login automáticamente
      return auth.login(email, password);
    }

    const data: AuthResponse = JSON.parse(text);
    if (!data.access_token) {
      // Si no viene token, intentar login
      return auth.login(email, password);
    }

    localStorage.setItem('auth_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await apiCall(ENDPOINTS.AUTH.LOGOUT, { method: 'POST' });
      } catch (error) {
        console.error('Error en logout:', error);
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },

  refresh: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data: AuthResponse = await response.json();
    localStorage.setItem('auth_token', data.access_token);
    return data;
  },
};

// =====================================
// ESTUDIANTES
// =====================================

export const students = {
  list: async (page = 1, limit = 20): Promise<{ data: Student[]; total: number; page: number }> => {
    return apiCall(`${ENDPOINTS.STUDENTS.LIST}?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  create: async (student: Partial<Student>): Promise<Student> => {
    return apiCall(ENDPOINTS.STUDENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(student),
    });
  },

  getById: async (id: string): Promise<Student & { subjects?: any[]; ailments?: any[] }> => {
    return apiCall(ENDPOINTS.STUDENTS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    return apiCall(ENDPOINTS.STUDENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.STUDENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// MATERIAS
// =====================================

export const subjects = {
  list: async (): Promise<{ data: Subject[] }> => {
    return apiCall(ENDPOINTS.SUBJECTS.LIST, { method: 'GET' });
  },

  create: async (subject: Partial<Subject>): Promise<Subject> => {
    return apiCall(ENDPOINTS.SUBJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  },

  getById: async (id: string): Promise<Subject> => {
    return apiCall(ENDPOINTS.SUBJECTS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: Partial<Subject>): Promise<Subject> => {
    return apiCall(ENDPOINTS.SUBJECTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.SUBJECTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// PADECIMIENTOS
// =====================================

export const ailments = {
  list: async (): Promise<{ data: Ailment[] }> => {
    return apiCall(ENDPOINTS.AILMENTS.LIST, { method: 'GET' });
  },

  create: async (ailment: Partial<Ailment>): Promise<Ailment> => {
    return apiCall(ENDPOINTS.AILMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(ailment),
    });
  },

  getById: async (id: string): Promise<Ailment> => {
    return apiCall(ENDPOINTS.AILMENTS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: Partial<Ailment>): Promise<Ailment> => {
    return apiCall(ENDPOINTS.AILMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.AILMENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// USUARIOS
// =====================================

export const users = {
  list: async (): Promise<{ data: User[] }> => {
    return apiCall(ENDPOINTS.USERS.LIST, { method: 'GET' });
  },

  create: async (user: Partial<User> & { password: string }): Promise<User> => {
    return apiCall(ENDPOINTS.USERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiCall(ENDPOINTS.USERS.GET_CURRENT, { method: 'GET' });
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiCall(ENDPOINTS.USERS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// =====================================
// PADECIMIENTOS DE ESTUDIANTES
// =====================================

export const studentAilments = {
  list: async (studentId: string): Promise<{ data: StudentAilment[] }> => {
    return apiCall(ENDPOINTS.STUDENT_AILMENTS.LIST(studentId), { method: 'GET' });
  },

  create: async (data: { student_id: string; ailment_id: string; notes?: string }): Promise<StudentAilment> => {
    return apiCall(ENDPOINTS.STUDENT_AILMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<StudentAilment>): Promise<StudentAilment> => {
    return apiCall(ENDPOINTS.STUDENT_AILMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.STUDENT_AILMENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// MATERIAS DE ESTUDIANTES
// =====================================

export const studentSubjects = {
  list: async (studentId: string): Promise<{ data: any[] }> => {
    return apiCall(ENDPOINTS.STUDENT_SUBJECTS.LIST(studentId), { method: 'GET' });
  },

  create: async (data: { student_id: string; subject_id: string }): Promise<any> => {
    return apiCall(ENDPOINTS.STUDENT_SUBJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.STUDENT_SUBJECTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// INSCRIPCIONES
// =====================================

export const enrollments = {
  list: async (studentId?: string): Promise<{ data: Enrollment[] }> => {
    return apiCall(ENDPOINTS.ENROLLMENTS.LIST(studentId), { method: 'GET' });
  },

  create: async (data: Partial<Enrollment>): Promise<Enrollment> => {
    return apiCall(ENDPOINTS.ENROLLMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getById: async (id: string): Promise<Enrollment> => {
    return apiCall(ENDPOINTS.ENROLLMENTS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: Partial<Enrollment>): Promise<Enrollment> => {
    return apiCall(ENDPOINTS.ENROLLMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.ENROLLMENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// DOCUMENTOS
// =====================================

export const documents = {
  list: async (studentId?: string): Promise<{ data: Document[] }> => {
    return apiCall(ENDPOINTS.DOCUMENTS.LIST(studentId), { method: 'GET' });
  },

  upload: async (formData: FormData): Promise<Document> => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.DOCUMENTS.UPLOAD}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en carga de documento');
    }

    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.DOCUMENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// DASHBOARD
// =====================================

export const dashboard = {
  getStats: async (fromDate?: string, toDate?: string): Promise<any> => {
    return apiCall(ENDPOINTS.DASHBOARD.STATS(fromDate, toDate), { method: 'GET' });
  },
};

// Exportar API_BASE_URL para uso en componentes que necesiten llamadas directas
export { API_BASE_URL };
