// API Service - Centralizado para todas las llamadas a la API REST

import { ENDPOINTS } from '../constants/endpoints';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SESSION_PERSISTENCE_KEY = 'session_persistence_mode';
const AUTH_STORAGE_KEYS = ['auth_token', 'refresh_token', 'user_data'] as const;

let refreshInFlight: Promise<void> | null = null;

// Tipos
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    paternalSurname: string;
  };
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

interface ApiMessageResponse {
  message: string;
}

const getPersistenceMode = (): 'local' | 'session' => {
  return localStorage.getItem(SESSION_PERSISTENCE_KEY) === 'session' ? 'session' : 'local';
};

const getActiveStorage = (): Storage => {
  return getPersistenceMode() === 'session' ? sessionStorage : localStorage;
};

const getSessionValue = (key: string): string | null => {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
};

const setSessionValue = (key: string, value: string): void => {
  const storage = getActiveStorage();
  const secondary = storage === localStorage ? sessionStorage : localStorage;
  storage.setItem(key, value);
  secondary.removeItem(key);
};

const removeSessionValue = (key: string): void => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export const sessionSettings = {
  isPersistent: (): boolean => getPersistenceMode() === 'local',
  setPersistent: (persistent: boolean): void => {
    const targetStorage = persistent ? localStorage : sessionStorage;

    const values = AUTH_STORAGE_KEYS.reduce<Record<string, string>>((acc, key) => {
      const value = getSessionValue(key);
      if (value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    AUTH_STORAGE_KEYS.forEach((key) => removeSessionValue(key));
    Object.entries(values).forEach(([key, value]) => targetStorage.setItem(key, value));

    localStorage.setItem(SESSION_PERSISTENCE_KEY, persistent ? 'local' : 'session');
  },
  getValue: (key: string): string | null => getSessionValue(key),
  setValue: (key: string, value: string): void => setSessionValue(key, value),
  removeValue: (key: string): void => removeSessionValue(key),
};

export interface Student {
  id: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate?: string | null;
  curp?: string | null;
  enrollmentNumber: string;
  enrollmentDate?: string | null;
  currentLevel?: string | null;
  currentGrade?: string | null;
  program?: string | null;
  shift?: string | null;
  representative?: string | null;
  gender?: 'male' | 'female' | 'other';
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  status: 'active' | 'inactive' | 'dropped';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentPayload {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate?: string | null;
  curp?: string | null;
  enrollmentNumber: string;
  enrollmentDate?: string | null;
  currentLevel?: string | null;
  currentGrade?: string | null;
  program?: string | null;
  shift?: string | null;
  representative?: string | null;
  gender: 'male' | 'female' | 'other';
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  status: 'active' | 'inactive' | 'dropped';
}

export type UpdateStudentPayload = Partial<CreateStudentPayload>;

export interface Tutor {
  id: string;
  studentId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
}

export interface StudentSubjectRelation {
  id: string;
  grade?: string | null;
  status?: 'active' | 'inactive';
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

export interface StudentDetailResponse extends Student {
  tutors?: Tutor[];
  subjects?: StudentSubjectRelation[];
  ailments?: StudentAilment[];
  documents?: Document[];
}

export interface StudentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudentsListResponse {
  data: Student[];
  pagination: StudentsPagination;
}

export interface StudentDeleteResponse {
  message: string;
  id: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SubjectFilters {
  status?: 'active' | 'inactive';
  search?: string;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  description: string;
  credits: number;
  status?: 'active' | 'inactive';
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  description?: string;
  credits?: number;
  status?: 'active' | 'inactive';
}

export interface ProgramSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  subjects: ProgramSubject[];
}

export interface CreateProgramPayload {
  name: string;
  description: string;
  status?: 'active' | 'inactive';
}

export interface UpdateProgramPayload {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface ProgramSubjectAssignment {
  id: string;
  programId: string;
  subjectId: string;
  createdAt: string;
}

export interface Ailment {
  id: string;
  name: string;
  description?: string;
  medication?: string;
  medicalDescription?: string;
  severity?: AilmentSeverity;
  status?: AilmentStatus;
  notes?: string;
  createdAt?: string;
}

export interface CreateAilmentPayload {
  name: string;
  description: string;
  medication: string;
  medicalDescription: string;
  severity: AilmentSeverity;
  status: AilmentStatus;
  notes: string;
}

export interface User {
  id: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string | null;
  email: string;
  phone: string | null;
  role: 'admin' | 'tutor';
  status: 'activo' | 'inactivo';
  createdAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'tutor';
}

export interface UpdateUserPayload {
  status?: 'activo' | 'inactivo';
  role?: 'admin' | 'tutor';
  phone?: string;
  firstName?: string;
  paternalSurname?: string;
  maternalSurname?: string | null;
}

export interface Enrollment {
  id: string;
  studentId: string;
  folio?: string | null;
  enrollmentDate: string;
  enrollmentType?: 'semanal' | 'mensual' | 'por_nivel' | 'programa_completo' | null;
  programId?: string | null;
  program?: string | null;
  representativeId?: string | null;
  status: string;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AilmentSeverity = 'mild' | 'moderate' | 'severe' | 'leve' | 'moderado' | 'severo';
export type AilmentStatus = 'active' | 'inactive';

export interface StudentAilment {
  id: string;
  studentId: string;
  ailmentId: string;
  ailment?: Ailment;
  status?: AilmentStatus;
  diagnosisDate?: string | null;
  notes?: string;
}

export interface Document {
  id: string;
  studentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CreateDocumentPayload {
  studentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RawEnrollment = Partial<Enrollment> & {
  program?: string | { id?: string | null; name?: string | null } | null;
  programId?: string | null;
};

const isUuid = (value?: string | null): value is string => {
  return Boolean(value && UUID_PATTERN.test(value));
};

const normalizeEnrollment = (enrollment: RawEnrollment): Enrollment => {
  let programId = enrollment.programId ?? null;
  const rawProgram = enrollment.program as string | { id?: string | null; name?: string | null } | null | undefined;
  let programName = typeof rawProgram === 'string' ? rawProgram : null;

  if (programName && isUuid(programName) && !programId) {
    programId = programName;
    programName = null;
  }

  if (rawProgram && typeof rawProgram === 'object') {
    programId = programId ?? rawProgram.id ?? null;
    programName = rawProgram.name ?? null;
  }

  return {
    id: enrollment.id || '',
    studentId: enrollment.studentId || '',
    folio: enrollment.folio ?? null,
    enrollmentDate: enrollment.enrollmentDate || '',
    enrollmentType: enrollment.enrollmentType ?? null,
    programId,
    program: programName,
    representativeId: enrollment.representativeId ?? null,
    status: enrollment.status || '',
    dueDate: enrollment.dueDate ?? null,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
};

const normalizeEnrollmentPayload = (data: Partial<Enrollment>) => {
  const payload = { ...data };

  if (!payload.programId && isUuid(payload.program || null)) {
    payload.programId = payload.program || null;
  }

  if (payload.programId && (!payload.program || isUuid(payload.program))) {
    delete payload.program;
  }

  return payload;
};

// Helper para obtener token
const getAuthHeader = (): HeadersInit => {
  const token = getSessionValue('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const shouldTryRefresh = (endpoint: string): boolean => {
  const noRefreshEndpoints = [
    ENDPOINTS.AUTH.LOGIN,
    ENDPOINTS.AUTH.REGISTER,
    ENDPOINTS.AUTH.VERIFY_EMAIL,
    ENDPOINTS.AUTH.FORGOT_PASSWORD,
    ENDPOINTS.AUTH.RESET_PASSWORD,
    ENDPOINTS.AUTH.REFRESH,
    ENDPOINTS.AUTH.LOGOUT,
  ];

  return !noRefreshEndpoints.some((authEndpoint) => endpoint.startsWith(authEndpoint));
};

const clearSessionStorage = () => {
  removeSessionValue('auth_token');
  removeSessionValue('refresh_token');
  removeSessionValue('user_data');
};

const refreshAccessToken = async (): Promise<void> => {
  if (!refreshInFlight) {
    refreshInFlight = auth
      .refresh()
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  await refreshInFlight;
};

const parseApiError = async (response: Response): Promise<Error> => {
  const errorPayload = await response.json().catch(() => null) as
    | { message?: string; error?: string }
    | null;

  if (response.status === 401) {
    return new Error(errorPayload?.message || 'Token inválido o expirado');
  }

  return new Error(errorPayload?.message || errorPayload?.error || `Error: ${response.status}`);
};

// Helper para requests
const apiCall = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retried = false
): Promise<T> => {
  const headers = getAuthHeader();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && !retried && shouldTryRefresh(endpoint)) {
    try {
      await refreshAccessToken();
      return apiCall<T>(endpoint, options, true);
    } catch {
      clearSessionStorage();
      throw new Error('Token inválido o expirado. Inicia sesión nuevamente.');
    }
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
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
    setSessionValue('auth_token', data.accessToken);
    if (data.refreshToken) {
      setSessionValue('refresh_token', data.refreshToken);
    }
    return data;
  },

  register: async (
    firstName: string,
    paternalSurname: string,
    maternalSurname: string,
    email: string,
    password: string,
    phone: string,
    role: string
  ): Promise<RegisterResponse> => {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, paternalSurname, maternalSurname, email, password, phone, role }),
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
      throw new Error('La respuesta del registro no contiene JSON válido');
    }

    return JSON.parse(text) as RegisterResponse;
  },

  verifyEmail: async (token: string): Promise<ApiMessageResponse> => {
    const query = `?token=${encodeURIComponent(token)}`;
    return apiCall<ApiMessageResponse>(`${ENDPOINTS.AUTH.VERIFY_EMAIL}${query}`, {
      method: 'GET',
    });
  },

  forgotPassword: async (email: string): Promise<ApiMessageResponse> => {
    return apiCall<ApiMessageResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiMessageResponse> => {
    return apiCall<ApiMessageResponse>(ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  logout: async (): Promise<void> => {
    const refreshToken = getSessionValue('refresh_token');
    try {
      await apiCall(ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
    removeSessionValue('auth_token');
    removeSessionValue('refresh_token');
  },

  refresh: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = getSessionValue('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data: RefreshTokenResponse = await response.json();
    setSessionValue('auth_token', data.accessToken);
    if (data.refreshToken) {
      setSessionValue('refresh_token', data.refreshToken);
    }
    return data;
  },
};

// =====================================
// ESTUDIANTES
// =====================================

export const students = {
  list: async ({
    status,
    search,
    page = 1,
    limit = 20,
  }: {
    status?: 'active' | 'inactive' | 'dropped';
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<StudentsListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiCall(`${ENDPOINTS.STUDENTS.LIST}?${params.toString()}`, { method: 'GET' });
  },

  create: async (student: CreateStudentPayload): Promise<Student> => {
    return apiCall(ENDPOINTS.STUDENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(student),
    });
  },

  getById: async (id: string): Promise<StudentDetailResponse> => {
    return apiCall(ENDPOINTS.STUDENTS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: UpdateStudentPayload): Promise<Student> => {
    return apiCall(ENDPOINTS.STUDENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<StudentDeleteResponse> => {
    return apiCall<StudentDeleteResponse>(ENDPOINTS.STUDENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// MATERIAS
// =====================================

export const subjects = {
  list: async (filters: SubjectFilters = {}): Promise<Subject[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const query = params.toString();
    const endpoint = query ? `${ENDPOINTS.SUBJECTS.LIST}?${query}` : ENDPOINTS.SUBJECTS.LIST;

    return apiCall(endpoint, { method: 'GET' });
  },

  create: async (subject: CreateSubjectPayload): Promise<Subject> => {
    return apiCall(ENDPOINTS.SUBJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  },

  getById: async (id: string): Promise<Subject> => {
    return apiCall(ENDPOINTS.SUBJECTS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: UpdateSubjectPayload): Promise<Subject> => {
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
// PROGRAMAS
// =====================================

export const programs = {
  list: async (): Promise<Program[]> => {
    return apiCall(ENDPOINTS.PROGRAMS.LIST, { method: 'GET' });
  },

  create: async (program: CreateProgramPayload): Promise<Program> => {
    return apiCall(ENDPOINTS.PROGRAMS.CREATE, {
      method: 'POST',
      body: JSON.stringify(program),
    });
  },

  getById: async (id: string): Promise<Program> => {
    return apiCall(ENDPOINTS.PROGRAMS.GET_BY_ID(id), { method: 'GET' });
  },

  update: async (id: string, data: UpdateProgramPayload): Promise<Program> => {
    return apiCall(ENDPOINTS.PROGRAMS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.PROGRAMS.DELETE(id), { method: 'DELETE' });
  },

  addSubject: async (id: string, subjectId: string): Promise<ProgramSubjectAssignment> => {
    return apiCall(ENDPOINTS.PROGRAMS.ADD_SUBJECT(id), {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    });
  },

  removeSubject: async (id: string, subjectId: string): Promise<void> => {
    return apiCall(ENDPOINTS.PROGRAMS.REMOVE_SUBJECT(id, subjectId), { method: 'DELETE' });
  },
};

// =====================================
// PADECIMIENTOS
// =====================================

export const ailments = {
  list: async (): Promise<{ data: Ailment[] }> => {
    return apiCall(ENDPOINTS.AILMENTS.LIST, { method: 'GET' });
  },

  create: async (ailment: CreateAilmentPayload): Promise<Ailment> => {
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
  list: async (): Promise<User[]> => {
    return apiCall(ENDPOINTS.USERS.LIST, { method: 'GET' }) as Promise<User[]>;
  },

  create: async (user: CreateUserPayload): Promise<User> => {
    return apiCall(ENDPOINTS.USERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(user),
    }) as Promise<User>;
  },

  getCurrentUser: async (): Promise<User> => {
    const stored = getSessionValue('user_data');
    if (!stored) throw new Error('No hay datos de usuario');
    const { id } = JSON.parse(stored) as { id: string };
    const allUsers = await apiCall(ENDPOINTS.USERS.LIST, { method: 'GET' }) as User[];
    const found = Array.isArray(allUsers) ? allUsers.find(u => u.id === id) : undefined;
    if (!found) throw new Error('Usuario no encontrado');
    return found;
  },

  update: async (id: string, data: UpdateUserPayload): Promise<User> => {
    return apiCall(ENDPOINTS.USERS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }) as Promise<User>;
  },
};

// =====================================
// PADECIMIENTOS DE ESTUDIANTES
// =====================================

export const studentAilments = {
  list: async (studentId: string): Promise<{ data: StudentAilment[] }> => {
    return apiCall(ENDPOINTS.STUDENT_AILMENTS.LIST(studentId), { method: 'GET' });
  },

  create: async (data: { studentId: string; ailmentId: string; status?: AilmentStatus; diagnosisDate?: string; notes?: string }): Promise<StudentAilment> => {
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
  list: async (studentId: string): Promise<object[]> => {
    return apiCall(ENDPOINTS.STUDENT_SUBJECTS.LIST(studentId), { method: 'GET' }) as Promise<object[]>;
  },

  create: async (data: { studentId: string; subjectId: string; grade?: string; status?: string }): Promise<object> => {
    return apiCall(ENDPOINTS.STUDENT_SUBJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<object>;
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
    const response = await apiCall<{ data: RawEnrollment[] }>(ENDPOINTS.ENROLLMENTS.LIST(studentId), { method: 'GET' });

    return {
      data: (response.data || []).map(normalizeEnrollment),
    };
  },

  create: async (data: Partial<Enrollment>): Promise<Enrollment> => {
    const response = await apiCall<RawEnrollment>(ENDPOINTS.ENROLLMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(normalizeEnrollmentPayload(data)),
    });

    return normalizeEnrollment(response);
  },

  getById: async (id: string): Promise<Enrollment> => {
    const response = await apiCall<RawEnrollment>(ENDPOINTS.ENROLLMENTS.GET_BY_ID(id), { method: 'GET' });

    return normalizeEnrollment(response);
  },

  update: async (id: string, data: Partial<Enrollment>): Promise<Enrollment> => {
    const response = await apiCall<RawEnrollment>(ENDPOINTS.ENROLLMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(normalizeEnrollmentPayload(data)),
    });

    return normalizeEnrollment(response);
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.ENROLLMENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// DOCUMENTOS
// =====================================

export const documents = {
  list: async (studentId?: string): Promise<Document[]> => {
    return apiCall(ENDPOINTS.DOCUMENTS.LIST(studentId), { method: 'GET' });
  },

  upload: async (payload: CreateDocumentPayload): Promise<Document> => {
    return apiCall(ENDPOINTS.DOCUMENTS.UPLOAD, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiCall(ENDPOINTS.DOCUMENTS.DELETE(id), { method: 'DELETE' });
  },
};

// =====================================
// DASHBOARD
// =====================================

export const dashboard = {
  getStats: async (fromDate?: string, toDate?: string): Promise<object> => {
    return apiCall(ENDPOINTS.DASHBOARD.STATS(fromDate, toDate), { method: 'GET' }) as Promise<object>;
  },
};

// Exportar API_BASE_URL para uso en componentes que necesiten llamadas directas
export { API_BASE_URL };
