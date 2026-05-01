import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private posts: PostsService) {}

  @Post()
  create(@CurrentUser() u: JwtUser, @Body() dto: CreatePostDto) {
    return this.posts.create(u.userId, dto);
  }

  @Get('mine')
  listMine(
    @CurrentUser() u: JwtUser,
    @Query('status') status?: PostStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.posts.listMine(u.userId, status, Number(page) || 1, Number(pageSize) || 20);
  }

  @Get(':id')
  get(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.posts.getById(u.userId, id);
  }

  @Patch(':id')
  update(@CurrentUser() u: JwtUser, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.posts.update(u.userId, id, dto);
  }

  @Post(':id/publish')
  publish(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.posts.publish(u.userId, id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.posts.archive(u.userId, id);
  }

  @Post(':id/pin')
  pin(@CurrentUser() u: JwtUser, @Param('id') id: string, @Body('pinned') pinned: boolean) {
    return this.posts.setPinned(u.userId, id, Boolean(pinned));
  }

  @Post(':id/hide')
  hide(@CurrentUser() u: JwtUser, @Param('id') id: string, @Body('hidden') hidden: boolean) {
    return this.posts.setHidden(u.userId, id, Boolean(hidden));
  }

  @Delete(':id')
  remove(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.posts.remove(u.userId, id);
  }
}
