/**
 * Ejemplos de uso - Endpoints API
 * 
 * Este archivo muestra cómo usar los servicios API de forma limpia y simple
 * usando las constantes de endpoints definidas en src/constants/endpoints.ts
 */

import { ENDPOINTS, HTTP_METHODS, HTTP_STATUS, ERROR_MESSAGES } from '../constants/endpoints';
import {
  auth,
  students,
  subjects,
  ailments,
  users,
  studentAilments,
  studentSubjects,
  enrollments,
  documents,
  dashboard,
} from '../lib/api';

// =====================================
// AUTENTICACIÓN
// =====================================

/**
 * Ejemplo 1: Login
 */
export async function exampleLogin() {
  try {
    const response = await auth.login('usuario@example.com', 'password123');
    console.log('Usuario logueado:', response.user);
    // Token guardado automáticamente en localStorage
  } catch (error) {
    console.error('Error en login:', error);
  }
}

/**
 * Ejemplo 2: Registro de nuevo usuario
 */
export async function exampleRegister() {
  try {
    const response = await auth.register('nuevo@example.com', 'password123', 'Juan Pérez');
    console.log('Usuario registrado:', response.user);
  } catch (error) {
    console.error('Error en registro:', error);
  }
}

/**
 * Ejemplo 3: Logout
 */
export async function exampleLogout() {
  try {
    await auth.logout();
    console.log('Usuario deslogueado');
  } catch (error) {
    console.error('Error en logout:', error);
  }
}

// =====================================
// ESTUDIANTES
// =====================================

/**
 * Ejemplo 4: Listar estudiantes
 */
export async function exampleListStudents() {
  try {
    const response = await students.list(1, 20); // página 1, 20 por página
    console.log('Estudiantes:', response.data);
    console.log('Total:', response.total);
  } catch (error) {
    console.error('Error al listar estudiantes:', error);
  }
}

/**
 * Ejemplo 5: Obtener un estudiante por ID
 */
export async function exampleGetStudent(studentId: string) {
  try {
    const student = await students.getById(studentId);
    console.log('Estudiante encontrado:', student);
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
  }
}

/**
 * Ejemplo 6: Crear nuevo estudiante
 * 
 * Nota: Solo usamos el nombre de la función y los datos,
 * no escribimos el endpoint '/students/' manualmente
 */
export async function exampleCreateStudent() {
  try {
    const newStudent = await students.create({
      name: 'María García López',
      email: 'maria@example.com',
      phone: '1234567890',
      gender: 'F',
      emergency_contact: 'Juan García',
      emergency_phone: '0987654321',
    });
    console.log('Estudiante creado:', newStudent.id);
  } catch (error) {
    console.error('Error al crear estudiante:', error);
  }
}

/**
 * Ejemplo 7: Actualizar estudiante
 */
export async function exampleUpdateStudent(studentId: string) {
  try {
    const updated = await students.update(studentId, {
      name: 'María García López Updated',
      phone: '9876543210',
    });
    console.log('Estudiante actualizado:', updated);
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
  }
}

/**
 * Ejemplo 8: Eliminar estudiante
 */
export async function exampleDeleteStudent(studentId: string) {
  try {
    await students.delete(studentId);
    console.log('Estudiante eliminado');
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
  }
}

// =====================================
// MATERIAS
// =====================================

/**
 * Ejemplo 9: Listar materias
 */
export async function exampleListSubjects() {
  try {
    const response = await subjects.list();
    console.log('Materias:', response.data);
  } catch (error) {
    console.error('Error al listar materias:', error);
  }
}

/**
 * Ejemplo 10: Crear materia
 */
export async function exampleCreateSubject() {
  try {
    const newSubject = await subjects.create({
      name: 'Matemáticas',
      code: 'MAT-101',
      description: 'Curso de matemáticas básicas',
    });
    console.log('Materia creada:', newSubject.id);
  } catch (error) {
    console.error('Error al crear materia:', error);
  }
}

// =====================================
// PADECIMIENTOS
// =====================================

/**
 * Ejemplo 11: Listar padecimientos
 */
export async function exampleListAilments() {
  try {
    const response = await ailments.list();
    console.log('Padecimientos:', response.data);
  } catch (error) {
    console.error('Error al listar padecimientos:', error);
  }
}

/**
 * Ejemplo 12: Crear padecimiento
 */
export async function exampleCreateAilment() {
  try {
    const newAilment = await ailments.create({
      name: 'Asma',
      description: 'Enfermedad respiratoria crónica',
    });
    console.log('Padecimiento creado:', newAilment.id);
  } catch (error) {
    console.error('Error al crear padecimiento:', error);
  }
}

// =====================================
// USUARIOS
// =====================================

/**
 * Ejemplo 13: Listar usuarios
 */
export async function exampleListUsers() {
  try {
    const response = await users.list();
    console.log('Usuarios:', response.data);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  }
}

/**
 * Ejemplo 14: Crear usuario
 */
