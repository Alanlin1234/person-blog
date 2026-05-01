import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { PostsService } from './posts.service';
import { Public } from '../common/decorators/public.decorator';
import { CommentsService } from '../comments/comments.service';

@ApiTags('posts-public')
@Controller('public/posts')
export class PublicPostsController {
  constructor(
    private posts: PostsService,
    private commentsService: CommentsService,
  ) {}

  @Public()
  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.posts.listPublic(Number(page) || 1, Number(pageSize) || 10);
  }

  @Public()
  @Get(':slug/comments')
  listComments(@Param('slug') slug: string) {
    return this.commentsService.listForPost(slug);
  }

  @Public()
  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.posts.getPublicBySlug(slug);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post(':slug/views')
  view(@Param('slug') slug: string, @Req() req: Request) {
    return this.posts.recordView(slug, req);
  }
}
