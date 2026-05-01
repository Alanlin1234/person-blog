import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ReauthDto } from './dto/reauth.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() u: JwtUser) {
    return this.users.me(u.userId);
  }

  @Patch('me')
  update(@CurrentUser() u: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(u.userId, dto);
  }

  @Post('me/reauth')
  reauth(@CurrentUser() u: JwtUser, @Body() dto: ReauthDto) {
    return this.users.verifyPassword(u.userId, dto.password);
  }
}
