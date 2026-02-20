import { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import AddStudentModal from '../components/AddStudentModal';

interface Student {
  id: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string;
  enrollment_number: string;
  current_level: string;
  enrollment_date: string;
  status: 'activo' | 'pendiente' | 'baja';
}

interface Tutor {
  name: string;
  phone: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setStudents(data);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        `${s.first_name} ${s.paternal_surname} ${s.maternal_surname}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const toggleStudentSelection = (id: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStudents(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            <Plus size={20} />
            <span>Agregar Alumno/a</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
                        } else {
                          setSelectedStudents(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Alumno/a
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Nivel Actual
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Fecha de Inscripción
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Tipo de Inscripción
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Tutor
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-blue-600">
                          {student.first_name} {student.paternal_surname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.enrollment_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {student.current_level || 'Principiante'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(student.enrollment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-600 hover:underline cursor-pointer">
                        Juan Díaz
                      </div>
                      <div className="text-sm text-gray-500">61H000000</div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('activo')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'activo'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Activo
          </button>
          <button
            onClick={() => setStatusFilter('pendiente')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'pendiente'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pendiente
          </button>
          <button
            onClick={() => setStatusFilter('baja')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              statusFilter === 'baja'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Baja
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchStudents();
          }}
        />
      )}
    </Layout>
  );
}
