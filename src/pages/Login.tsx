import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          setError('');
          setEmail('');
          setPassword('');
          setIsSignUp(false);
          alert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError('Credenciales inválidassssss');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-20 w-64 h-64 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-green-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-200 rounded-full opacity-30 blur-3xl"></div>
      </div>

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-12 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black mb-2">
            <span className="text-green-500">LOG</span>
            <span className="text-blue-600">-IN</span>
          </h1>
          <p className="text-sm text-gray-600">
            {isSignUp ? 'Crea una nueva cuenta' : 'Accede a tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 uppercase tracking-wide"
          >
            {loading ? (isSignUp ? 'Creando cuenta...' : 'Ingresando...') : (isSignUp ? 'Crear Cuenta' : 'Ingresar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            {' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
              }}
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10">
        <div className="text-right">
          <span className="text-2xl font-black text-green-500">NOKNOK</span>
          <br />
          <span className="text-sm font-semibold text-gray-600">ACADEMY</span>
        </div>
      </div>
    </div>
  );
}
