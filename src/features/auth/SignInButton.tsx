"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import type { ReactNode } from "react";

interface SignInButtonProps {
  className?: string;
  children?: ReactNode;
  callbackUrl?: string;
  direct?: boolean;
}

export function SignInButton({
  className = "btn sm",
  children = "Sign in with Discord",
  callbackUrl,
  direct = false,
}: SignInButtonProps) {
  if (!direct) {
    const href = callbackUrl ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signin";
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={() => signIn("discord", callbackUrl ? { callbackUrl } : undefined)}
    >
      {children}
    </button>
  );
}