export async function exampleCreateUser() {
  try {
    const newUser = await users.create({
      email: 'profesor@example.com',
      password: 'password123',
      name: 'Carlos Profesor',
      role: 'teacher',
    });
    console.log('Usuario creado:', newUser.id);
  } catch (error) {
    console.error('Error al crear usuario:', error);
  }
}

/**
 * Ejemplo 15: Obtener usuario actual
 */
export async function exampleGetCurrentUser() {
  try {
    const user = await users.getCurrentUser();
    console.log('Usuario actual:', user);
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
  }
}

// =====================================
// PADECIMIENTOS DE ESTUDIANTES
// =====================================

/**
 * Ejemplo 16: Listar padecimientos de un estudiante
 */
export async function exampleListStudentAilments(studentId: string) {
  try {
    const response = await studentAilments.list(studentId);
    console.log('Padecimientos del estudiante:', response.data);
  } catch (error) {
    console.error('Error al listar padecimientos:', error);
  }
}

/**
 * Ejemplo 17: Asignar padecimiento a estudiante
 */
export async function exampleAssignAilmentToStudent(studentId: string, ailmentId: string) {
  try {
    const result = await studentAilments.create({
      student_id: studentId,
      ailment_id: ailmentId,
      notes: 'Requiere medicamentos especiales',
    });
    console.log('Padecimiento asignado:', result.id);
  } catch (error) {
    console.error('Error al asignar padecimiento:', error);
  }
}

// =====================================
// MATERIAS DE ESTUDIANTES
// =====================================

/**
 * Ejemplo 18: Listar materias de un estudiante
 */
export async function exampleListStudentSubjects(studentId: string) {
  try {
    const response = await studentSubjects.list(studentId);
    console.log('Materias del estudiante:', response.data);
  } catch (error) {
    console.error('Error al listar materias:', error);
  }
}

/**
 * Ejemplo 19: Asignar materia a estudiante
 */
export async function exampleAssignSubjectToStudent(studentId: string, subjectId: string) {
  try {
    const result = await studentSubjects.create({
      student_id: studentId,
      subject_id: subjectId,
    });
    console.log('Materia asignada:', result.id);
  } catch (error) {
    console.error('Error al asignar materia:', error);
  }
}

// =====================================
// INSCRIPCIONES
// =====================================

/**
 * Ejemplo 20: Listar inscripciones
 */
export async function exampleListEnrollments(studentId?: string) {
  try {
    const response = await enrollments.list(studentId);
    console.log('Inscripciones:', response.data);
  } catch (error) {
    console.error('Error al listar inscripciones:', error);
  }
}

/**
 * Ejemplo 21: Crear inscripción
 */
export async function exampleCreateEnrollment() {
  try {
    const enrollment = await enrollments.create({
      student_id: 'alumno-id-123',
      program_id: 'programa-id-456',
      status: 'active',
      enrollment_date: new Date().toISOString(),
    });
    console.log('Inscripción creada:', enrollment.id);
  } catch (error) {
    console.error('Error al crear inscripción:', error);
  }
}

// =====================================
// DOCUMENTOS
// =====================================

/**
 * Ejemplo 22: Listar documentos de un estudiante
 */
export async function exampleListDocuments(studentId: string) {
  try {
    const response = await documents.list(studentId);
    console.log('Documentos:', response.data);
  } catch (error) {
    console.error('Error al listar documentos:', error);
  }
}

/**
 * Ejemplo 23: Subir documento
 */
export async function exampleUploadDocument(file: File, studentId: string, subjectId?: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_id', studentId);
    if (subjectId) formData.append('subject_id', subjectId);

    const result = await documents.upload(formData);
    console.log('Documento subido:', result.id);
  } catch (error) {
    console.error('Error al subir documento:', error);
  }
}

// =====================================
// DASHBOARD
// =====================================

/**
 * Ejemplo 24: Obtener estadísticas
 */
export async function exampleGetDashboardStats() {
  try {
    const stats = await dashboard.getStats();
    console.log('Estadísticas:', stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
}

/**
 * Ejemplo 25: Obtener estadísticas filtradas por fecha
 */
export async function exampleGetDashboardStatsByDate(fromDate: string, toDate: string) {
  try {
    const stats = await dashboard.getStats(fromDate, toDate);
    console.log('Estadísticas (filtradas):', stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
}

// =====================================
// NOTAS IMPORTANTES
// =====================================

/**
 * VENTAJAS DE USAR ENDPOINTS COMO CONSTANTES:
 * 
 * ❌ ANTES (sin constantes):
 * ```
 * const response = await fetch('https://nok-nok-api.onrender.com/api/students/', {
 *   method: 'GET',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * ```
 * 
 * ✅ AHORA (con constantes):
 * ```
 * const response = await students.list();
 * ```
 * 
 * BENEFICIOS:
 * - Endpoints definidos en un solo lugar
 * - Fácil de actualizar si cambian las rutas
 * - Código más limpio y legible
 * - Menos propenso a errores de tipeo
 * - Consistencia en toda la aplicación
 * - Autocomplete en el IDE
 */
