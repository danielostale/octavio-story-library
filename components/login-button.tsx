"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button
      className="primary"
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/new" })}
    >
      Entrar con Google
    </button>
  );
}
