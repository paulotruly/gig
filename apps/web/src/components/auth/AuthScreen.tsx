'use client';

import { loginBody, registerBody } from '@gig/shared/contracts';
import React, { useState } from 'react';
import { FormError, PrimaryButton, TextField } from '@/components/ui/states';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/useResource';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const { login, register } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    const parsed =
      mode === 'login'
        ? loginBody.safeParse({ email, password })
        : registerBody.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(
        mode === 'register' && password.length < 10
          ? 'A senha precisa ter pelo menos 10 caracteres.'
          : 'Confira os dados informados.',
      );
      return;
    }
    setSending(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAF5]">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E6EFE2] shadow-card p-6 space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo-transparent.png" alt="Greed is Great" className="h-12 w-auto" />
          <h1 className="text-lg font-black text-[#111827]">
            {mode === 'login' ? 'Entrar no GiG' : 'Criar sua conta'}
          </h1>
          <p className="text-xs text-[#64748B]">Gestão financeira e educação para o seu negócio.</p>
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          {mode === 'register' && (
            <TextField
              label="Nome"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === 'register' ? 10 : undefined}
            required
          />
          <FormError message={error} />
          <PrimaryButton type="submit" disabled={sending}>
            {sending ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </PrimaryButton>
        </form>

        <p className="text-center text-xs text-[#64748B]">
          {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(undefined);
            }}
            className="font-bold text-[#111827] hover:underline"
          >
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </main>
  );
}
