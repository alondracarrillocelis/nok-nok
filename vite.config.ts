import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-modals': [
            './src/components/AddStudentModal.tsx',
            './src/components/EditStudentModal.tsx',
            './src/components/AddUserModal.tsx',
            './src/components/EditSubjectModal.tsx',
            './src/components/ConfirmationModal.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
