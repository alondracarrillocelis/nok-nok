/**
 * Endpoints API - Centralización de todas las rutas
 * Uso: import { ENDPOINTS } from '../constants/endpoints'
 * Ejemplo: ENDPOINTS.AUTH.LOGIN
 */

export const ENDPOINTS = {
  // =====================================
  // AUTENTICACIÓN
  // =====================================
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // =====================================
  // ESTUDIANTES
  // =====================================
  STUDENTS: {
    LIST: '/students/',
    CREATE: '/students/',
    GET_BY_ID: (id: string) => `/students/${id}`,
    UPDATE: (id: string) => `/students/${id}`,
    DELETE: (id: string) => `/students/${id}`,
  },

  // =====================================
  // TUTORES
  // =====================================
  TUTORS: {
    LIST: '/tutors/',
    CREATE: '/tutors/',
    UPDATE: (id: string) => `/tutors/${id}`,
    DELETE: (id: string) => `/tutors/${id}`,
  },

  // =====================================
  // MATERIAS
  // =====================================
  SUBJECTS: {
    LIST: '/subjects/',
    CREATE: '/subjects/',
    GET_BY_ID: (id: string) => `/subjects/${id}`,
    UPDATE: (id: string) => `/subjects/${id}`,
    DELETE: (id: string) => `/subjects/${id}`,
  },

  // =====================================
  // PADECIMIENTOS
  // =====================================
  AILMENTS: {
    LIST: '/ailments/',
    CREATE: '/ailments/',
    GET_BY_ID: (id: string) => `/ailments/${id}`,
    UPDATE: (id: string) => `/ailments/${id}`,
    DELETE: (id: string) => `/ailments/${id}`,
  },

  // =====================================
  // MATERIAS DE ALUMNOS
  // =====================================
  STUDENT_SUBJECTS: {
    LIST: (studentId: string) => `/student-subjects/?studentId=${studentId}`,
    CREATE: '/student-subjects/',
    DELETE: (id: string) => `/student-subjects/${id}`,
  },

  // =====================================
  // PADECIMIENTOS DE ALUMNOS
  // =====================================
  STUDENT_AILMENTS: {
    LIST: (studentId: string) => `/student-ailments/?studentId=${studentId}`,
    CREATE: '/student-ailments/',
    UPDATE: (id: string) => `/student-ailments/${id}`,
    DELETE: (id: string) => `/student-ailments/${id}`,
  },

  // =====================================
  // INSCRIPCIONES
  // =====================================
  ENROLLMENTS: {
    LIST: (studentId?: string) =>
      studentId ? `/enrollments/?studentId=${studentId}` : '/enrollments/',
    CREATE: '/enrollments/',
    GET_BY_ID: (id: string) => `/enrollments/${id}`,
    UPDATE: (id: string) => `/enrollments/${id}`,
    DELETE: (id: string) => `/enrollments/${id}`,
  },

  // =====================================
  // DOCUMENTOS
  // =====================================
  DOCUMENTS: {
    LIST: (studentId?: string) =>
      studentId ? `/documents/?studentId=${studentId}` : '/documents/',
    UPLOAD: '/documents/',
    DELETE: (id: string) => `/documents/${id}`,
  },

  // =====================================
  // USUARIOS
  // =====================================
  USERS: {
    LIST: '/users/',
    CREATE: '/users/',
    UPDATE: (id: string) => `/users/${id}`,
  },

  // =====================================
  // DASHBOARD
  // =====================================
  DASHBOARD: {
    STATS: (fromDate?: string, toDate?: string) => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      const query = params.toString();
      return `/dashboard/stats${query ? '?' + query : ''}`;
    },
  },
} as const;

/**
 * Métodos HTTP
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  PUT: 'PUT',
} as const;

/**
 * Headers por defecto
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;

/**
 * Códigos de estado HTTP
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'No autorizado. Por favor inicia sesión.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso no fue encontrado.',
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  TIMEOUT: 'La solicitud tardó demasiado tiempo.',
} as const;
