import { Component, ErrorInfo, ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Outdated Optimize Dep');

    return {
      hasError: true,
      message: isChunkError
        ? 'Se detecto un error de carga de modulos. Cierra esta vista y vuelve a entrar.'
        : 'Ocurrio un error inesperado en la aplicacion.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary captured an error:', error, info);
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-4">
        <div className="max-w-lg w-full rounded-3xl bg-white p-8 shadow-xl border border-gray-100 text-center">
          <h1 className="text-2xl font-black text-cyan-900 mb-3">Ups, algo salio mal</h1>
          <p className="text-sm text-gray-700">{this.state.message}</p>
        </div>
      </div>
    );
  }
}
