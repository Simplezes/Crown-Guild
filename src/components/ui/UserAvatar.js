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
      <span
        className={`${className || ''} ${fallbackClassName}`}
        style={{ width: size, height: size, display: 'grid', placeItems: 'center', flex: 'none' }}
        aria-label={alt || 'User avatar'}
      >
        {(alt || '?').slice(0, 2).toUpperCase()}
      </span>
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
