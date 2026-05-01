import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  runSearch(@Query('q') q: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.searchService.search(q || '', Number(page) || 1, Number(pageSize) || 10, undefined);
  }

  @Public()
  @Get('suggest')
  suggest(@Query('q') q: string) {
    return this.searchService.suggest(q || '');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  history(@CurrentUser() u: JwtUser) {
    return this.searchService.history(u.userId);
  }
}
