import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import FieldError from '../components/FieldError';
import { auth } from '../lib/api';
import doodles from '../assets/Doodles.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFieldError('');

    if (!email.trim()) {
      setFieldError('Escribe tu correo para enviarte las instrucciones');
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
          <div className="mb-4 flex justify-center">
            <BrandLogo size="lg" className="justify-center" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-cyan-900 sm:text-3xl">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-cyan-800/80 sm:text-base">Te enviaremos instrucciones para restablecer tu contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-cyan-900/80">Correo electrónico</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-700" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldError) {
                    setFieldError('');
                  }
                }}
                aria-invalid={Boolean(fieldError)}
                className={`w-full rounded-2xl py-3 pl-11 pr-4 text-cyan-900 outline-none transition focus:bg-white focus:ring-4 ${
                  fieldError
                    ? 'bg-rose-50 ring-4 ring-rose-100'
                    : 'bg-cyan-50/50 focus:ring-cyan-100'
                }`}
              />
            </div>
            <FieldError message={fieldError} />
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
