import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, User, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from '../components/BrandLogo';
import FieldError from '../components/FieldError';
import doodles from '../assets/Doodles.png';

export default function Register() {
  const { signUp } = useAuth();

  const [role, setRole] = useState<'admin' | 'tutor'>('admin');

  const [form, setForm] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = 'Escribe tu nombre';
    if (!form.paternalSurname.trim()) errors.paternalSurname = 'Escribe tu apellido paterno';
    if (!form.maternalSurname.trim()) errors.maternalSurname = 'Escribe tu apellido materno';

    if (!form.email.trim()) {
      errors.email = 'Escribe tu correo electrónico';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Correo electrónico no válido';
    }

    if (!form.phone.trim()) {
      errors.phone = 'Escribe tu teléfono';
    } else if (!/^\d{10,15}$/.test(form.phone.replace(/\D/g, ''))) {
      errors.phone = 'Teléfono debe tener entre 10 y 15 dígitos';
    }

    if (!form.password) {
      errors.password = 'Escribe una contraseña';
    } else if (form.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validate()) return;

    setLoading(true);

    try {
      const { error: signUpError, message } = await signUp(
        form.firstName,
        form.paternalSurname,
        form.maternalSurname,
        form.email,
        form.password,
        form.phone.replace(/\D/g, ''),
        role
      );

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccessMessage(
          message || 'Cuenta creada exitosamente. Revisa tu correo para verificar tu cuenta.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-4 py-10">
        <div
          className="absolute inset-0 bg-repeat opacity-12 pointer-events-none"
          style={{ backgroundImage: `url(${doodles})`, backgroundSize: '420px' }}
        />
        <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-white/95 p-8 shadow-[0_28px_80px_rgba(14,116,144,0.16)] backdrop-blur sm:p-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Mail size={32} className="text-emerald-600" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-cyan-900">
            Revisa tu correo
          </h2>
          <p className="mb-6 text-sm text-cyan-800/80">
            {successMessage}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:from-cyan-700 hover:to-emerald-700"
          >
            <ArrowLeft size={16} />
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-4 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-repeat opacity-12 pointer-events-none"
          style={{ backgroundImage: `url(${doodles})`, backgroundSize: '420px' }}
        />
        <div className="absolute inset-0 bg-white/50 pointer-events-none" />
        <div className="absolute top-10 right-20 h-64 w-64 rounded-full bg-cyan-200 opacity-30 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-emerald-200 opacity-30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-white/95 p-8 shadow-[0_28px_80px_rgba(14,116,144,0.16)] backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo size="xl" className="justify-center" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-cyan-900 sm:text-3xl">
              Crear cuenta
            </h1>
            <p className="text-sm text-cyan-800/80 sm:text-base">
              Regístrate para acceder al sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Nombre(s)
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              aria-invalid={Boolean(fieldErrors.firstName)}
              className={`w-full rounded-2xl px-4 py-3 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                fieldErrors.firstName
                  ? 'bg-rose-50 ring-4 ring-rose-100'
                  : 'bg-gray-100 focus:ring-gray-200'
              }`}
            />
            <FieldError message={fieldErrors.firstName} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
                Ap. Paterno
              </label>
              <input
                type="text"
                value={form.paternalSurname}
                onChange={(e) => updateField('paternalSurname', e.target.value)}
                aria-invalid={Boolean(fieldErrors.paternalSurname)}
                className={`w-full rounded-2xl px-4 py-3 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                  fieldErrors.paternalSurname
                    ? 'bg-rose-50 ring-4 ring-rose-100'
                    : 'bg-gray-100 focus:ring-gray-200'
                }`}
              />
              <FieldError message={fieldErrors.paternalSurname} />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
                Ap. Materno
              </label>
              <input
                type="text"
                value={form.maternalSurname}
                onChange={(e) => updateField('maternalSurname', e.target.value)}
                aria-invalid={Boolean(fieldErrors.maternalSurname)}
                className={`w-full rounded-2xl px-4 py-3 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                  fieldErrors.maternalSurname
                    ? 'bg-rose-50 ring-4 ring-rose-100'
                    : 'bg-gray-100 focus:ring-gray-200'
                }`}
              />
              <FieldError message={fieldErrors.maternalSurname} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Rol
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  role === 'admin'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <User size={18} />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('tutor')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  role === 'tutor'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                <GraduationCap size={18} />
                Tutor
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
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
              Teléfono
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              aria-invalid={Boolean(fieldErrors.phone)}
              placeholder="10-15 dígitos"
              className={`w-full rounded-2xl px-4 py-3 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                fieldErrors.phone
                  ? 'bg-rose-50 ring-4 ring-rose-100'
                  : 'bg-gray-100 focus:ring-gray-200'
              }`}
            />
            <FieldError message={fieldErrors.phone} />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
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

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                className={`w-full rounded-2xl px-4 py-3 pr-11 text-gray-800 outline-none transition focus:bg-white focus:ring-4 ${
                  fieldErrors.confirmPassword
                    ? 'bg-rose-50 ring-4 ring-rose-100'
                    : 'bg-gray-100 focus:ring-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-cyan-700 transition hover:bg-cyan-100 hover:text-cyan-900"
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError message={fieldErrors.confirmPassword} />
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
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 transition hover:text-cyan-950"
            >
              <ArrowLeft size={16} />
              ¿Ya tienes cuenta? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
