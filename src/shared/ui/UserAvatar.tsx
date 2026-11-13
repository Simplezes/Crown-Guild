"use client";

import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
  unoptimized?: boolean;
}

function AvatarContent({
  src,
  alt = "",
  size = 40,
  className = "",
  fallbackClassName = "",
  unoptimized = true,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        className={`${className} ${fallbackClassName}`}
        style={{ width: size, height: size, display: "grid", placeItems: "center", flex: "none" }}
        aria-label={alt || "User avatar"}
      >
        {(alt || "?").slice(0, 2).toUpperCase()}
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
      onError={() => setFailed(true)}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function UserAvatar(props: UserAvatarProps) {
  return <AvatarContent key={props.src || "fallback"} {...props} />;
}
