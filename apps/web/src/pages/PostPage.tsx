import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, authStorage } from '../lib/api';
import { SafeHtml } from '../components/SafeHtml';
import { getDemoPostBySlug } from '../content/demo-posts';
import { useI18n } from '../i18n/I18nProvider';

type Author = { id: string; displayName?: string | null; avatarUrl?: string | null };
type TagRef = { tag: { id: string; name: string; slug: string } };
type CatRef = { category: { id: string; name: string; slug: string } };

type PostFull = {
  id: string;
  title: string;
  slug: string;
  htmlContent: string;
  viewCount: number;
  publishedAt?: string | null;
  excerpt?: string | null;
  author?: Author | null;
  tags?: TagRef[];
  categories?: CatRef[];
};

type CommentNode = {
  id: string;
  body: string;
  createdAt: string;
  user: { displayName?: string | null; avatarUrl?: string | null; email?: string };
  replies?: CommentNode[];
};

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; source: 'api'; post: PostFull }
  | { status: 'ready'; source: 'demo'; slug: string }
  | { status: 'error' };

function CommentThread({ nodes, depth = 0 }: { nodes: CommentNode[]; depth?: number }) {
  const { locale } = useI18n();
  if (!nodes?.length) return null;
  return (
    <ul className={depth ? 'ml-6 mt-3 space-y-3 border-l border-zinc-200 pl-4' : 'space-y-4'}>
      {nodes.map((c) => (
        <li key={c.id} className="rounded-xl bg-zinc-50 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-medium text-zinc-800">{c.user.displayName || c.user.email || 'User'}</span>
            <span>·</span>
            <span>{new Date(c.createdAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{c.body}</p>
          {c.replies && c.replies.length > 0 && <CommentThread nodes={c.replies} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export function PostPage() {
  const { slug } = useParams();
  const { t, locale, lang } = useI18n();
  const langRef = useRef(lang);
  langRef.current = lang;
  const [state, setState] = useState<ViewState>({ status: 'loading' });
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentMsg, setCommentMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    api<PostFull>(`/public/posts/${encodeURIComponent(slug)}`)
      .then((p) => {
        if (cancelled) return;
        setState({ status: 'ready', source: 'api', post: p });
        void api(`/public/posts/${encodeURIComponent(slug)}/views`, { method: 'POST' }).catch(() => undefined);
        void api<CommentNode[]>(`/public/posts/${encodeURIComponent(slug)}/comments`)
          .then((list) => {
            if (!cancelled) setComments(Array.isArray(list) ? list : []);
          })
          .catch(() => {
            if (!cancelled) setComments([]);
          });
      })
      .catch(() => {
        if (cancelled) return;
        const demo = getDemoPostBySlug(slug, langRef.current);
        if (demo) {
          setState({ status: 'ready', source: 'demo', slug });
          setComments([]);
        } else setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const post = useMemo((): PostFull | null => {
    if (state.status !== 'ready') return null;
    if (state.source === 'api') return state.post;
    const d = getDemoPostBySlug(state.slug, lang);
    if (!d) return null;
    return {
      id: d.id,
      title: d.title,
      slug: d.slug,
      htmlContent: d.htmlContent,
      viewCount: d.viewCount,
      publishedAt: d.publishedAt,
      excerpt: d.excerpt,
      author: null,
      tags: [],
      categories: [],
    };
  }, [state, lang]);

  async function submitComment() {
    if (!post || state.status !== 'ready' || state.source !== 'api') return;
    if (!authStorage.getAccess()) {
      setCommentMsg(t('post.commentNeedLogin'));
      return;
    }
    const body = commentBody.trim();
    if (!body) return;
    setCommentMsg(null);
    try {
      await api('/comments', {
        method: 'POST',
        body: JSON.stringify({ postId: post.id, body }),
      });
      setCommentBody('');
      const list = await api<CommentNode[]>(`/public/posts/${encodeURIComponent(post.slug)}/comments`);
      setComments(Array.isArray(list) ? list : []);
    } catch (e) {
      setCommentMsg(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <p className="text-zinc-500">{t('post.loading')}</p>
      </div>
    );
  }
  if (state.status === 'error' || (state.status === 'ready' && !post)) {
    return (
      <div className="mx-auto max-w-content px-4 py-20 text-center">
        <p className="text-red-600">{t('post.errorNotFound')}</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-hover">
          {t('post.backHome')}
        </Link>
      </div>
    );
  }

  const cat = post!.categories?.[0]?.category?.name;
  const meta = [
    cat,
    post!.publishedAt ? new Date(post!.publishedAt).toLocaleDateString(locale, { dateStyle: 'long' }) : null,
    `${post!.viewCount} ${t('common.views')}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="mx-auto max-w-content px-4 py-10">
      <header className="border-b border-zinc-100 pb-8">
        {cat && (
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{cat}</span>
        )}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">{post!.title}</h1>
        <p className="mt-4 text-sm text-zinc-500">{meta}</p>
        {post!.author?.displayName && <p className="mt-2 text-sm text-zinc-600">{post!.author.displayName}</p>}
      </header>

      {post!.excerpt && (
        <div className="mt-8 rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-4 text-sm leading-relaxed text-zinc-700">
          <span className="font-medium text-zinc-900">{t('post.excerpt')}: </span>
          {post!.excerpt}
        </div>
      )}

      <div className="mt-10">
        <SafeHtml html={post!.htmlContent} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-zinc-100 pt-8">
        <button
          type="button"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:border-brand hover:text-brand"
          disabled
        >
          {t('post.like')}
        </button>
        <button
          type="button"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:border-brand hover:text-brand"
          disabled
        >
          {t('post.favorite')}
        </button>
        <button
          type="button"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:border-brand hover:text-brand"
          disabled
        >
          {t('post.share')}
        </button>
      </div>

      <div className="mt-10 flex justify-between gap-4 border-t border-zinc-100 pt-8 text-sm text-zinc-400">
        <span className="cursor-not-allowed">{t('post.prev')}</span>
        <span className="cursor-not-allowed">{t('post.next')}</span>
      </div>

      <section className="mt-14 border-t border-zinc-200 pt-10">
        <h2 className="text-lg font-bold text-zinc-900">{t('post.comments')}</h2>
        <div className="mt-6">
          {comments.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('post.noComments')}</p>
          ) : (
            <CommentThread nodes={comments} />
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-100 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-zinc-900">{t('post.commentTitle')}</h3>
          <textarea
            className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand"
            rows={4}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder={t('post.commentPlaceholder')}
          />
          {commentMsg && <p className="mt-2 text-xs text-amber-700">{commentMsg}</p>}
          <button
            type="button"
            className="mt-3 rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-hover"
            onClick={() => void submitComment()}
          >
            {t('post.commentSubmit')}
          </button>
        </div>
      </section>

      <p className="mt-12 text-center">
        <Link to="/" className="text-sm font-medium text-brand hover:underline">
          {t('post.allPosts')}
        </Link>
      </p>
    </article>
  );
}
