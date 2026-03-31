import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toast } from './components/Toast';
import Login from './pages/Login';
import { lazy, Suspense } from 'react';

// Lazy load pages
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Students = lazy(() => import('./pages/Students'));
const Users = lazy(() => import('./pages/Users'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Profile = lazy(() => import('./pages/Profile'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-semibold">Cargando página...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <ForgotPassword />
              </Suspense>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <ResetPassword />
              </Suspense>
            }
          />
          <Route
            path="/verify-email"
            element={
              <Suspense fallback={<PageLoader />}>
                <VerifyEmail />
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Students />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Users />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Subjects />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toast />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
