import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizePostHtml } from '../common/utils/sanitize-html';
import { slugify } from '../common/utils/slug';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { RedisService } from '../redis/redis.service';
import { createHash } from 'crypto';
import { Request } from 'express';

const SPIDER_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|curl|wget/i;

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async isAdmin(userId: string) {
    const r = await this.prisma.userRole.findFirst({
      where: { userId, role: { name: 'admin' } },
    });
    return !!r;
  }

  private async ensureAuthor(postId: string, userId: string) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    const admin = await this.isAdmin(userId);
    if (post.authorId !== userId && !admin) throw new ForbiddenException();
    return post;
  }

  private async recordVersion(postId: string, html: string) {
    const last = await this.prisma.postVersion.findFirst({
      where: { postId },
      orderBy: { versionNo: 'desc' },
    });
    const versionNo = (last?.versionNo ?? 0) + 1;
    await this.prisma.postVersion.create({
      data: { postId, versionNo, snapshotHtml: html },
    });
    const old = await this.prisma.postVersion.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
      skip: 5,
    });
    if (old.length) {
      await this.prisma.postVersion.deleteMany({
        where: { id: { in: old.map((o: { id: string }) => o.id) } },
      });
    }
  }

  async create(userId: string, dto: CreatePostDto) {
    const html = sanitizePostHtml(dto.htmlContent);
    let slug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
    const exists = await this.prisma.post.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        htmlContent: html,
        excerpt: dto.excerpt,
        status: dto.status ?? PostStatus.draft,
        authorId: userId,
        categories:
          dto.categoryIds && dto.categoryIds.length
            ? { create: dto.categoryIds.map((id) => ({ categoryId: id })) }
            : undefined,
        tags:
          dto.tagIds && dto.tagIds.length ? { create: dto.tagIds.map((id) => ({ tagId: id })) } : undefined,
      },
      include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
    });
    await this.recordVersion(post.id, html);
    return post;
  }

  async update(userId: string, id: string, dto: UpdatePostDto) {
    await this.ensureAuthor(id, userId);
    const data: Prisma.PostUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.htmlContent !== undefined) data.htmlContent = sanitizePostHtml(dto.htmlContent);
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        categories:
          dto.categoryIds !== undefined
            ? { deleteMany: {}, create: dto.categoryIds.map((cid) => ({ categoryId: cid })) }
            : undefined,
        tags:
          dto.tagIds !== undefined
            ? { deleteMany: {}, create: dto.tagIds.map((tid) => ({ tagId: tid })) }
            : undefined,
      },
      include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
    });
    if (dto.htmlContent !== undefined) await this.recordVersion(id, post.htmlContent);
    return post;
  }

  async listMine(userId: string, status?: PostStatus, page = 1, pageSize = 20) {
    const where: Prisma.PostWhereInput = { authorId: userId, deletedAt: null };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(userId: string, id: string) {
    await this.ensureAuthor(id, userId);
    return this.prisma.post.findUnique({
      where: { id },
      include: { categories: { include: { category: true } }, tags: { include: { tag: true } }, versions: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
  }

  async publish(userId: string, id: string) {
    await this.ensureAuthor(id, userId);
    return this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.published, publishedAt: new Date() },
      include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
    });
  }

  async archive(userId: string, id: string) {
    await this.ensureAuthor(id, userId);
    return this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.archived },
    });
  }

  async setPinned(userId: string, id: string, pinned: boolean) {
    await this.ensureAuthor(id, userId);
    return this.prisma.post.update({ where: { id }, data: { pinned } });
  }

  async setHidden(userId: string, id: string, hidden: boolean) {
    await this.ensureAuthor(id, userId);
    return this.prisma.post.update({ where: { id }, data: { hidden } });
  }

  async remove(userId: string, id: string) {
    await this.ensureAuthor(id, userId);
    return this.prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listPublic(page = 1, pageSize = 10) {
    const where: Prisma.PostWhereInput = {
      status: PostStatus.published,
      hidden: false,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          viewCount: true,
          pinned: true,
          tags: { include: { tag: true } },
          categories: { include: { category: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getPublicBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        status: PostStatus.published,
        hidden: false,
        deletedAt: null,
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        categories: { include: { category: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  viewerHash(req: Request, userId?: string): string {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    const ua = req.headers['user-agent'] || '';
    const base = userId ? `u:${userId}` : `a:${ip}|${ua}`;
    return createHash('sha256').update(base).digest('hex').slice(0, 64);
  }

  async recordView(slug: string, req: Request, userId?: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        status: PostStatus.published,
        hidden: false,
        deletedAt: null,
      },
    });
    if (!post) throw new NotFoundException();

    const ua = req.headers['user-agent'] || '';
    if (SPIDER_UA.test(ua)) return { counted: false, viewCount: post.viewCount };

    const vh = this.viewerHash(req, userId);
    const redis = this.redis.get();
    if (redis) {
      const key = `view:${post.id}:${vh}`;
      const nx = await this.redis.setNxEx(key, '1', 86400);
      if (!nx) return { counted: false, viewCount: post.viewCount };
    } else {
      const row = await this.prisma.postViewDedup.findUnique({
        where: { post_view_dedup_uniq: { postId: post.id, viewerHash: vh } },
      });
      if (row && row.expiresAt > new Date()) {
        return { counted: false, viewCount: post.viewCount };
      }
      const expiresAt = new Date(Date.now() + 86400 * 1000);
      await this.prisma.postViewDedup.upsert({
        where: { post_view_dedup_uniq: { postId: post.id, viewerHash: vh } },
        create: { postId: post.id, viewerHash: vh, expiresAt },
        update: { expiresAt },
      });
    }

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return { counted: true, viewCount: updated.viewCount };
  }
}
