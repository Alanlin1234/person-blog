import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @Post()
  create(@CurrentUser() u: JwtUser, @Body() dto: CreateCommentDto) {
    return this.comments.create(u.userId, dto);
  }

  @Post(':id/like')
  like(@CurrentUser() u: JwtUser, @Param('id') id: string) {
    return this.comments.like(u.userId, id);
  }

  @Post(':id/report')
  report(@CurrentUser() u: JwtUser, @Param('id') id: string, @Body() dto: ReportCommentDto) {
    return this.comments.report(u.userId, id, dto.reason);
  }
}
