"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignInButton({ className = "btn sm", children = "Sign in with Discord", callbackUrl, direct = false }) {
  if (!direct) {
    const href = callbackUrl ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signin";
    return <Link className={className} href={href}>{children}</Link>;
  }

  return (
    <button className={className} onClick={() => signIn("discord", callbackUrl ? { callbackUrl } : undefined)}>
      {children}
    </button>
  );
}
