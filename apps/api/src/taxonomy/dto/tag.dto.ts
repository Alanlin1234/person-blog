import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;
}

export class RenameTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
