import { useId, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { showToast } from './Toast';

interface DragDropUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
  label?: string;
}

export default function DragDropUpload({
  onFilesSelected,
  accept = '.pdf',
  maxFiles = 20,
  maxFileSizeMB = 10,
  label = 'Arrastra archivos aquí o haz clic para seleccionar',
}: DragDropUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles: File[]) => {
    const validTypeFiles = newFiles.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return accept.includes(ext);
    });

    if (validTypeFiles.length !== newFiles.length) {
      showToast(`Solo se permiten archivos ${accept.toUpperCase()}`, 'error');
    }

    const maxBytes = maxFileSizeMB * 1024 * 1024;
    const validFiles = validTypeFiles.filter((file) => file.size <= maxBytes);

    if (validFiles.length !== validTypeFiles.length) {
      showToast(`Cada archivo debe pesar máximo ${maxFileSizeMB}MB`, 'error');
    }

    if (validFiles.length + files.length > maxFiles) {
      showToast(`Máximo ${maxFiles} archivos permitidos`, 'error');
      return;
    }

    if (validFiles.length === 0) {
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const openFileExplorer = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-green-400'
        }`}
      >
        <Upload className="mx-auto mb-3 text-green-500" size={32} />
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
        <p className="text-xs text-gray-500 mb-4">
          Formatos: {accept.toUpperCase()} (Máximo {maxFiles} archivos, {maxFileSizeMB}MB c/u)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          id={inputId}
        />
        <button
          type="button"
          onClick={openFileExplorer}
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          Seleccionar Archivos
        </button>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700">Archivos seleccionados:</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <FileText size={18} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              >
                <X size={18} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
