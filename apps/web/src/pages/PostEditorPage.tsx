import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { RichEditor } from '../components/RichEditor';
import { SafeHtml } from '../components/SafeHtml';
import { useI18n } from '../i18n/I18nProvider';

type Post = {
  id: string;
  title: string;
  htmlContent: string;
  status: string;
};

export function PostEditorPage() {
  const { t, locale } = useI18n();
  const { id } = useParams();
  const nav = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Post>(`/posts/${id}`)
      .then((p) => {
        setPost(p);
        setTitle(p.title);
        setHtml(p.htmlContent);
      })
      .catch((e) => setErr(String(e.message)));
  }, [id]);

  async function saveDraft() {
    if (!id) return;
    try {
      await api(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, htmlContent: html }),
      });
      setSavedAt(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!id) return;
    const timer = setInterval(() => {
      void saveDraft();
    }, 30_000);
    return () => clearInterval(timer);
  }, [id, title, html]);

  async function publish() {
    if (!id) return;
    await saveDraft();
    await api(`/posts/${id}/publish`, { method: 'POST' });
    nav('/');
  }

  if (err) return <p className="p-6 text-red-600">{err}</p>;
  if (!post) return <p className="p-6 text-zinc-500">{t('editor.loading')}</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm text-indigo-600 hover:underline" to="/admin">
          {t('editor.back')}
        </Link>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-3 py-1 text-sm dark:border-zinc-600" onClick={() => void saveDraft()}>
            {t('editor.saveNow')}
          </button>
          <button type="button" className="rounded border px-3 py-1 text-sm dark:border-zinc-600" onClick={() => setPreview((v) => !v)}>
            {preview ? t('editor.edit') : t('editor.preview')}
          </button>
          <button type="button" className="rounded bg-indigo-600 px-3 py-1 text-sm text-white" onClick={() => void publish()}>
            {t('editor.publish')}
          </button>
        </div>
      </div>
      {savedAt && (
        <p className="mt-2 text-xs text-zinc-500">
          {t('editor.savedAt')} {savedAt}
        </p>
      )}
      <input
        className="mt-6 w-full rounded border px-3 py-2 text-2xl font-semibold dark:border-zinc-700 dark:bg-zinc-900"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="mt-6">
        {preview ? <SafeHtml html={html} /> : <RichEditor key={post.id} content={html} onChange={setHtml} />}
      </div>
    </div>
  );
}
