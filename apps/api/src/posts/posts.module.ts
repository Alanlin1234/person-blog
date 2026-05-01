import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PublicPostsController } from './public-posts.controller';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [CommentsModule],
  controllers: [PublicPostsController, PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
