import { useCallback, useState, useEffect } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type FileUploadProps = {
  onFileSelect: (file: File | string | null) => void;
  accept?: Accept;
  maxSize?: number;
  currentFile?: string | null;
  onRemove?: () => void;
  label?: string;
  id?: string;
};

export function FileUpload({
  onFileSelect,
  accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  maxSize = 5 * 1024 * 1024, // 5MB
  currentFile,
  onRemove,
  label = 'Dosya Yükle',
  id,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  // Load current file preview if exists
  useEffect(() => {
    if (currentFile) {
      // If it's a base64 data URL or a web URL (Cloudinary), use it directly
      if (currentFile.startsWith('data:') || currentFile.startsWith('http')) {
        setPreview(currentFile);
      } else {
        // Otherwise, try to load via IPC (for Electron local files)
        // Only if electronAPI is available
        if (window.electronAPI) {
          window.electronAPI.invoke<string | null>('students:get-photo-base64', currentFile)
            .then((base64) => {
              if (base64) setPreview(base64);
            })
            .catch(() => {
              // Ignore errors
            });
        }
      }
    }
  }, [currentFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      {preview ? (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-[#dbe6de] bg-white shadow-sm">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#f8faf8]',
            isDragActive
              ? 'border-[#50B83C] bg-[#e8f7ec]'
              : 'border-[#dbe6de] hover:border-[#50B83C] hover:bg-[#f1f7f3]'
          )}
        >
          <input {...getInputProps()} id={id} />
          <Upload className="mx-auto h-8 w-8 text-[#6b7c6f] mb-2" />
          <p className="text-sm text-[#6b7c6f]">
            {isDragActive ? 'Dosyayı buraya bırakın' : 'Dosyayı sürükleyin veya tıklayın'}
          </p>
          <p className="text-xs text-[#8aa190] mt-1">Maksimum {maxSize / 1024 / 1024}MB</p>
        </div>
      )}
    </div>
  );
}

