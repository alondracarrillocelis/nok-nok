import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboard, students } from '../lib/api';
import Layout from '../components/Layout';

interface Student {
  id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string;
  enrollment_date: string;
  birth_date?: string;
  current_level?: string;
  status: string;
}

interface Enrollment {
  due_date: string;
  student_id: string;
}

interface ProgramCount {
  program: string;
  count: number;
}

interface AgeGroup {
  age: string;
  count: number;
}

interface LevelCount {
  level: string;
  count: number;
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudents, setActiveStudents] = useState(0);
  const [droppedStudents, setDroppedStudents] = useState(0);
  const [thisMonthEnrollments, setThisMonthEnrollments] = useState(0);
  const [averageGrade, setAverageGrade] = useState(9.3);
  const [expiringEnrollments, setExpiringEnrollments] = useState<any[]>([]);
  const [programCounts, setProgramCounts] = useState<ProgramCount[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([]);
  const [currentProgramIndex, setCurrentProgramIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch dashboard stats
      const stats = await dashboard.getStats();
      
      // Fetch students data for additional calculations
      const studentsResponse = await students.list(1, 1000); // Get many students
      const studentsData = studentsResponse.data;

      if (studentsData) {
        setStudents(studentsData);
        setActiveStudents(studentsData.filter(s => s.status === 'activo').length);
        setDroppedStudents(studentsData.filter(s => s.status === 'baja').length);

        // Calculate students enrolled this month
        const now = new Date();
        const thisMonth = studentsData.filter(s => {
          const enrollmentDate = new Date(s.enrollment_date);
          return enrollmentDate.getMonth() === now.getMonth() && enrollmentDate.getFullYear() === now.getFullYear();
        }).length;
        setThisMonthEnrollments(thisMonth);

        // Calculate program counts (assuming program is stored in students or inscriptions)
        // For now, using a mock or assuming from inscriptions
        const programMap = new Map<string, number>();
        studentsData.forEach(student => {
          const program = student.current_level || 'Sin Programa'; // Adjust based on actual field
          programMap.set(program, (programMap.get(program) || 0) + 1);
        });
        const programs = Array.from(programMap.entries()).map(([program, count]) => ({ program, count }));
        setProgramCounts(programs);

        // Calculate age groups
        const ageMap = new Map<string, number>();
        studentsData.forEach(student => {
          if (student.birth_date) {
            const age = new Date().getFullYear() - new Date(student.birth_date).getFullYear();
            const group = age < 10 ? '0-9' : age < 20 ? '10-19' : age < 30 ? '20-29' : '30+';
            ageMap.set(group, (ageMap.get(group) || 0) + 1);
          }
        });
        const ages = Array.from(ageMap.entries()).map(([age, count]) => ({ age, count }));
        setAgeGroups(ages);

        // Calculate level counts
        const levelMap = new Map<string, number>();
        studentsData.forEach(student => {
          const level = student.current_level || 'Sin Nivel';
          levelMap.set(level, (levelMap.get(level) || 0) + 1);
        });
        const levels = Array.from(levelMap.entries()).map(([level, count]) => ({ level, count }));
        setLevelCounts(levels);
      }

      // Use stats from API if available
      if (stats) {
        // Update state with API stats if they exist
        if (stats.active_students !== undefined) setActiveStudents(stats.active_students);
        if (stats.dropped_students !== undefined) setDroppedStudents(stats.dropped_students);
        if (stats.this_month_enrollments !== undefined) setThisMonthEnrollments(stats.this_month_enrollments);
        if (stats.average_grade !== undefined) setAverageGrade(stats.average_grade);
        if (stats.program_counts) setProgramCounts(stats.program_counts);
        if (stats.age_groups) setAgeGroups(stats.age_groups);
        if (stats.level_counts) setLevelCounts(stats.level_counts);
        if (stats.expiring_enrollments) setExpiringEnrollments(stats.expiring_enrollments);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const enrollmentChartData = [
    { month: 'ENE', value: 10 },
    { month: 'FEB', value: 15 },
    { month: 'MAR', value: 22 },
    { month: 'ABR', value: 30 },
    { month: 'MAY', value: 40 },
    { month: 'JUN', value: 52 },
    { month: 'JUL', value: 68 },
    { month: 'AGO', value: 85 },
    { month: 'SEP', value: 95 },
    { month: 'OCT', value: 100 },
  ];

  const nextProgram = () => {
    setCurrentProgramIndex((prev) => (prev + 1) % programCounts.length);
  };

  const prevProgram = () => {
    setCurrentProgramIndex((prev) => (prev - 1 + programCounts.length) % programCounts.length);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Program Carousel */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 uppercase">
            Inscripciones por Programa
          </h2>
          {programCounts.length > 0 ? (
            <div className="relative">
              <div className="text-center">
                <div className="text-4xl font-black text-green-600 mb-2">
                  {programCounts[currentProgramIndex]?.count || 0}
                </div>
                <div className="text-sm font-bold text-gray-700 uppercase">
                  {programCounts[currentProgramIndex]?.program || ''}
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button onClick={prevProgram} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  ‹
                </button>
                <button onClick={nextProgram} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  ›
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No hay datos</p>
          )}
        </div>

        {/* Age Groups Chart */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 uppercase">
            Alumnos por Edad
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="age" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Level Counts Chart */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 uppercase">
            Alumnos por Nivel Escolar
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={levelCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="level" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expiring Enrollments */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 uppercase">
            Vencimiento de Inscripción
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm font-semibold text-gray-600">
                  <th className="pb-3">Nombre</th>
                  <th className="pb-3">Vencimiento</th>
                  <th className="pb-3">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {expiringEnrollments.slice(0, 3).map((enrollment, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="py-3 text-blue-600 font-semibold">
                      {enrollment.students?.first_name} {enrollment.students?.paternal_surname}
                    </td>
                    <td className="py-3 text-gray-700">
                      {new Date(enrollment.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-gray-700">61H000000</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enrollment Chart */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 uppercase">
            Inscripciones 2026
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={enrollmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dropped Students */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-red-600 mb-2">
            {droppedStudents}
          </div>
          <div className="text-sm font-bold text-red-600 uppercase tracking-wide text-center">
            Alumnos Dados de Baja
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Mes pasado: {droppedStudents} {/* Placeholder, need to filter by month */}
          </div>
        </div>

        {/* This Month Enrollments */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-green-600 mb-2">
            {thisMonthEnrollments}
          </div>
          <div className="text-sm font-bold text-green-600 uppercase tracking-wide text-center">
            Inscripciones Este Mes
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-blue-900 mb-2">
            {activeStudents}
          </div>
          <div className="text-sm font-bold text-blue-900 uppercase tracking-wide text-center">
            Alumnos Activos
          </div>
        </div>

        {/* Average Grade */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-blue-900 mb-2">
            {averageGrade.toFixed(1)}
          </div>
          <div className="text-sm font-bold text-blue-900 uppercase tracking-wide text-center">
            Promedio General
          </div>
        </div>
      </div>
    </Layout>
  );
}
