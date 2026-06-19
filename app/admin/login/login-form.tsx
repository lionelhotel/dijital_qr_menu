"use client";

import { useActionState } from "react";
import { Lock, User } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">E-posta veya kullanıcı adı</span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="identifier" autoComplete="username" className="pl-10" required />
        </div>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Parola</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="password" type="password" autoComplete="current-password" className="pl-10" required />
        </div>
      </label>
      {state.error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Giriş yapılıyor" : "Giriş yap"}
      </Button>
    </form>
  );
}
