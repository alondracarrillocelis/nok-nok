import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { auth } from '../lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      if (!token) {
        if (!active) return;
        setError('Token de verificación no proporcionado.');
        setLoading(false);
        return;
      }

      try {
        const response = await auth.verifyEmail(token);
        if (!active) return;
        setMessage(response.message || 'Cuenta activada exitosamente.');
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'No se pudo verificar el correo.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void verify();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-4 py-10">
      <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-white/95 p-8 shadow-[0_28px_80px_rgba(14,116,144,0.16)] backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo size="lg" className="justify-center" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-cyan-900 sm:text-3xl">Verificación de correo</h1>
        </div>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-cyan-800">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-medium">Verificando cuenta...</span>
            </div>
          )}

          {!loading && message && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
              <XCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </div>

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
