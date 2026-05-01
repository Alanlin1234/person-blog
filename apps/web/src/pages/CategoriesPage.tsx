import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useI18n } from '../i18n/I18nProvider';

type CatRow = { id: string; name: string; slug: string; children?: CatRow[] };

function flatten(nodes: CatRow[]): CatRow[] {
  const o: CatRow[] = [];
  const w = (n: CatRow[]) => {
    for (const x of n) {
      o.push({ id: x.id, name: x.name, slug: x.slug });
      if (x.children?.length) w(x.children);
    }
  };
  w(nodes);
  return o;
}

export function CategoriesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<CatRow[]>([]);

  useEffect(() => {
    void api<CatRow[]>('/taxonomy/categories')
      .then((tree) => setRows(flatten(tree)))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900">{t('categories.title')}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 && <p className="text-sm text-zinc-500">{t('categories.empty')}</p>}
        {rows.map((c) => (
          <Link
            key={c.id}
            to={`/search?q=${encodeURIComponent(c.name)}`}
            className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-card transition hover:border-brand/40 hover:shadow-md"
          >
            <p className="font-semibold text-zinc-900">{c.name}</p>
            <p className="mt-2 text-sm text-brand">{t('home.categoryExplore')} →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
