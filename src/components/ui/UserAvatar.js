'use client';

import Image from 'next/image';
import { useState } from 'react';

function AvatarContent({
  src,
  alt = '',
  size = 40,
  className = '',
  fallbackClassName = '',
  unoptimized = true,
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden bg-white/5 ${className || ''} ${fallbackClassName}`}
        style={{ width: size, height: size }}
        aria-label={alt || 'User avatar'}
      >
        <div className="h-full w-full animate-pulse bg-white/10" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={unoptimized}
      onError={() => setHasError(true)}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export default function UserAvatar(props) {
  return <AvatarContent key={props.src || 'fallback'} {...props} />;
}
