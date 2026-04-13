import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Enrollment, enrollments, programs as programsApi, Program, students, Student } from '../lib/api';
import { getEnrollmentTypeLabel, getProgramNameFromEnrollment, sortEnrollmentsByDate } from '../lib/academy';
import Layout from '../components/Layout';
import { showToast } from '../components/Toast';

interface StatusPoint {
  name: string;
  value: number;
}

interface LevelPoint {
  level: string;
  count: number;
}

interface ProgramPoint {
  program: string;
  count: number;
}

interface MonthPoint {
  month: string;
  altas: number;
}

interface ExpiringEnrollment {
  id: string;
  studentName: string;
  program: string;
  enrollmentDate: string;
  enrollmentType: string;
  dueDate: string | null;
  dueLabel: string;
  statusLabel: string;
  daysUntilDue: number | null;
}

const STATUS_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
const UPCOMING_THRESHOLD_DAYS = 7;

const formatStudentName = (student?: Pick<Student, 'firstName' | 'paternalSurname' | 'maternalSurname'> | null) => {
  if (!student) return 'Alumno';

  return [student.firstName, student.paternalSurname, student.maternalSurname].filter(Boolean).join(' ') || 'Alumno';
};

const isValidDate = (value?: string | null) => {
  if (!value) return false;
  return !Number.isNaN(new Date(value).getTime());
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addMonths = (date: Date, months: number) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
};

const getEnrollmentDueDate = (enrollment: Enrollment) => {
  if (isValidDate(enrollment.dueDate)) {
    return new Date(enrollment.dueDate as string);
  }

  if (!isValidDate(enrollment.enrollmentDate)) {
    return null;
  }

  const enrollmentDate = new Date(enrollment.enrollmentDate);

  switch (enrollment.enrollmentType) {
    case 'semanal':
      return addDays(enrollmentDate, 7);
    case 'mensual':
      return addMonths(enrollmentDate, 1);
    case 'trimestral':
      return addMonths(enrollmentDate, 3);
    case 'anual':
      return addMonths(enrollmentDate, 12);
    default:
      return null;
  }
};

const getDueStatusLabel = (daysUntilDue: number | null) => {
  if (daysUntilDue === null) return 'Sin fecha de vencimiento';
  if (daysUntilDue < 0) return 'Vencida';
  if (daysUntilDue === 0) return 'Vence hoy';
  if (daysUntilDue <= UPCOMING_THRESHOLD_DAYS) return `Vence en ${daysUntilDue} dia${daysUntilDue === 1 ? '' : 's'}`;
  return 'Vigente';
};

const getDueLabel = (dueDate: Date | null) => {
  if (!dueDate) return 'Sin fecha';
  return dueDate.toLocaleDateString('es-MX');
};

const getDuePriority = (daysUntilDue: number | null) => {
  if (daysUntilDue === null) return Number.MAX_SAFE_INTEGER;
  if (daysUntilDue < 0) return Number.MAX_SAFE_INTEGER - 1;
  return daysUntilDue;
};

const loadAllStudents = async () => {
  const firstPage = await students.list({ page: 1, limit: 100 });
  const totalPages = firstPage.pagination?.totalPages || 1;

  if (totalPages <= 1) {
    return firstPage.data || [];
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => students.list({ page: index + 2, limit: 100 }))
  );

  return [
    ...(firstPage.data || []),
    ...remainingPages.flatMap((response) => response.data || []),
  ];
};

