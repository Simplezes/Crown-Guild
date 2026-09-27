"use client";

import { signIn } from "next-auth/react";

export default function SignInButton({ className = "btn sm", children = "Sign in with Discord", callbackUrl }) {
  return (
    <button className={className} onClick={() => signIn("discord", callbackUrl ? { callbackUrl } : undefined)}>
      {children}
    </button>
  );
}
