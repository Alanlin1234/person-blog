import { Injectable } from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const re = new RegExp(`(${escapeRegex(q.trim())})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, page = 1, pageSize = 10, userId?: string) {
    const term = q.trim();
    if (!term) return { items: [], total: 0, page, pageSize };

    if (userId) {
      await this.prisma.searchHistory.create({
        data: { userId, query: term.slice(0, 500) },
      });
    }

    const where: Prisma.PostWhereInput = {
      status: PostStatus.published,
      hidden: false,
      deletedAt: null,
      OR: [
        { title: { contains: term } },
        { htmlContent: { contains: term } },
        { tags: { some: { tag: { name: { contains: term } } } } },
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          viewCount: true,
          htmlContent: true,
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const items = rows.map((r) => {
      const snippetSource = r.excerpt || r.htmlContent.replace(/<[^>]+>/g, '').slice(0, 240);
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        publishedAt: r.publishedAt,
        viewCount: r.viewCount,
        tags: r.tags,
        snippet: highlight(snippetSource, term),
      };
    });

    return { items, total, page, pageSize };
  }

  async suggest(q: string) {
    const term = q.trim();
    if (term.length < 2) return { titles: [], tags: [] };

    const [titles, tags] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          status: PostStatus.published,
          hidden: false,
          deletedAt: null,
          title: { startsWith: term },
        },
        select: { title: true, slug: true },
        take: 8,
      }),
      this.prisma.tag.findMany({
        where: { name: { contains: term } },
        take: 8,
      }),
    ]);
    return { titles, tags };
  }

  async history(userId: string) {
    const rows = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { query: true, createdAt: true },
    });
    const seen = new Set<string>();
    const deduped = [];
    for (const r of rows) {
      if (seen.has(r.query)) continue;
      seen.add(r.query);
      deduped.push(r);
      if (deduped.length >= 20) break;
    }
    return deduped;
  }
}
