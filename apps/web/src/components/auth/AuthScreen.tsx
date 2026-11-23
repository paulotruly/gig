'use client';

import { loginBody, registerBody } from '@gig/shared/contracts';
import React, { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { FormError, PrimaryButton, TextField } from '@/components/ui/states';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { errorMessage } from '@/lib/useResource';

type Mode = 'login' | 'register';

/** "G" oficial do Google, nas cores da marca. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const { login, register } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    if (new URLSearchParams(window.location.search).get('erro') === 'google') {
      setError('Não foi possível entrar com o Google. Tente novamente.');
    }
    void api
      .authProviders()
      .then((providers) => {
        if (active) setGoogleEnabled(providers.google);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
          <Logo className="h-11 w-auto mb-1" />
          <h1 className="text-lg font-black text-[#111827]">
            {mode === 'login' ? 'Entrar no GiG' : 'Criar sua conta'}
          </h1>
          <p className="text-xs text-[#64748B]">Gestão financeira e educação para o seu negócio.</p>
        </div>

        {googleEnabled && (
          <>
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white border border-[#E6EFE2] text-sm font-bold text-[#111827] shadow-xs transition-all hover:bg-[#F3FCE2] hover:border-[#D7FD3C] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FD3C]"
            >
              <GoogleIcon />
              {mode === 'login' ? 'Entrar com Google' : 'Criar conta com Google'}
            </a>
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              <span className="h-px flex-1 bg-[#E6EFE2]" />
              ou com e-mail
              <span className="h-px flex-1 bg-[#E6EFE2]" />
            </div>
          </>
        )}
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
