import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/slug';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTagDto, RenameTagDto } from './dto/tag.dto';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
};

type CategoryTree = CategoryRow & { children: CategoryTree[] };

@Injectable()
export class TaxonomyService {
  constructor(private prisma: PrismaService) {}

  async tree() {
    const all = await this.prisma.category.findMany({ orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }] });
    return this.buildTree(all, null);
  }

  private buildTree(flat: CategoryRow[], parentId: string | null): CategoryTree[] {
    return flat
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        children: this.buildTree(flat, c.id),
      }));
  }

  async createCategory(dto: CreateCategoryDto) {
    let slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    if (dto.parentId) {
      const p = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!p) throw new BadRequestException('Invalid parent');
    }
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = slugify(dto.slug);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new BadRequestException('Cannot set self as parent');
      if (dto.parentId) await this.assertNoCycle(id, dto.parentId);
      data.parentId = dto.parentId;
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  private async assertNoCycle(categoryId: string, newParentId: string) {
    let cur: string | null = newParentId;
    let depth = 0;
    while (cur && depth < 50) {
      if (cur === categoryId) throw new BadRequestException('Cycle detected');
      const row: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: cur },
        select: { parentId: true },
      });
      cur = row?.parentId ?? null;
      depth++;
    }
  }

  async deleteCategory(id: string) {
    const children = await this.prisma.category.count({ where: { parentId: id } });
    if (children) throw new BadRequestException('Remove children first');
    await this.prisma.postCategory.deleteMany({ where: { categoryId: id } });
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  async listTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async createTag(dto: CreateTagDto) {
    let slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const exists = await this.prisma.tag.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    return this.prisma.tag.create({ data: { name: dto.name, slug } });
  }

  async renameTag(id: string, dto: RenameTagDto) {
    const slug = slugify(dto.name);
    return this.prisma.tag.update({
      where: { id },
      data: { name: dto.name, slug },
    });
  }

  async deleteTag(id: string) {
    await this.prisma.postTag.deleteMany({ where: { tagId: id } });
    await this.prisma.tag.delete({ where: { id } });
    return { ok: true };
  }
}
