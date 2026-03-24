// API Service

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
import { ENDPOINTS, HTTP_METHODS } from '../constants/endpoints';

const wrap = (key: string, any) => ({ [key]: data });

// ================= HEADERS =================
const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ================= CORE =================
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || `Error ${res.status}`);
  }

  return res.json();
};

// ================= AUTH =================
export const auth = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN.URL}`, {
      method: HTTP_METHODS.POST,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wrap('user', { email, password })),
    });

    if (!res.ok) throw new Error('Error en login');

    const data = await res.json();
    localStorage.setItem('auth_token', data.accessToken);
    return data;
  },

  register: async (firstName: string, paternalSurname: string, maternalSurname: string, email: string, password: string, phone: string, role: string) => {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.REGISTER.URL}`, {
      method: HTTP_METHODS.POST,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        wrap('user', {
          firstName,
          paternalSurname,
          maternalSurname,
          phone,
          role,
          email,
          password,
        })
      ),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Error en registro');
    }

    const data = await res.json().catch(() => null);

    if (!data?.accessToken) {
      return auth.login(email, password);
    }

    localStorage.setItem('auth_token', data.accessToken);
    return data;
  },

  logout: async () => {
    await apiCall(ENDPOINTS.AUTH.LOGOUT.URL, { method: HTTP_METHODS.POST });
    localStorage.clear();
  },
};

// ================= STUDENTS =================
export const students = {
  list: (page = 1, limit = 20) =>
    apiCall(`${ENDPOINTS.STUDENTS.LIST}?page=${page}&limit=${limit}`),

  create: (student: any) =>
    apiCall(ENDPOINTS.STUDENTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(wrap('student', student)),
    }),

  getById: (id: string) =>
    apiCall(ENDPOINTS.STUDENTS.GET_BY_ID(id)),

  update: (id: string, any) =>
    apiCall(ENDPOINTS.STUDENTS.UPDATE(id), {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(wrap('student', data)),
    }),

  delete: (id: string) =>
    apiCall(ENDPOINTS.STUDENTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= SUBJECTS =================
export const subjects = {
  list: () => apiCall(ENDPOINTS.SUBJECTS.LIST),

  create: (subject: any) =>
    apiCall(ENDPOINTS.SUBJECTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(wrap('subject', subject)),
    }),

  getById: (id: string) =>
    apiCall(ENDPOINTS.SUBJECTS.GET_BY_ID(id)),

  update: (id: string, any) =>
    apiCall(ENDPOINTS.SUBJECTS.UPDATE(id), {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(wrap('subject', data)),
    }),

  delete: (id: string) =>
    apiCall(ENDPOINTS.SUBJECTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= AILMENTS =================
export const ailments = {
  list: () => apiCall(ENDPOINTS.AILMENTS.LIST),

  create: (ailment: any) =>
    apiCall(ENDPOINTS.AILMENTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(wrap('ailment', ailment)),
    }),

  update: (id: string, any) =>
    apiCall(ENDPOINTS.AILMENTS.UPDATE(id), {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(wrap('ailment', data)),
    }),

  delete: (id: string) =>
    apiCall(ENDPOINTS.AILMENTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= USERS =================
export const users = {
  list: () => apiCall(ENDPOINTS.USERS.LIST),

  create: (user: any) =>
    apiCall(ENDPOINTS.USERS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(
        wrap('user', {
          ...user,
          password_confirmation: user.password,
        })
      ),
    }),

  getCurrentUser: () =>
    apiCall(ENDPOINTS.USERS.GET_CURRENT),

  update: (id: string, any) =>
    apiCall(ENDPOINTS.USERS.UPDATE(id), {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(wrap('user', data)),
    }),
};

// ================= ENROLLMENTS =================
export const enrollments = {
  list: (studentId?: string) =>
    apiCall(ENDPOINTS.ENROLLMENTS.LIST(studentId)),

  create: (any) =>
    apiCall(ENDPOINTS.ENROLLMENTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(wrap('enrollment', data)),
    }),

  update: (id: string, any) =>
    apiCall(ENDPOINTS.ENROLLMENTS.UPDATE(id), {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(wrap('enrollment', data)),
    }),

  delete: (id: string) =>
    apiCall(ENDPOINTS.ENROLLMENTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= STUDENT AILMENTS =================
export const studentAilments = {
  list: (studentId: string) =>
    apiCall(ENDPOINTS.STUDENT_AILMENTS.LIST(studentId)),

  create: (any) =>
    apiCall(ENDPOINTS.STUDENT_AILMENTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(wrap('student_ailment', data)),
    }),

  update: (id: string, any) =>
    apiCall(ENDPOINTS.STUDENT_AILMENTS.UPDATE(id), {
      method: HTTP_METHODS.PATCH,
      body: JSON.stringify(wrap('student_ailment', data)),
    }),

  delete: (id: string) =>
    apiCall(ENDPOINTS.STUDENT_AILMENTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= STUDENT SUBJECTS =================
export const studentSubjects = {
  list: (studentId: string) =>
    apiCall(ENDPOINTS.STUDENT_SUBJECTS.LIST(studentId)),

  create: (any) =>
    apiCall(ENDPOINTS.STUDENT_SUBJECTS.CREATE, {
      method: HTTP_METHODS.POST,
      body: JSON.stringify(wrap('student_subject', data)),
    }),

  delete: (id: string) =>
    apiCall(ENDPOINTS.STUDENT_SUBJECTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= DOCUMENTS =================
export const documents = {
  list: (studentId?: string) =>
    apiCall(ENDPOINTS.DOCUMENTS.LIST(studentId)),

  upload: async (formData: FormData) => {
    const token = localStorage.getItem('auth_token');

    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.DOCUMENTS.UPLOAD}`, {
      method: HTTP_METHODS.POST,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error('Error subiendo archivo');

    return res.json();
  },

  delete: (id: string) =>
    apiCall(ENDPOINTS.DOCUMENTS.DELETE(id), { method: HTTP_METHODS.DELETE }),
};

// ================= DASHBOARD =================
export const dashboard = {
  getStats: (from?: string, to?: string) =>
    apiCall(ENDPOINTS.DASHBOARD.STATS(from, to)),
};

export { API_BASE_URL };