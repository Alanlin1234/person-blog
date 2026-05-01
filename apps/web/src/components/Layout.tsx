import { Link, NavLink, Outlet } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { api, authStorage } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';
import { SiteFooter } from './SiteFooter';

function navClass(isActive: boolean) {
  return isActive ? 'text-brand font-medium' : 'text-zinc-600 hover:text-zinc-900';
}

export function Layout() {
  const { t, lang, setLang } = useI18n();
  const authed = !!authStorage.getAccess();

  const userInitial = useMemo(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}') as { displayName?: string; email?: string };
      const s = u.displayName || u.email || '';
      return s.slice(0, 1).toUpperCase() || '?';
    } catch {
      return '?';
    }
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    void api<{ themePreference?: string }>('/users/me')
      .then((m) => {
        if (m.themePreference) document.documentElement.dataset.theme = m.themePreference;
      })
      .catch(() => undefined);
  }, [authed]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/80">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 shadow-header backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
            <Link to="/" className="shrink-0 text-lg font-bold tracking-tight">
              <span className="text-brand">Person</span>
              <span className="text-zinc-900">Blog</span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm md:flex lg:gap-2">
              <NavLink className={({ isActive }) => `rounded-lg px-2 py-1.5 ${navClass(isActive)}`} end to="/">
                {t('nav.home')}
              </NavLink>
              <NavLink className={({ isActive }) => `rounded-lg px-2 py-1.5 ${navClass(isActive)}`} to="/#posts">
                {t('nav.archives')}
              </NavLink>
              <NavLink className={({ isActive }) => `rounded-lg px-2 py-1.5 ${navClass(isActive)}`} to="/categories">
                {t('nav.categories')}
              </NavLink>
              <NavLink className={({ isActive }) => `rounded-lg px-2 py-1.5 ${navClass(isActive)}`} to="/tags">
                {t('nav.tags')}
              </NavLink>
              <NavLink className={({ isActive }) => `rounded-lg px-2 py-1.5 ${navClass(isActive)}`} to="/about">
                {t('nav.about')}
              </NavLink>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                type="button"
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  lang === 'en' ? 'bg-white text-brand shadow-sm' : 'text-zinc-500'
                }`}
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                {t('nav.langEn')}
              </button>
              <button
                type="button"
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  lang === 'zh' ? 'bg-white text-brand shadow-sm' : 'text-zinc-500'
                }`}
                aria-pressed={lang === 'zh'}
                onClick={() => setLang('zh')}
              >
                {t('nav.langZh')}
              </button>
            </div>

            <Link
              to="/search"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-brand"
              aria-label={t('nav.search')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            <Link
              to={authed ? '/admin' : '/login'}
              className="hidden rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-hover sm:inline-block"
            >
              {t('nav.write')}
            </Link>

            {authed ? (
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand ring-2 ring-brand/20 hover:bg-brand/15"
              >
                {userInitial}
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-brand hover:text-brand"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
        <nav className="flex border-t border-zinc-100 px-4 py-2 md:hidden">
          <div className="mx-auto flex max-w-content flex-wrap justify-center gap-2 text-xs">
            <NavLink className={({ isActive }) => `px-2 py-1 ${navClass(isActive)}`} end to="/">
              {t('nav.home')}
            </NavLink>
            <NavLink className={({ isActive }) => `px-2 py-1 ${navClass(isActive)}`} to="/categories">
              {t('nav.categories')}
            </NavLink>
            <NavLink className={({ isActive }) => `px-2 py-1 ${navClass(isActive)}`} to="/tags">
              {t('nav.tags')}
            </NavLink>
            <NavLink className={({ isActive }) => `px-2 py-1 ${navClass(isActive)}`} to="/about">
              {t('nav.about')}
            </NavLink>
            <Link to={authed ? '/admin' : '/login'} className="px-2 py-1 text-brand">
              {t('nav.write')}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