export default function Dashboard() {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [programCatalog, setProgramCatalog] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringEnrollments, setExpiringEnrollments] = useState<ExpiringEnrollment[]>([]);
  const [programSlide, setProgramSlide] = useState(0);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsData, enrollmentsResponse, programsResponse] = await Promise.all([
        loadAllStudents(),
        enrollments.list(),
        programsApi.list(),
      ]);
      const nextEnrollments = (enrollmentsResponse.data || []).filter(
        (enrollment) => enrollment.studentId && enrollment.status !== 'dropped' && enrollment.status !== 'baja'
      );
      const studentsById = new Map(studentsData.map((student) => [student.id, student]));

      setAllStudents(studentsData);
      setAllEnrollments(nextEnrollments);
      setProgramCatalog(programsResponse);

      const latestEnrollments = Array.from(
        nextEnrollments.reduce((map, enrollment) => {
          const previous = map.get(enrollment.studentId);
          if (!previous) {
            map.set(enrollment.studentId, enrollment);
            return map;
          }

          const sorted = sortEnrollmentsByDate([previous, enrollment]);
          map.set(enrollment.studentId, sorted[0]);
          return map;
        }, new Map<string, Enrollment>()).values()
      );

      const nextExpiringEnrollments = latestEnrollments
        .map((enrollment) => {
          const student = studentsById.get(enrollment.studentId);
          const dueDate = getEnrollmentDueDate(enrollment);
          const daysUntilDue = dueDate
            ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return {
            id: enrollment.id,
            studentName: formatStudentName(student),
            program: getProgramNameFromEnrollment(programsResponse, enrollment),
            enrollmentDate: isValidDate(enrollment.enrollmentDate)
              ? new Date(enrollment.enrollmentDate).toLocaleDateString('es-MX')
              : 'Sin fecha',
            enrollmentType: getEnrollmentTypeLabel(enrollment.enrollmentType),
            dueDate: dueDate ? dueDate.toISOString() : null,
            dueLabel: getDueLabel(dueDate),
            statusLabel: getDueStatusLabel(daysUntilDue),
            daysUntilDue,
          } satisfies ExpiringEnrollment;
        })
        .filter((enrollment) => enrollment.program !== 'Sin programa' && (enrollment.dueDate || enrollment.enrollmentType !== 'Sin tipo'))
        .sort((left, right) => {
          const dueComparison = getDuePriority(left.daysUntilDue) - getDuePriority(right.daysUntilDue);
          if (dueComparison !== 0) return dueComparison;
          return left.studentName.localeCompare(right.studentName, 'es');
        });

      setExpiringEnrollments(nextExpiringEnrollments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = allStudents.length;

  const studentEnrollmentTimeline = useMemo(() => {
    const latestEnrollmentsByStudent = allEnrollments.reduce((map, enrollment) => {
      const previous = map.get(enrollment.studentId);

      if (!previous) {
        map.set(enrollment.studentId, enrollment);
        return map;
      }

      const sorted = sortEnrollmentsByDate([previous, enrollment]);
      map.set(enrollment.studentId, sorted[0]);
      return map;
    }, new Map<string, Enrollment>());

    return allStudents
      .map((student) => {
        const fallbackEnrollment = latestEnrollmentsByStudent.get(student.id);
        const enrollmentDate = student.enrollmentDate || fallbackEnrollment?.enrollmentDate || null;

        if (!isValidDate(enrollmentDate)) {
          return null;
        }

        return {
          studentId: student.id,
          enrollmentDate: enrollmentDate as string,
        };
      })
      .filter((entry): entry is { studentId: string; enrollmentDate: string } => Boolean(entry));
  }, [allEnrollments, allStudents]);

  const statusCounts = useMemo(() => {
    const counts = {
      active: 0,
      pending: 0,
      dropped: 0,
    };

    for (const student of allStudents) {
      if (student.status === 'active') counts.active += 1;
      else if (student.status === 'pending') counts.pending += 1;
      else if (student.status === 'dropped') counts.dropped += 1;
    }

    return counts;
  }, [allStudents]);

  const thisMonthEnrollments = useMemo(() => {
    const now = new Date();
    return studentEnrollmentTimeline.filter((entry) => {
      const d = new Date(entry.enrollmentDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [studentEnrollmentTimeline]);

  const statusChartData: StatusPoint[] = [
    { name: 'Activos', value: statusCounts.active },
    { name: 'Pendientes', value: statusCounts.pending },
    { name: 'Dados de baja', value: statusCounts.dropped },
  ];

  const totalDropouts = statusCounts.dropped;

  const levelChartData: LevelPoint[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const student of allStudents) {
      const level = student.currentLevel || 'Sin nivel';
      map.set(level, (map.get(level) || 0) + 1);
    }
    return Array.from(map.entries()).map(([level, count]) => ({ level, count }));
  }, [allStudents]);

  const programChartData: ProgramPoint[] = useMemo(() => {
    const countsByProgramId = new Map<string, Set<string>>();
    const countsByProgramName = new Map<string, Set<string>>();

    for (const program of programCatalog) {
      countsByProgramId.set(program.id, new Set<string>());
      countsByProgramName.set(program.name, new Set<string>());
    }

    for (const enrollment of allEnrollments) {
      const resolvedProgram = enrollment.programId
        ? programCatalog.find((program) => program.id === enrollment.programId) || null
        : null;
      const resolvedProgramName = resolvedProgram?.name || getProgramNameFromEnrollment(programCatalog, enrollment);

      if (resolvedProgram?.id) {
        countsByProgramId.get(resolvedProgram.id)?.add(enrollment.studentId);
      }

      if (resolvedProgramName && resolvedProgramName !== 'Sin programa') {
        if (!countsByProgramName.has(resolvedProgramName)) {
          countsByProgramName.set(resolvedProgramName, new Set<string>());
        }
        countsByProgramName.get(resolvedProgramName)?.add(enrollment.studentId);
      }
    }

    const existingPrograms = programCatalog.map((program) => ({
      program: program.name,
      count: countsByProgramId.get(program.id)?.size || countsByProgramName.get(program.name)?.size || 0,
    }));

    const orphanPrograms = Array.from(countsByProgramName.entries())
      .filter(([programName]) => !programCatalog.some((program) => program.name === programName))
      .map(([programName, studentIds]) => ({
        program: programName,
        count: studentIds.size,
      }));

    return [...existingPrograms, ...orphanPrograms];
  }, [allEnrollments, programCatalog]);

  const programSlides = useMemo(() => {
    if (programChartData.length === 0) {
      return [{ program: 'Sin programa', count: 0 }];
    }
    return [...programChartData].sort((a, b) => b.count - a.count);
  }, [programChartData]);

  const activeProgram = programSlides[Math.min(programSlide, programSlides.length - 1)] || { program: 'Sin programa', count: 0 };

  const ageChartData = useMemo(() => {
    const ranges = [
      { key: '3-5', min: 3, max: 5, count: 0 },
      { key: '6-8', min: 6, max: 8, count: 0 },
      { key: '9-11', min: 9, max: 11, count: 0 },
      { key: '12-14', min: 12, max: 14, count: 0 },
      { key: '15+', min: 15, max: 120, count: 0 },
      { key: 'Sin dato', min: -1, max: -1, count: 0 },
    ];

    const currentYear = new Date().getFullYear();
    for (const student of allStudents) {
      if (!student.birthDate) {
        ranges[5].count += 1;
        continue;
      }

      const birth = new Date(student.birthDate);
      if (Number.isNaN(birth.getTime())) {
        ranges[5].count += 1;
        continue;
      }

      const age = currentYear - birth.getFullYear();
      const range = ranges.find((r) => r.min <= age && age <= r.max);
      if (range) {
        range.count += 1;
      } else {
        ranges[5].count += 1;
      }
    }

    return ranges.map((r) => ({ range: r.key, count: r.count }));
  }, [allStudents]);

  useEffect(() => {
    if (programSlide > programSlides.length - 1) {
      setProgramSlide(0);
    }
  }, [programSlides, programSlide]);

  const monthlyEnrollmentsData: MonthPoint[] = useMemo(() => {
    const now = new Date();
    const months: MonthPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('es-MX', { month: 'short' }).toUpperCase();
      const altas = studentEnrollmentTimeline.filter((entry) => {
        const d = new Date(entry.enrollmentDate);
        const dKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return dKey === key;
      }).length;
      months.push({ month: monthLabel, altas });
    }
    return months;
  }, [studentEnrollmentTimeline]);

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-3xl shadow-lg p-10 text-center text-gray-600">
          Cargando estadísticas...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-xs uppercase text-gray-500 font-semibold">Total Alumnos</p>
            <p className="text-5xl font-black text-blue-900 mt-2">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-xs uppercase text-gray-500 font-semibold">Activos</p>
            <p className="text-5xl font-black text-green-600 mt-2">{statusCounts.active}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-xs uppercase text-gray-500 font-semibold">Pendientes</p>
            <p className="text-5xl font-black text-yellow-500 mt-2">{statusCounts.pending}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-xs uppercase text-gray-500 font-semibold">Bajas</p>
            <p className="text-5xl font-black text-red-600 mt-2">{totalDropouts}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 xl:col-span-1">
            <h2 className="text-lg font-bold text-gray-800">Programas Inscritos</h2>
            <div className="rounded-2xl border border-gray-200 p-6 min-h-[180px] flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Programa</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{activeProgram.program}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Alumnos inscritos</p>
                <p className="text-5xl font-black text-amber-500 leading-none">{activeProgram.count}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setProgramSlide((prev) => (prev === 0 ? programSlides.length - 1 : prev - 1))}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Anterior
              </button>
              <p className="text-sm text-gray-500">
                {programSlides.length === 0 ? 0 : programSlide + 1} de {programSlides.length}
              </p>
              <button
                type="button"
                onClick={() => setProgramSlide((prev) => (prev + 1) % programSlides.length)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 xl:col-span-2">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Altas de Alumnos (Últimos 6 Meses)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyEnrollmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="altas" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 text-sm text-gray-600">
              Altas del mes actual: <span className="font-bold text-indigo-600">{thisMonthEnrollments}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 xl:col-span-1">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Distribución por Estatus</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" outerRadius={95} label>
                  {statusChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 xl:col-span-2">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Alumnos Inscritos por Edad</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Alumnos por Nivel</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={levelChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="level" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Top Programas</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={programSlides.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="program" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Inscripciones Próximas a Vencer</h2>
          {expiringEnrollments.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay inscripciones próximas a vencer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Alumno</th>
                    <th className="py-2">Programa</th>
                    <th className="py-2">Fecha de inscripcion</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2">Vence</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringEnrollments.slice(0, 10).map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{enrollment.studentName}</td>
                      <td className="py-2 text-gray-700">{enrollment.program}</td>
                      <td className="py-2 text-gray-700">{enrollment.enrollmentDate}</td>
                      <td className="py-2 text-gray-700">{enrollment.enrollmentType}</td>
                      <td className="py-2 text-gray-700">{enrollment.dueLabel}</td>
                      <td className="py-2 text-gray-700">{enrollment.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
