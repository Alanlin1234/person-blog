import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, authStorage } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type Mode = 'login' | 'register';

export function AuthPage({ mode }: { mode: Mode }) {
  const { t } = useI18n();
  const nav = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loginErr, setLoginErr] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  const [regMsg, setRegMsg] = useState<string | null>(null);
  const [regErr, setRegErr] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(null);
    try {
      const res = await api<{ accessToken: string; user: { roles: string[]; displayName?: string | null } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email: loginEmail, password: loginPassword, remember }) },
      );
      authStorage.setAccess(res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      nav('/');
    } catch (e: unknown) {
      setLoginErr(e instanceof Error ? e.message : t('login.errorGeneric'));
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegErr(null);
    setRegMsg(null);
    if (regPassword !== regPassword2) {
      setRegErr(t('register.passwordMismatch'));
      return;
    }
    if (!terms) {
      setRegErr(t('register.termsRequired'));
      return;
    }
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail, password: regPassword, displayName: displayName || undefined }),
      });
      setRegMsg(t('register.success'));
    } catch (e: unknown) {
      setRegErr(e instanceof Error ? e.message : t('register.errorGeneric'));
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        <section
          className={`rounded-2xl border bg-white p-8 shadow-card ${mode === 'login' ? 'border-brand ring-2 ring-brand/20' : 'border-zinc-100'}`}
        >
          <h2 className="text-xl font-bold text-zinc-900">{t('login.title')}</h2>
          <p className="mt-2 text-xs text-zinc-500">{t('login.seedHint')}</p>
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">{t('login.email')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">{t('login.password')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                {t('login.remember')}
              </label>
              <span className="text-xs text-zinc-400">{t('login.forgot')}</span>
            </div>
            {loginErr && <p className="text-sm text-red-600">{loginErr}</p>}
            <button type="submit" className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
              {t('login.submit')}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-zinc-500">{t('login.oauthHint')}</p>
          <div className="mt-3 flex justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-400">GH</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-400">G</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-400">W</span>
          </div>
        </section>

        <section
          className={`rounded-2xl border bg-white p-8 shadow-card ${mode === 'register' ? 'border-brand ring-2 ring-brand/20' : 'border-zinc-100'}`}
        >
          <h2 className="text-xl font-bold text-zinc-900">{t('register.title')}</h2>
          <p className="mt-2 text-xs text-zinc-500">{t('register.passwordHint')}</p>
          <form onSubmit={onRegister} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">{t('register.displayName')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">{t('register.email')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                type="email"
                required
                onChange={(e) => setRegEmail(e.target.value)}
                value={regEmail}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">{t('register.password')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">{t('register.confirmPassword')}</span>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
                type="password"
                required
                value={regPassword2}
                onChange={(e) => setRegPassword2(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              {t('register.terms')}
            </label>
            {regErr && <p className="text-sm text-red-600">{regErr}</p>}
            {regMsg && <p className="text-sm text-green-700">{regMsg}</p>}
            <button type="submit" className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
              {t('register.submit')}
            </button>
          </form>
        </section>
      </div>
      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link className="text-brand hover:underline" to="/">
          {t('post.backHome')}
        </Link>
      </p>
    </div>
  );
}
