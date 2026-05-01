import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { TaxonomyService } from './taxonomy.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTagDto, RenameTagDto } from './dto/tag.dto';

@ApiTags('taxonomy')
@Controller('taxonomy')
export class TaxonomyController {
  constructor(private taxonomy: TaxonomyService) {}

  @Public()
  @Get('categories')
  categories() {
    return this.taxonomy.tree();
  }

  @Public()
  @Get('tags')
  tags() {
    return this.taxonomy.listTags();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('categories')
  createCat(@Body() dto: CreateCategoryDto) {
    return this.taxonomy.createCategory(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('categories/:id')
  updateCat(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.taxonomy.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('categories/:id')
  deleteCat(@Param('id') id: string) {
    return this.taxonomy.deleteCategory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('tags')
  createTag(@Body() dto: CreateTagDto) {
    return this.taxonomy.createTag(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('tags/:id')
  renameTag(@Param('id') id: string, @Body() dto: RenameTagDto) {
    return this.taxonomy.renameTag(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('tags/:id')
  deleteTag(@Param('id') id: string) {
    return this.taxonomy.deleteTag(id);
  }
}
