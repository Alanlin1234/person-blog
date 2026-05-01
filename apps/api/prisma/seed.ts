import { PrismaClient, PostStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_POSTS = [
  {
    slug: 'welcome',
    title: 'Welcome to Person Blog',
    excerpt: 'A minimal full-stack blog you can extend with your own ideas.',
    htmlContent: `<p>Person Blog combines <strong>NestJS</strong>, <strong>Prisma</strong>, and <strong>React</strong> in one repo.</p>
<p>Open <strong>Admin</strong> after login to create drafts, attach categories, and publish when you are ready.</p>
<ul><li>Search indexes published titles and HTML snippets.</li><li>Comments support moderation for public sites.</li></ul>`,
  },
  {
    slug: 'writing-in-the-editor',
    title: 'Writing in the editor',
    excerpt: 'Drafts, versions, and publishing — how the authoring flow fits together.',
    htmlContent: `<p>The admin post editor stores <strong>HTML</strong>. Sanitization runs on the server before save.</p><p>Publish to move a post to the public list; archived posts stay out of the feed.</p>`,
  },
  {
    slug: 'stack-overview',
    title: 'Stack overview',
    excerpt: 'What ships in the box: API modules, auth, comments, search, and uploads.',
    htmlContent: `<p>JWT auth with refresh cookies, RBAC, posts with versions, taxonomy, comments, search, media uploads, and backups.</p><p>Dev uses SQLite by default; switch <code>DATABASE_URL</code> for MySQL in production.</p>`,
  },
];

async function main() {
  const roles = ['user', 'admin'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!@#';
  const hash = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hash,
      emailVerifiedAt: new Date(),
      displayName: 'Site Admin',
    },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const userRole = await prisma.role.findUniqueOrThrow({ where: { name: 'user' } });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: userRole.id } },
    update: {},
    create: { userId: admin.id, roleId: userRole.id },
  });

  for (const d of DEMO_POSTS) {
    const existing = await prisma.post.findUnique({ where: { slug: d.slug } });
    if (existing) continue;
    await prisma.post.create({
      data: {
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        htmlContent: d.htmlContent,
        status: PostStatus.published,
        publishedAt: new Date(),
        authorId: admin.id,
        viewCount: 0,
      },
    });
  }

  console.log('Seed OK. Admin:', adminEmail, '/ password:', adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
