import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { demoPostsForHome } from '../content/demo-posts';
import { useI18n } from '../i18n/I18nProvider';

type TagRef = { tag: { id: string; name: string; slug: string } };
type CatRef = { category: { id: string; name: string; slug: string } };

type Item = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  viewCount: number;
  tags?: TagRef[];
  categories?: CatRef[];
};

type CatRow = { id: string; name: string; slug: string; children?: CatRow[] };

type LoadState = { status: 'loading' } | { status: 'live'; items: Item[]; total: number } | { status: 'demo' };

const HERO_BG =
  'linear-gradient(105deg, rgba(15,23,42,0.55) 0%, rgba(24,144,255,0.35) 100%), url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80)';

function coverUrl(slug: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/320/200`;
}

function firstLabel(item: Item, fallback: string) {
  const c = item.categories?.[0]?.category?.name;
  if (c) return c;
  const tg = item.tags?.[0]?.tag?.name;
  if (tg) return tg;
  return fallback;
}

function flattenCategories(nodes: CatRow[]): CatRow[] {
  const out: CatRow[] = [];
  const walk = (n: CatRow[]) => {
    for (const x of n) {
      out.push({ id: x.id, name: x.name, slug: x.slug });
      if (x.children?.length) walk(x.children);
    }
  };
  walk(nodes);
  return out.slice(0, 8);
}

export function HomePage() {
  const { t, locale, lang } = useI18n();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [cats, setCats] = useState<CatRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    api<{ items: Item[]; total: number }>('/public/posts?page=1&pageSize=20')
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'live', items: data.items, total: data.total });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'demo' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void api<CatRow[]>('/taxonomy/categories')
      .then((tree) => setCats(flattenCategories(tree)))
      .catch(() => setCats([]));
  }, []);

  const demoItems = demoPostsForHome(lang) as Item[];

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-zinc-500">{t('common.loading')}</p>
      </div>
    );
  }

  const items = state.status === 'live' ? state.items : demoItems;
  const showEmptyLive = state.status === 'live' && state.total === 0;

  return (
    <div>
      <section
        className="relative flex min-h-[380px] flex-col items-center justify-center bg-zinc-900 bg-cover bg-center px-4 py-20 text-center text-white"
        style={{ backgroundImage: HERO_BG }}
      >
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight drop-shadow-sm md:text-4xl">{t('home.heroHeading')}</h1>
        <p className="mt-4 max-w-xl text-sm text-white/90 md:text-base">{t('home.heroSub')}</p>
        <a
          href="#posts"
          className="mt-8 inline-flex rounded-lg bg-brand px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-hover"
        >
          {t('home.heroCta')}
        </a>
      </section>

      <div className="mx-auto max-w-content px-4 py-14">
        {showEmptyLive && (
          <div className="mb-10 rounded-xl border border-zinc-200 bg-white p-5 shadow-card">
            <p className="font-medium text-zinc-900">{t('home.emptyTitle')}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {t('home.emptyLead')}{' '}
              <Link className="font-medium text-brand hover:underline" to="/admin">
                {t('home.emptyAdmin')}
              </Link>{' '}
              {t('home.emptyTrail')}
            </p>
          </div>
        )}

        <h2 id="posts" className="text-xl font-bold text-zinc-900 scroll-mt-24">
          {t('home.sectionLatest')}
        </h2>
        <ul className="mt-8 space-y-6">
          {items.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-card transition hover:shadow-md"
            >
              <Link to={`/posts/${p.slug}`} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-6 sm:p-5">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-32 sm:w-44">
                  <img
                    src={coverUrl(p.slug)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <span className="inline-block rounded-full bg-brand/10 px-3 py-0.5 text-xs font-medium text-brand">
                    {firstLabel(p, t('home.defaultCategory'))}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-900 transition group-hover:text-brand">{p.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    {p.publishedAt && (
                      <span>{new Date(p.publishedAt).toLocaleDateString(locale, { dateStyle: 'medium' })}</span>
                    )}
                    <span>
                      {p.viewCount} {t('common.views')}
                    </span>
                    <span className="text-zinc-400">· 0 {t('common.comments')}</span>
                  </div>
                  {p.excerpt && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600">{p.excerpt}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-16 text-xl font-bold text-zinc-900">{t('home.sectionCategories')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cats.length === 0 && (
            <p className="col-span-full text-sm text-zinc-500">{t('categories.empty')}</p>
          )}
          {cats.map((c) => (
            <Link
              key={c.id}
              to={`/search?q=${encodeURIComponent(c.name)}`}
              className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-card transition hover:border-brand/30 hover:shadow-md"
            >
              <p className="font-semibold text-zinc-900">{c.name}</p>
              <p className="mt-3 text-sm text-brand">{t('home.categoryExplore')} →</p>
            </Link>
          ))}
        </div>

        <section className="mt-16 flex flex-col items-center gap-6 rounded-2xl border border-zinc-100 bg-white p-8 shadow-card md:flex-row md:items-start md:gap-10">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 text-3xl font-bold text-brand">
            PB
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{t('home.aboutTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{t('home.aboutBio')}</p>
            <Link to="/about" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
              {t('nav.about')} →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
