import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png']);
const MAX = 2 * 1024 * 1024;

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = process.env.UPLOAD_DIR || './uploads';
          const av = join(process.cwd(), dir, 'avatars');
          if (!existsSync(av)) mkdirSync(av, { recursive: true });
          cb(null, av);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED.has(ext)) return cb(new BadRequestException('Only jpg/png allowed'), false);
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(@CurrentUser() u: JwtUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file');
    const base = this.config.get<string>('API_URL') || 'http://localhost:3000';
    const urlPath = `/uploads/avatars/${file.filename}`;
    const avatarUrl = `${base}${urlPath}`;
    await this.prisma.user.update({
      where: { id: u.userId },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }
}
