import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, authStorage } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type Row = { id: string; title: string; slug: string; status: string; updatedAt: string };

export function AdminPage() {
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}') as { roles?: string[] };

  useEffect(() => {
    if (!authStorage.getAccess()) {
      nav('/login');
      return;
    }
    api<{ items: Row[] }>('/posts/mine?pageSize=50')
      .then((d) => setRows(d.items))
      .catch(() => nav('/login'));
  }, [nav]);

  async function createDraft() {
    const p = await api<{ id: string }>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: t('admin.draftTitle'),
        htmlContent: '<p></p>',
      }),
    });
    nav(`/admin/posts/${p.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('admin.title')}</h1>
        <button
          type="button"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => void createDraft()}
        >
          {t('admin.newDraft')}
        </button>
      </div>
      <ul className="mt-6 divide-y rounded border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" to={`/admin/posts/${r.id}`}>
                {r.title}
              </Link>
              <div className="text-xs text-zinc-500">
                {r.status} · {new Date(r.updatedAt).toLocaleString(locale)}
              </div>
            </div>
            <Link className="text-sm text-zinc-600 hover:underline dark:text-zinc-400" to={`/posts/${r.slug}`}>
              {t('admin.view')}
            </Link>
          </li>
        ))}
      </ul>
      {user.roles?.includes('admin') && (
        <p className="mt-8 text-sm">
          <Link className="text-indigo-600 hover:underline" to="/admin/comments">
            {t('admin.commentsLink')}
          </Link>
        </p>
      )}
    </div>
  );
}
