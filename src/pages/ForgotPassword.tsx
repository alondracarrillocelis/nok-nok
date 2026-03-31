import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { auth } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('El correo es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const response = await auth.forgotPassword(email.trim());
      setMessage(response.message || 'Solicitud procesada. Revisa tu correo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud.');
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
          <h1 className="text-2xl font-black tracking-tight text-cyan-900 sm:text-3xl">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-cyan-800/80 sm:text-base">Te enviaremos instrucciones para restablecer tu contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">Correo electrónico</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-cyan-50/50 py-3 pl-11 pr-4 text-cyan-900 outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-100"
                required
              />
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:from-cyan-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
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
