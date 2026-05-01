import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { demoPostsList } from '../content/demo-posts';
import { useI18n } from '../i18n/I18nProvider';

type Hit = { id: string; title: string; slug: string; snippet: string; publishedAt?: string | null; viewCount?: number };
type CatRow = { id: string; name: string; slug: string; children?: CatRow[] };
type TagRow = { id: string; name: string; slug: string };

type Tab = 'articles' | 'categories' | 'tags';

function flattenCats(nodes: CatRow[]): CatRow[] {
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

const PAGE_SIZE = 10;

export function SearchPage() {
  const { t, lang } = useI18n();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('articles');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [cats, setCats] = useState<CatRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);

  const runSearch = useCallback(
    async (query: string, pageArg: number) => {
      setErr(null);
      setSearched(true);
      setPage(pageArg);
      try {
        const data = await api<{ items: Hit[]; total: number }>(
          `/search?q=${encodeURIComponent(query)}&page=${pageArg}&pageSize=${PAGE_SIZE}`,
        );
        setItems(data.items);
        setTotal(data.total);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : t('search.errorGeneric'));
        setItems([]);
        setTotal(0);
      }
    },
    [t],
  );

  useEffect(() => {
    void api<CatRow[]>('/taxonomy/categories')
      .then((tree) => setCats(flattenCats(tree)))
      .catch(() => setCats([]));
    void api<TagRow[]>('/taxonomy/tags')
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const qParam = searchParams.get('q') || '';
  useEffect(() => {
    if (!qParam) return;
    setQ(qParam);
    setTab('articles');
    void runSearch(qParam, 1);
  }, [qParam, runSearch]);

  async function run(e?: React.FormEvent, pageArg = 1) {
    e?.preventDefault();
    await runSearch(q, pageArg);
  }

  const samples = demoPostsList(lang);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-center text-2xl font-bold text-zinc-900">{t('search.title')}</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-500">{t('search.blurb')}</p>

      <form onSubmit={(e) => void run(e, 1)} className="mx-auto mt-8 flex max-w-2xl gap-2">
        <input
          className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm shadow-sm outline-none focus:border-brand"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.placeholder')}
        />
        <button className="rounded-xl bg-brand px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover" type="submit">
          {t('search.submit')}
        </button>
      </form>

      <div className="mx-auto mt-10 flex max-w-2xl justify-center gap-2 border-b border-zinc-200">
        {(['articles', 'categories', 'tags'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`relative px-4 py-3 text-sm font-medium ${
              tab === k ? 'text-brand' : 'text-zinc-500 hover:text-zinc-800'
            }`}
            onClick={() => setTab(k)}
          >
            {k === 'articles' && `${t('search.tabArticles')}`}
            {k === 'categories' && `${t('search.tabCategories')} (${cats.length})`}
            {k === 'tags' && `${t('search.tabTags')} (${tags.length})`}
            {tab === k && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        {tab === 'articles' && (
          <>
            {err && <p className="text-center text-sm text-red-600">{err}</p>}
            {searched && !err && items.length === 0 && (
              <p className="text-center text-sm text-zinc-500">{t('search.noResults')}</p>
            )}
            <ul className="space-y-4">
              {items.map((h) => (
                <li key={h.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
                  <Link className="text-lg font-semibold text-zinc-900 hover:text-brand" to={`/posts/${h.slug}`}>
                    {h.title}
                  </Link>
                  <div
                    className="mt-2 line-clamp-2 text-sm text-zinc-600"
                    dangerouslySetInnerHTML={{ __html: h.snippet }}
                  />
                  <div className="mt-2 text-xs text-zinc-400">
                    {h.viewCount != null && `${h.viewCount} ${t('common.views')}`}
                  </div>
                </li>
              ))}
            </ul>
            {searched && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4 text-sm">
                <button
                  type="button"
                  disabled={page <= 1}
                  className="rounded-lg border border-zinc-200 px-3 py-1 disabled:opacity-40"
                  onClick={() => void runSearch(q, page - 1)}
                >
                  {t('search.prev')}
                </button>
                <span className="text-zinc-500">
                  {t('search.page')} {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  className="rounded-lg border border-zinc-200 px-3 py-1 disabled:opacity-40"
                  onClick={() => void runSearch(q, page + 1)}
                >
                  {t('search.next')}
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'categories' && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {cats.length === 0 && <p className="text-sm text-zinc-500">{t('categories.empty')}</p>}
            {cats.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/search?q=${encodeURIComponent(c.name)}`}
                  className="block rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-card hover:border-brand/30"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {tab === 'tags' && (
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && <p className="text-sm text-zinc-500">{t('tags.empty')}</p>}
            {tags.map((g) => (
              <Link
                key={g.id}
                to={`/search?q=${encodeURIComponent(g.name)}`}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:border-brand hover:text-brand"
              >
                {g.name}
              </Link>
            ))}
          </div>
        )}

        {!searched && tab === 'articles' && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-6">
            <p className="text-sm font-medium text-zinc-800">{t('search.sampleHeading')}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {samples.map((p) => (
                <li key={p.slug}>
                  <Link className="text-brand hover:underline" to={`/posts/${p.slug}`}>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
