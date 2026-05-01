import { useEffect, useState } from 'react';
import { api, authStorage } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type Me = {
  displayName?: string | null;
  bio?: string | null;
  themePreference: string;
};

export function ProfilePage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<Me>('/users/me')
      .then((m) => {
        setMe(m);
        setBio(m.bio || '');
        setDisplayName(m.displayName || '');
        setTheme((m.themePreference as 'light' | 'dark' | 'sepia') || 'light');
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    await api('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName, bio, themePreference: theme }),
    });
    document.documentElement.dataset.theme = theme;
    setMsg(t('profile.saved'));
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    authStorage.setAccess(null);
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  if (!me) return <p className="p-6 text-zinc-500">{t('profile.loading')}</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold">{t('profile.title')}</h1>
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('profile.displayName')}</span>
          <input
            className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('profile.bio')}</span>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('profile.theme')}</span>
          <select
            className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'sepia')}
          >
            <option value="light">{t('profile.themeLight')}</option>
            <option value="dark">{t('profile.themeDark')}</option>
            <option value="sepia">{t('profile.themeSepia')}</option>
          </select>
        </label>
        {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}
        <button type="button" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white" onClick={() => void save()}>
          {t('profile.save')}
        </button>
        <button type="button" className="ml-3 rounded border px-4 py-2 text-sm dark:border-zinc-600" onClick={() => void logout()}>
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}
