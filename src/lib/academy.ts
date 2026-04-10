import type { Enrollment, Program } from './api';

export interface ProgramOption {
  id: string;
  name: string;
  description?: string;
}

export type EnrollmentType = 'semanal' | 'mensual' | 'por_nivel' | 'programa_completo';

export const ENROLLMENT_TYPE_OPTIONS: Array<{ value: EnrollmentType; label: string }> = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'por_nivel', label: 'Por nivel' },
  { value: 'programa_completo', label: 'Programa completo' },
];

export const getEnrollmentTypeLabel = (value?: string | null) => {
  if (!value) return 'Sin tipo';

  const option = ENROLLMENT_TYPE_OPTIONS.find((item) => item.value === value);
  if (option) return option.label;

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const findProgramByStoredValue = (programs: Program[], value?: string | null) => {
  if (!value) return null;

  return programs.find((program) => program.id === value || program.name === value) || null;
};

export const getProgramFromEnrollment = (programs: Program[], enrollment?: Pick<Enrollment, 'programId' | 'program'> | null) => {
  if (!enrollment) return null;

  return findProgramByStoredValue(programs, enrollment.programId || enrollment.program || null);
};

export const getProgramNameFromEnrollment = (programs: Program[], enrollment?: Pick<Enrollment, 'programId' | 'program'> | null) => {
  const program = getProgramFromEnrollment(programs, enrollment);

  return program?.name || enrollment?.program || 'Sin programa';
};

export const sortEnrollmentsByDate = <T extends { enrollmentDate: string }>(items: T[]) => {
  return [...items].sort(
    (left, right) => new Date(right.enrollmentDate).getTime() - new Date(left.enrollmentDate).getTime()
  );
};

export const getAvailableProgramOptions = (programs: Program[], selectedValue?: string | null): ProgramOption[] => {
  const selectedProgram = findProgramByStoredValue(programs, selectedValue);
  const activePrograms = programs.filter((program) => program.status === 'active');

  if (selectedProgram && !activePrograms.some((program) => program.id === selectedProgram.id)) {
    activePrograms.unshift(selectedProgram);
  }

  return activePrograms.map((program) => ({
    id: program.id,
    name: program.name,
    description: program.description || '',
  }));
};