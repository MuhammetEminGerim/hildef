import { useState } from 'react';
import { User } from 'lucide-react';

export default function StudentPhoto({
  path,
  url,
  name,
  size = 'md',
}: {
  path?: string | null;
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const imageSrc = url || (path ? `app://local-file/${path}` : null);

  if (!imageSrc || hasError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
        <User className={size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      onError={() => setHasError(true)}
    />
  );
}

