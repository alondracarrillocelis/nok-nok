import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { auth } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token.trim()) {
      setError('El token es obligatorio');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const response = await auth.resetPassword(token.trim(), newPassword);
      setMessage(response.message || 'Contraseña actualizada exitosamente.');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-4 py-10">
      <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-white/95 p-8 shadow-[0_28px_80px_rgba(14,116,144,0.16)] backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo size="lg" className="justify-center" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-cyan-900 sm:text-3xl">Restablecer contraseña</h1>
          <p className="mt-2 text-sm text-cyan-800/80 sm:text-base">Ingresa el token y tu nueva contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-2xl bg-cyan-50/50 px-4 py-3 text-cyan-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-100"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">Nueva contraseña</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl bg-cyan-50/50 py-3 pl-11 pr-11 text-cyan-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-100"
                required
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
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:from-cyan-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 transition hover:text-cyan-950">
            <ArrowLeft size={16} />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
