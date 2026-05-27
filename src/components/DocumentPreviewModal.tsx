import { useState } from 'react';
import { X, Download } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  fileName: string;
  fileUrl: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  isOpen,
  fileName,
  fileUrl,
  onClose,
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded successfully:', fileUrl);
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    console.error('PDF iframe failed to load:', fileUrl);
    setError('No se pudo cargar el PDF. El archivo podría no estar disponible o la URL podría ser inválida.');
    setIsLoading(false);
  };

  if (!isOpen) return null;

  // Validate URL
  const isValidUrl = fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'));

  if (!isValidUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-gray-700 font-medium mb-2">URL de archivo inválida</p>
              <p className="text-gray-600 text-sm mb-4">
                El archivo no tiene una URL válida. Esto podría significar que:
              </p>
              <ul className="text-gray-600 text-sm mb-6 text-left bg-gray-50 p-4 rounded-lg space-y-2">
                <li>• El archivo aún no se ha subido correctamente</li>
                <li>• El bucket de Supabase no está configurado</li>
                <li>• No hay acceso al archivo</li>
              </ul>
              <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded break-all">
                URL: {fileUrl || '(vacía)'}
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use Google Docs Viewer as a fallback (works for most PDFs)
  const googleViewerUrl = `https://docs.google.com/gvjs?url=${encodeURIComponent(fileUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <a
              href={fileUrl}
              download={fileName}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors"
              title="Descargar documento"
            >
              <Download size={16} />
              Descargar
            </a>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                <p className="mt-3 text-gray-600 text-sm">Cargando documento...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center max-w-md p-6">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-gray-700 font-medium mb-2">No se pudo previsualizarse</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-100 p-2 rounded break-all">
                  URL: {fileUrl}
                </p>
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  Descargar archivo
                </a>
                <p className="text-xs text-gray-500 mt-4">
                  Comparte la URL anterior con el equipo de backend para debuggear el problema
                </p>
              </div>
            </div>
          )}

          {!error && (
            <iframe
              key={fileUrl}
              src={`${fileUrl}#toolbar=0&navpanes=0`}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className="w-full h-full border-0"
              title={`Vista previa de ${fileName}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
