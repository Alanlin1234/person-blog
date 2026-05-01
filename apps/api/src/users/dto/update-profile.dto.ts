import { IsOptional, IsString, MaxLength, IsIn, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  contacts?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  social?: Record<string, string>;

  @ApiPropertyOptional({ enum: ['light', 'dark', 'sepia'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'sepia'])
  themePreference?: string;
}
