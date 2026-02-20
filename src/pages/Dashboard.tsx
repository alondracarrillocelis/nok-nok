import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

interface Student {
  id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string;
  enrollment_date: string;
}

interface Enrollment {
  due_date: string;
  student_id: string;
}

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudents, setActiveStudents] = useState(0);
  const [averageGrade, setAverageGrade] = useState(9.3);
  const [expiringEnrollments, setExpiringEnrollments] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'activo');

    if (studentsData) {
      setStudents(studentsData);
      setActiveStudents(studentsData.length);
    }

    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('*, students(first_name, paternal_surname, maternal_surname)')
      .order('due_date', { ascending: true })
      .limit(3);

    if (enrollmentsData) {
      setExpiringEnrollments(enrollmentsData);
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

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-blue-900 mb-2">
            {activeStudents}
          </div>
          <div className="text-sm font-bold text-blue-900 uppercase tracking-wide text-center">
            Alumnos Activos
          </div>
        </div>

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
