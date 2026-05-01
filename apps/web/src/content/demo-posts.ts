/**
 * Offline / fallback content when the API is unreachable. Slugs match prisma/seed.ts demo posts.
 */
import type { Lang } from '../i18n/I18nProvider';

export type DemoPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string;
  viewCount: number;
  htmlContent: string;
};

export const DEMO_POSTS_EN: DemoPost[] = [
  {
    id: 'demo-welcome',
    title: 'Welcome to Person Blog',
    slug: 'welcome',
    excerpt: 'A minimal full-stack blog you can extend with your own ideas.',
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    htmlContent: `
      <p>Person Blog combines <strong>NestJS</strong>, <strong>Prisma</strong>, and <strong>React</strong> in one repo.</p>
      <p>When the API is running, this list loads from your database. If you see this card while online, check that the backend is started on port <code>3000</code> and that <code>npm run dev</code> is proxying <code>/api</code>.</p>
      <ul>
        <li>Use <strong>Admin</strong> to write and publish posts.</li>
        <li>Use <strong>Search</strong> to try full-text style queries.</li>
        <li>Run <code>npx prisma db seed</code> in <code>apps/api</code> to create the seeded admin and sample posts.</li>
      </ul>
    `,
  },
  {
    id: 'demo-editor',
    title: 'Writing in the editor',
    slug: 'writing-in-the-editor',
    excerpt: 'Drafts, versions, and publishing — how the authoring flow fits together.',
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    htmlContent: `
      <p>The admin post editor stores <strong>HTML</strong> content. Sanitization runs on the server before save, so stick to common tags for the safest experience.</p>
      <p>Try a short draft, preview changes, then hit publish to move a post to the public list.</p>
    `,
  },
  {
    id: 'demo-stack',
    title: 'Stack overview',
    slug: 'stack-overview',
    excerpt: 'What ships in the box: API modules, auth, comments, search, and uploads.',
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    htmlContent: `
      <p>Out of the box you get JWT auth with refresh cookies, role-based access, posts with versions, taxonomy, comments, search history, media uploads, and scheduled backups (SQL dump or SQLite file copy).</p>
      <p>Swap SQLite for MySQL in production by changing Prisma and <code>DATABASE_URL</code>.</p>
    `,
  },
];

const DEMO_POSTS_ZH: DemoPost[] = [
  {
    id: 'demo-welcome',
    title: '欢迎使用 Person Blog',
    slug: 'welcome',
    excerpt: '一套可扩展的全栈个人博客骨架。',
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    htmlContent: `
      <p>Person Blog 将 <strong>NestJS</strong>、<strong>Prisma</strong> 与 <strong>React</strong> 放在同一仓库中。</p>
      <p>接口正常时，列表来自数据库。若已联网仍看到此卡片，请确认后端在 <code>3000</code> 端口运行，且 <code>npm run dev</code> 将 <code>/api</code> 代理到后端。</p>
      <ul>
        <li>在 <strong>管理</strong> 中撰写并发布文章。</li>
        <li>使用 <strong>搜索</strong> 尝试关键词检索。</li>
        <li>在 <code>apps/api</code> 执行 <code>npx prisma db seed</code> 可创建管理员与示例文章。</li>
      </ul>
    `,
  },
  {
    id: 'demo-editor',
    title: '在编辑器中写作',
    slug: 'writing-in-the-editor',
    excerpt: '草稿、版本与发布流程简介。',
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    htmlContent: `
      <p>后台编辑器保存 <strong>HTML</strong>，保存前由服务端做消毒，建议使用常见安全标签。</p>
      <p>可先写短草稿、预览修改，再发布到公开列表。</p>
    `,
  },
  {
    id: 'demo-stack',
    title: '技术栈概览',
    slug: 'stack-overview',
    excerpt: '内置模块：认证、文章、分类、评论、搜索与上传等。',
    publishedAt: new Date().toISOString(),
    viewCount: 0,
    htmlContent: `
      <p>默认包含 JWT 与刷新 Cookie、角色权限、文章版本、分类与标签、评论、搜索历史、媒体上传，以及定时备份（MySQL dump 或 SQLite 文件复制）。</p>
      <p>生产环境可将 Prisma 与 <code>DATABASE_URL</code> 切换为 MySQL。</p>
    `,
  },
];

export function demoPostsList(lang: Lang): DemoPost[] {
  return lang === 'zh' ? DEMO_POSTS_ZH : DEMO_POSTS_EN;
}

export function getDemoPostBySlug(slug: string, lang: Lang): DemoPost | undefined {
  return demoPostsList(lang).find((p) => p.slug === slug);
}

export function demoPostsForHome(lang: Lang): Pick<
  DemoPost,
  'id' | 'title' | 'slug' | 'excerpt' | 'publishedAt' | 'viewCount'
>[] {
  return demoPostsList(lang).map(({ id, title, slug, excerpt, publishedAt, viewCount }) => ({
    id,
    title,
    slug,
    excerpt,
    publishedAt,
    viewCount,
  }));
}

/** @deprecated use demoPostsForHome(lang) */
export const DEMO_POSTS = DEMO_POSTS_EN;
