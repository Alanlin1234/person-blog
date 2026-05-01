import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type C = {
  id: string;
  body: string;
  createdAt: string;
  user: { displayName?: string | null; email: string };
  post: { title: string; slug: string };
};

export function AdminCommentsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<C[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api<C[]>('/admin/comments/pending');
      setRows(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('comments.failed'));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, path: string) {
    await api(`/admin/comments/${id}/${path}`, { method: 'POST' });
    await load();
  }

  if (err) return <p className="p-6 text-red-600">{err}</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link className="text-sm text-indigo-600 hover:underline" to="/admin">
        {t('comments.back')}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{t('comments.title')}</h1>
      <ul className="mt-6 space-y-4">
        {rows.map((c) => (
          <li key={c.id} className="rounded border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-500">
              {c.post.title} · {c.user.displayName || c.user.email} ·{' '}
              {new Date(c.createdAt).toLocaleString(locale)}
            </div>
            <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                onClick={() => void act(c.id, 'approve')}
              >
                {t('comments.approve')}
              </button>
              <button
                type="button"
                className="rounded bg-amber-600 px-3 py-1 text-sm text-white"
                onClick={() => void act(c.id, 'reject')}
              >
                {t('comments.reject')}
              </button>
              <button type="button" className="rounded bg-red-600 px-3 py-1 text-sm text-white" onClick={() => void act(c.id, 'delete')}>
                {t('comments.delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
