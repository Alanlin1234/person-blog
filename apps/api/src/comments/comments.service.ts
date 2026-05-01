import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

const MAX_DEPTH = 5;

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  private stripHtml(s: string) {
    return s.replace(/<[^>]+>/g, '').slice(0, 5000);
  }

  private async depthOfComment(commentId: string): Promise<number> {
    const c = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { parentId: true },
    });
    if (!c) return 0;
    if (!c.parentId) return 1;
    return 1 + (await this.depthOfComment(c.parentId));
  }

  async create(userId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findFirst({
      where: { id: dto.postId, status: PostStatus.published, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (dto.parentId) {
      const parentDepth = await this.depthOfComment(dto.parentId);
      if (parentDepth >= MAX_DEPTH) throw new BadRequestException('Max reply depth exceeded');
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, postId: dto.postId },
      });
      if (!parent) throw new BadRequestException('Invalid parent comment');
    }
    const body = this.stripHtml(dto.body);
    const comment = await this.prisma.comment.create({
      data: {
        postId: dto.postId,
        userId,
        parentId: dto.parentId,
        body,
        status: CommentStatus.pending,
      },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    const author = await this.prisma.user.findUnique({ where: { id: post.authorId } });
    if (author && author.id !== userId) {
      await this.notifications.notify(author.id, 'comment_new', {
        postId: post.id,
        slug: post.slug,
        commentId: comment.id,
      });
      const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:5173';
      await this.mail.send(
        author.email,
        'New comment on your post',
        `<p>New comment pending moderation on "${post.title}".</p><p><a href="${appUrl}/admin">Open admin</a></p>`,
      );
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        include: { user: true },
      });
      if (parent && parent.userId !== userId) {
        await this.notifications.notify(parent.userId, 'comment_reply', {
          postId: post.id,
          slug: post.slug,
          commentId: comment.id,
        });
        await this.mail.send(
          parent.user.email,
          'Your comment received a reply',
          `<p>Someone replied to your comment on "${post.title}".</p>`,
        );
      }
    }

    return comment;
  }

  async listForPost(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: PostStatus.published, deletedAt: null },
    });
    if (!post) throw new NotFoundException();
    const flat = await this.prisma.comment.findMany({
      where: { postId: post.id, status: CommentStatus.approved },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    return this.nest(flat, null);
  }

  private nest(
    flat: Array<{ id: string; parentId: string | null; replies?: unknown[] } & Record<string, unknown>>,
    parentId: string | null,
  ): Array<Record<string, unknown>> {
    return flat
      .filter((c) => c.parentId === parentId)
      .map((c) => ({ ...c, replies: this.nest(flat, c.id) }));
  }

  async like(userId: string, commentId: string) {
    const c = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!c) throw new NotFoundException();
    const existing = await this.prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    if (existing) {
      await this.prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
      return { liked: false };
    }
    await this.prisma.commentLike.create({ data: { commentId, userId } });
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
    });
    return { liked: true };
  }

  async report(userId: string, commentId: string, reason?: string) {
    await this.prisma.commentReport.create({
      data: { commentId, reporterId: userId, reason },
    });
    return { ok: true };
  }

  async listPending() {
    return this.prisma.comment.findMany({
      where: { status: CommentStatus.pending },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async moderate(id: string, action: 'approve' | 'reject' | 'delete') {
    if (action === 'delete') {
      await this.prisma.comment.delete({ where: { id } });
      return { ok: true };
    }
    const status = action === 'approve' ? CommentStatus.approved : CommentStatus.rejected;
    return this.prisma.comment.update({ where: { id }, data: { status } });
  }
}
