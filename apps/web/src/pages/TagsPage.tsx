import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type TagRow = { id: string; name: string; slug: string };

export function TagsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<TagRow[]>([]);

  useEffect(() => {
    void api<TagRow[]>('/taxonomy/tags')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900">{t('tags.title')}</h1>
      <div className="mt-8 flex flex-wrap gap-3">
        {rows.length === 0 && <p className="text-sm text-zinc-500">{t('tags.empty')}</p>}
        {rows.map((g) => (
          <Link
            key={g.id}
            to={`/search?q=${encodeURIComponent(g.name)}`}
            className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:border-brand hover:text-brand"
          >
            {g.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
