import { useState, FormEvent, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from '../components/BrandLogo';
import FieldError from '../components/FieldError';
import doodles from '../assets/Doodles.png';

const AddStudentModal = lazy(() => import('../components/AddStudentModal'));

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showStudentPreview, setShowStudentPreview] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = 'Escribe tu correo para continuar';
    }

    if (!password.trim()) {
      nextErrors.password = 'Escribe tu contraseña para continuar';
    }

    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-4 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-repeat opacity-12 pointer-events-none"
          style={{ backgroundImage: `url(${doodles})`, backgroundSize: '420px' }}
        ></div>
        <div className="absolute inset-0 bg-white/50 pointer-events-none"></div>
        <div className="absolute top-10 right-20 h-64 w-64 rounded-full bg-cyan-200 opacity-30 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-emerald-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 h-80 w-80 rounded-full bg-blue-200 opacity-25 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-lime-200 opacity-25 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-white/95 p-8 shadow-[0_28px_80px_rgba(14,116,144,0.16)] backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="xl" className="justify-center" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-cyan-900 sm:text-3xl">
              Iniciar sesión
            </h1>
            <p className="text-sm text-cyan-800/80 sm:text-base">
              Accede a tu cuenta
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              className={`w-full rounded-2xl px-4 py-3 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                fieldErrors.email
                  ? 'bg-rose-50 ring-4 ring-rose-100'
                  : 'bg-gray-100 focus:ring-gray-200'
              }`}
            />
            <FieldError message={fieldErrors.email} />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.password)}
                className={`w-full rounded-2xl px-4 py-3 pr-11 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                  fieldErrors.password
                    ? 'bg-rose-50 ring-4 ring-rose-100'
                    : 'bg-gray-100 focus:ring-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-cyan-700 transition hover:bg-cyan-100 hover:text-cyan-900"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError message={fieldErrors.password} />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:from-cyan-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-cyan-800 transition hover:text-cyan-950"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>

        <div className="mt-6 pt-4 text-center">
       
          <p className="text-xs font-medium tracking-wide text-cyan-900/60">
            Acceso seguro para administración interna
          </p>
        </div>
      </div>

      {showStudentPreview && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-3xl p-8"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" /></div></div>}>
          <AddStudentModal
            previewMode
            onClose={() => setShowStudentPreview(false)}
            onSuccess={() => setShowStudentPreview(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
