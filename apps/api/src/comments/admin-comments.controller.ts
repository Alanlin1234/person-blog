import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CommentsService } from './comments.service';

@ApiTags('admin-comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/comments')
export class AdminCommentsController {
  constructor(private comments: CommentsService) {}

  @Get('pending')
  pending() {
    return this.comments.listPending();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.comments.moderate(id, 'approve');
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.comments.moderate(id, 'reject');
  }

  @Post(':id/delete')
  deleteC(@Param('id') id: string) {
    return this.comments.moderate(id, 'delete');
  }
}
